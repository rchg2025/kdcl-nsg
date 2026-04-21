import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { google } from "googleapis"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { fileId } = await request.json()

    const emailSetting = await prisma.systemSetting.findUnique({ where: { key: "GDRIVE_CLIENT_EMAIL" } })
    const keySetting = await prisma.systemSetting.findUnique({ where: { key: "GDRIVE_PRIVATE_KEY" } })

    if (!emailSetting || !keySetting) {
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

    const drive = google.drive({ version: "v3", auth })

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
      supportsAllDrives: true
    })

    // Get the webViewLink
    const res = await drive.files.get({
      fileId,
      fields: "webViewLink",
      supportsAllDrives: true
    })

    return NextResponse.json({ url: res.data.webViewLink })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
