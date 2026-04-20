import { google } from "googleapis"
import { Readable } from "stream"
import { prisma } from "@/lib/prisma"

export async function uploadFileToDrive(fileBuffer: Buffer, fileName: string, mimeType: string) {
  const emailSetting = await prisma.systemSetting.findUnique({ where: { key: "GDRIVE_CLIENT_EMAIL" } })
  const keySetting = await prisma.systemSetting.findUnique({ where: { key: "GDRIVE_PRIVATE_KEY" } })
  const folderSetting = await prisma.systemSetting.findUnique({ where: { key: "GDRIVE_FOLDER_ID" } })

  const clientId = emailSetting?.value
  const folderId = folderSetting?.value
  
  // Robust parsing
  let parsedKey = (keySetting?.value || "").trim()
  if (parsedKey.startsWith('{') && parsedKey.endsWith('}')) {
    try {
      const json = JSON.parse(parsedKey)
      if (json.private_key) parsedKey = json.private_key
    } catch (e) {}
  }
  const privateKey = parsedKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\r/g, '')

  if (!clientId || !privateKey || !folderId) {
    throw new Error("Tài khoản Quản trị viên chưa điền Cấu hình Google Drive trong mục Cài đặt Hệ thống (Settings).")
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientId,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  })

  const drive = google.drive({ version: "v3", auth })

  const bufferStream = new Readable()
  bufferStream.push(fileBuffer)
  bufferStream.push(null)

  const media = {
    mimeType,
    body: bufferStream,
  }

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: media,
    fields: "id, webViewLink",
  })

  // Share file publicly
  const fileId = response.data.id
  if (fileId) {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })
  }

  return response.data.webViewLink
}
