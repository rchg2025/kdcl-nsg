import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { google } from "googleapis"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { name, mimeType } = await request.json()

    const emailSetting = await prisma.systemSetting.findUnique({ where: { key: "GDRIVE_CLIENT_EMAIL" } })
    const keySetting = await prisma.systemSetting.findUnique({ where: { key: "GDRIVE_PRIVATE_KEY" } })
    const folderSetting = await prisma.systemSetting.findUnique({ where: { key: "GDRIVE_FOLDER_ID" } })

    if (!emailSetting || !keySetting || !folderSetting) {
      return NextResponse.json({ error: "Chưa cấu hình Google Drive" }, { status: 500 })
    }

    let parsedKey = (keySetting.value || "").trim()
    if (parsedKey.startsWith('{') && parsedKey.endsWith('}')) {
      try {
        const json = JSON.parse(parsedKey)
        if (json.private_key) parsedKey = json.private_key
      } catch(e) {}
    }
    const privateKey = parsedKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\r/g, '')

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: emailSetting.value,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    })

    const client = await auth.getClient()
    const token = await client.getAccessToken()

    const folderId = folderSetting.value

    // Create Resumable Upload Session on Server side
    const initRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": mimeType
      },
      body: JSON.stringify({
        name: name,
        parents: [folderId]
      })
    })

    if (!initRes.ok) {
      const err = await initRes.text()
      return NextResponse.json({ error: "Lõi máy chủ không thể khởi tạo luồng tải lên: " + err }, { status: 500 })
    }

    const uploadUrl = initRes.headers.get("Location")
    if (!uploadUrl) {
      return NextResponse.json({ error: "Không lấy được Location từ Google" }, { status: 500 })
    }

    return NextResponse.json({ uploadUrl, token: token.token })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
