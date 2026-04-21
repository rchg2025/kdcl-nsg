import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadFileToDrive } from "@/lib/drive"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch (parseErr: any) {
      return NextResponse.json(
        { error: "Không thể đọc dữ liệu tệp tin. File có thể quá lớn (tối đa ~4.5MB)." },
        { status: 413 }
      )
    }

    const files = formData.getAll("file") as File[]
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Chưa cung cấp file" }, { status: 400 })
    }

    const viewLinks: string[] = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const viewLink = await uploadFileToDrive(buffer, file.name, file.type || "application/octet-stream")
      if (!viewLink) {
        throw new Error("Google Drive không trả về link xem cho tệp: " + file.name)
      }
      viewLinks.push(viewLink)
    }

    return NextResponse.json({ url: viewLinks.join(", ") })
  } catch (err: any) {
    console.error("Upload route error:", err?.message || err)
    const message = err?.message || "Lỗi không xác định khi tải tệp lên"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
