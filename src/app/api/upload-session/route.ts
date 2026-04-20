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

    const drive = google.drive({ version: "v3", auth })
    const folderId = folderSetting.value

    // Auto-detect Shared Drive
    let driveId: string | undefined
    try {
      const folderRes = await drive.files.get({
        fileId: folderId,
        fields: "driveId",
        supportsAllDrives: true
      })
      driveId = folderRes.data.driveId || undefined
    } catch (e) {}

    const requestBody: any = {
      name: name,
      parents: [folderId]
    }

    const params: any = {
      uploadType: "resumable",
      requestBody,
      supportsAllDrives: true
    }

    if (driveId) {
      params.includeItemsFromAllDrives = true
    }

    // Call Google API to instantiate resumable session
    const initRes = await drive.files.create(params)
    
    // The googleapis library returns the exact Location header inside the response object for resumable uploads
    // wait, googleapis might just do the full upload if you don't pass a stream.
    // Instead of using googleapis SDK to create session, let's use standard POST fetch with the token, because the SDK abstracts it weirdly for resumable.
    
    const client = await auth.getClient()
    const token = await client.getAccessToken()

    const fetchUrl = new URL("https://www.googleapis.com/upload/drive/v3/files")
    fetchUrl.searchParams.set("uploadType", "resumable")
    fetchUrl.searchParams.set("supportsAllDrives", "true")
    if (driveId) {
       // Need to append query params or put in body? But resumable standard API: 
       // If using API v3, it supportsAllDrives=true is usually enough
    }

    const startRes = await fetch(fetchUrl.toString(), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": mimeType
      },
      body: JSON.stringify(requestBody)
    })

    if (!startRes.ok) {
      const err = await startRes.text()
      return NextResponse.json({ error: "Lỗi máy chủ không thể khởi tạo luồng tải lên: " + err }, { status: 500 })
    }

    const uploadUrl = startRes.headers.get("Location")
    if (!uploadUrl) {
      return NextResponse.json({ error: "Không lấy được Location session từ Google" }, { status: 500 })
    }

    return NextResponse.json({ uploadUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
