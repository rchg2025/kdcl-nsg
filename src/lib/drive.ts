import { google } from "googleapis"
import { Readable } from "stream"

export async function uploadFileToDrive(fileBuffer: Buffer, fileName: string, mimeType: string) {
  const clientId = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  if (!clientId || !privateKey || !folderId) {
    throw new Error("Thiếu cấu hình Google Drive trong Environment Variables.")
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
