import { NextRequest, NextResponse } from "next/server"
import { uploadFileToDrive } from "@/lib/drive"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    
    if (!file) {
      return NextResponse.json({ error: "Chưa cung cấp file" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const viewLink = await uploadFileToDrive(buffer, file.name, file.type)

    if (!viewLink) throw new Error("Lỗi lấy Link từ Google Drive")

    return NextResponse.json({ url: viewLink }, { status: 200 })
  } catch (err: any) {
    console.error("Lỗi Tải lên nội bộ:", err)
    return NextResponse.json({ error: err.message || "Có lỗi bất ngờ khi tải dữ liệu lên GD" }, { status: 500 })
  }
}
