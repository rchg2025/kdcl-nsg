import { google } from "googleapis"
import { Readable } from "stream"
import { prisma } from "@/lib/prisma"

async function getDriveClient() {
  const [emailSetting, keySetting, folderSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "GDRIVE_CLIENT_EMAIL" } }),
    prisma.systemSetting.findUnique({ where: { key: "GDRIVE_PRIVATE_KEY" } }),
    prisma.systemSetting.findUnique({ where: { key: "GDRIVE_FOLDER_ID" } }),
  ])

  const clientEmail = emailSetting?.value
  const folderId = folderSetting?.value

  let parsedKey = (keySetting?.value || "").trim()
  if (parsedKey.startsWith("{") && parsedKey.endsWith("}")) {
    try {
      const json = JSON.parse(parsedKey)
      if (json.private_key) parsedKey = json.private_key
    } catch (e) {}
  }
  const privateKey = parsedKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n").replace(/\r/g, "")

  if (!clientEmail || !privateKey || !folderId) {
    throw new Error("Chưa cấu hình Google Drive trong Cài đặt hệ thống.")
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  })

  const drive = google.drive({ version: "v3", auth })
  return { drive, folderId }
}

// Detect if folderId belongs to a Shared Drive
async function getSharedDriveId(drive: any, folderId: string): Promise<string | undefined> {
  try {
    const res = await drive.files.get({
      fileId: folderId,
      fields: "driveId",
      supportsAllDrives: true,
    })
    return res.data.driveId || undefined
  } catch {
    return undefined
  }
}

export async function uploadFileToDrive(fileBuffer: Buffer, fileName: string, mimeType: string) {
  const { drive, folderId } = await getDriveClient()
  const driveId = await getSharedDriveId(drive, folderId)

  const bufferStream = new Readable()
  bufferStream.push(fileBuffer)
  bufferStream.push(null)

  const requestBody: any = {
    name: fileName,
    parents: [folderId],
  }

  const params: any = {
    requestBody,
    media: { mimeType, body: bufferStream },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  }

  // If it's a Shared Drive, we must include these extra params
  if (driveId) {
    params.includeItemsFromAllDrives = true
  }

  const response = await drive.files.create(params)
  const fileId = response.data.id

  // Set public read permission
  if (fileId) {
    try {
      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: true,
      })
    } catch (permErr: any) {
      console.warn("Permission warning (non-fatal):", permErr.message)
    }
  }

  return response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
}
