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
            items: true
          }
        }
      }
    })

    // Xây dựng chuỗi Context
    let contextStr = "DỮ LIỆU HỆ THỐNG ĐẢM BẢO CHẤT LƯỢNG:\n\n"
    for (const std of standards) {
      contextStr += `Tiêu chuẩn: ${std.name} - ${std.description || ""} (Link: /admin/criteria/${std.id})\n`
      for (const cri of std.criteria) {
        contextStr += `  + Tiêu chí: ${cri.name} - ${cri.description || ""}\n`
        if (cri.items.length > 0) {
          contextStr += `    Các yêu cầu minh chứng (Items):\n`
          for (const item of cri.items) {
            contextStr += `      - ${item.name}: ${item.description || ""}\n`
          }
        }
      }
      contextStr += "\n"
    }

    const systemInstruction = `Bạn là trợ lý AI chuyên môn về Đảm bảo chất lượng (QA) của trường học/tổ chức.
Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng một cách NGẮN GỌN, CHÍNH XÁC và DỄ HIỂU dựa trên DỮ LIỆU HỆ THỐNG được cung cấp bên dưới.
Nếu người dùng hỏi thông tin không có trong DỮ LIỆU HỆ THỐNG, hãy lịch sự từ chối hoặc nói rằng bạn không có thông tin về vấn đề đó trong hệ thống tiêu chí hiện tại. Hãy dùng định dạng Markdown để câu trả lời được đẹp mắt.

QUAN TRỌNG: Khi bạn cung cấp thông tin về bất kỳ Tiêu chuẩn nào, hãy LUÔN LUÔN chèn link (dạng Markdown) dẫn đến Tiêu chuẩn đó dựa vào (Link: ...) được cung cấp trong dữ liệu. Ví dụ: [Tiêu chuẩn 1](/admin/criteria/clabc123). Nếu người dùng hỏi về Tiêu chí, bạn cũng nên đính kèm link của Tiêu chuẩn chứa Tiêu chí đó để họ bấm vào xem chi tiết.

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
