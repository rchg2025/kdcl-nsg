import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { google } from "googleapis"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: emailSetting.value,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    })

    const client = await auth.getClient()
    const token = await client.getAccessToken()

    return NextResponse.json({ 
      token: token.token, 
      folderId: folderSetting.value 
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Lỗi lấy token: " + err.message }, { status: 500 })
  }
}
