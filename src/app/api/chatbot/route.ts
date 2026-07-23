import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSettings } from "@/actions/setting"
import { GoogleGenAI } from "@google/genai"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages" }, { status: 400 })
    }

    // 1. Lấy cấu hình Chatbot
    const settings = await getSettings()
    if (settings["CHATBOT_ENABLED"] !== "true") {
      return NextResponse.json({ error: "Chatbot AI hiện đang bị vô hiệu hoá." }, { status: 403 })
    }

    const apiKey = settings["CHATBOT_API_KEY"] || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Chưa cấu hình Gemini API Key. Vui lòng liên hệ Admin." }, { status: 500 })
    }

    // 2. Truy xuất dữ liệu (Retrieval - RAG)
    // Lấy danh sách Tiêu chuẩn, Tiêu chí, Minh chứng để làm ngữ cảnh
    const standards = await prisma.standard.findMany({
      include: {
        criteria: {
          include: {
            items: {
              include: {
                evidences: {
                  include: { 
                    collaborator: true,
                    reviewer: true,
                    evaluations: {
                      include: { evaluator: true }
                    }
                  }
                }
              }
            },
            evidences: {
              where: { evidenceItemId: null },
              include: { 
                collaborator: true,
                reviewer: true,
                evaluations: {
                  include: { evaluator: true }
                }
              }
            }
          }
        }
      }
    })

    // Tính toán thống kê cơ bản
    let totalStandards = standards.length
    let totalCriteria = 0
    let totalItems = 0
    let evPending = 0
    let evApproved = 0
    let evRejected = 0

    // Xây dựng chuỗi Context
    let contextStr = "DỮ LIỆU HỆ THỐNG ĐẢM BẢO CHẤT LƯỢNG:\n\n"
    
    let detailsStr = ""
    for (const std of standards) {
      detailsStr += `Tiêu chuẩn: ${std.name} - ${std.description || ""} (Link: /admin/criteria/${std.id})\n`
      totalCriteria += std.criteria.length
      
      for (const cri of std.criteria) {
        detailsStr += `  + Tiêu chí: ${cri.name} - ${cri.description || ""}\n`
        totalItems += cri.items.length
        
        // Minh chứng chung của Tiêu chí
        if (cri.evidences && cri.evidences.length > 0) {
          detailsStr += `    Tài liệu minh chứng chung cho Tiêu chí này:\n`
          for (const ev of cri.evidences) {
            if (ev.status === 'PENDING') evPending++
            if (ev.status === 'APPROVED') evApproved++
            if (ev.status === 'REJECTED') evRejected++
            
            detailsStr += `      - File/Nội dung: ${ev.content || "Tệp đính kèm"} ${ev.fileUrl ? `(Link tài liệu: ${ev.fileUrl})` : ''} | Trạng thái: ${ev.status} | Người nộp: ${ev.collaborator?.name || "Ẩn danh"}\n`
            if (ev.status === 'REJECTED' && ev.rejectReason) {
              detailsStr += `        Lý do từ chối: ${ev.rejectReason} (Người duyệt: ${ev.reviewer?.name || "Ẩn danh"})\n`
            }
            if (ev.evaluations && ev.evaluations.length > 0) {
              for (const evalRecord of ev.evaluations) {
                detailsStr += `        Đánh giá: ${evalRecord.isApproved ? 'Đạt' : 'Không đạt'} - Nhận xét: ${evalRecord.comments || ""} (Người đánh giá: ${evalRecord.evaluator?.name || "Ẩn danh"})\n`
              }
            }
          }
        }

        if (cri.items.length > 0) {
          detailsStr += `    Danh sách các yêu cầu minh chứng:\n`
          for (const item of cri.items) {
            detailsStr += `      - ${item.name}: ${item.description || ""}\n`
            if (item.evidences && item.evidences.length > 0) {
              detailsStr += `        Tài liệu đã nộp cho yêu cầu này:\n`
              for (const ev of item.evidences) {
                if (ev.status === 'PENDING') evPending++
                if (ev.status === 'APPROVED') evApproved++
                if (ev.status === 'REJECTED') evRejected++
                
                detailsStr += `          * File/Nội dung: ${ev.content || "Tệp đính kèm"} ${ev.fileUrl ? `(Link tài liệu: ${ev.fileUrl})` : ''} | Trạng thái: ${ev.status} | Người nộp: ${ev.collaborator?.name || "Ẩn danh"}\n`
                if (ev.status === 'REJECTED' && ev.rejectReason) {
                  detailsStr += `            Lý do từ chối: ${ev.rejectReason} (Người duyệt: ${ev.reviewer?.name || "Ẩn danh"})\n`
                }
                if (ev.evaluations && ev.evaluations.length > 0) {
                  for (const evalRecord of ev.evaluations) {
                    detailsStr += `            Đánh giá: ${evalRecord.isApproved ? 'Đạt' : 'Không đạt'} - Nhận xét: ${evalRecord.comments || ""} (Người đánh giá: ${evalRecord.evaluator?.name || "Ẩn danh"})\n`
                  }
                }
              }
            }
          }
        }
      }
      detailsStr += "\n"
    }

    // Ghép thống kê vào Context
    contextStr += `THỐNG KÊ TỔNG QUAN:\n- Tổng số Tiêu chuẩn: ${totalStandards}\n- Tổng số Tiêu chí: ${totalCriteria}\n- Tổng số Yêu cầu minh chứng: ${totalItems}\n- Minh chứng Đang chờ duyệt (PENDING): ${evPending}\n- Minh chứng Đã duyệt (APPROVED): ${evApproved}\n- Minh chứng Bị từ chối (REJECTED): ${evRejected}\n\n`
    contextStr += detailsStr

    const systemInstruction = `Bạn là trợ lý AI chuyên môn về Đảm bảo chất lượng (QA) của trường học/tổ chức.
Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng một cách NGẮN GỌN, CHÍNH XÁC và DỄ HIỂU dựa trên DỮ LIỆU HỆ THỐNG được cung cấp bên dưới.
Nếu người dùng hỏi thông tin không có trong DỮ LIỆU HỆ THỐNG, hãy lịch sự từ chối hoặc nói rằng bạn không có thông tin về vấn đề đó trong hệ thống tiêu chí hiện tại. Hãy dùng định dạng Markdown để câu trả lời được đẹp mắt.

QUAN TRỌNG: Khi bạn cung cấp thông tin về bất kỳ Tiêu chuẩn nào, hãy LUÔN LUÔN chèn link (dạng Markdown) dẫn đến Tiêu chuẩn đó dựa vào (Link: ...) được cung cấp trong dữ liệu. Ví dụ: [Tiêu chuẩn 1](/admin/criteria/clabc123). Nếu người dùng hỏi về Tiêu chí, bạn cũng nên đính kèm link của Tiêu chuẩn chứa Tiêu chí đó để họ bấm vào xem chi tiết.
ĐẶC BIỆT QUAN TRỌNG: Khi nhắc đến hoặc liệt kê bất kỳ tài liệu, minh chứng nào có chứa (Link tài liệu: ...), bạn BẮT BUỘC phải tạo liên kết dạng Markdown để người dùng bấm vào xem được tài liệu đó. Ví dụ: [Kế hoạch khảo sát](https://kdcl.nsgpc.edu.vn/.../file.pdf).

CỰC KỲ QUAN TRỌNG: Ở cuối MỖI câu trả lời, bạn PHẢI phân tích câu hỏi và câu trả lời hiện tại, để suy luận và đưa ra 2 đến 3 câu hỏi gợi ý thông minh tiếp theo (liên quan trực tiếp đến vấn đề đang nói) giúp người dùng hỏi tiếp.
Để làm được điều này, hãy luôn nối chuỗi "---SUGGESTIONS---" vào cuối câu trả lời của bạn, và sau đó liệt kê mỗi câu hỏi gợi ý trên một dòng riêng biệt. (Lưu ý: Không dùng markdown list '-', '*', số thứ tự 1. 2. ở danh sách gợi ý này).

Ví dụ cấu trúc trả lời:
(Nội dung câu trả lời của bạn bao gồm các link tài liệu [Tên tài liệu](Link)...)
---SUGGESTIONS---
Bạn có muốn xem chi tiết minh chứng của tiêu chuẩn này không?
Tiến độ duyệt minh chứng của tiêu chuẩn này thế nào?

DỮ LIỆU HỆ THỐNG:
${contextStr}
`

    // 3. Gọi Gemini API
    const ai = new GoogleGenAI({ apiKey })
    
    // Convert messages to GenAI format if needed
    // The request messages format is likely { role: 'user' | 'model', content: string }
    const formattedMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }))

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedMessages,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for factual QA
      }
    })

    return NextResponse.json({
      role: "model",
      content: response.text
    })
  } catch (error: any) {
    console.error("Chatbot Error:", error)
    return NextResponse.json({ error: error.message || "Đã xảy ra lỗi hệ thống." }, { status: 500 })
  }
}
