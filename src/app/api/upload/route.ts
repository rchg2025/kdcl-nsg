import { NextRequest, NextResponse } from "next/server"
import { uploadFileToDrive } from "@/lib/drive"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const maxDuration = 60 // Allow up to 60s for large file uploads

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const files = formData.getAll("file") as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Chưa cung cấp file" }, { status: 400 })
    }

    const viewLinks = await Promise.all(files.map(async (file) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const viewLink = await uploadFileToDrive(buffer, file.name, file.type)
      if (!viewLink) throw new Error("Lỗi lấy Link từ Google Drive cho file: " + file.name)
      return viewLink
    }))

    return NextResponse.json({ url: viewLinks.join(", ") }, { status: 200 })
  } catch (err: any) {
    console.error("Lỗi Tải lên nội bộ:", err)
    return NextResponse.json({ error: err.message || "Có lỗi bất ngờ khi tải dữ liệu lên GD" }, { status: 500 })
  }
}
