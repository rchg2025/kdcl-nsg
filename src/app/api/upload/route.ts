import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const maxDuration = 60

async function getGoogleAccessToken() {
  const [emailSetting, keySetting, folderSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "GDRIVE_CLIENT_EMAIL" } }),
    prisma.systemSetting.findUnique({ where: { key: "GDRIVE_PRIVATE_KEY" } }),
    prisma.systemSetting.findUnique({ where: { key: "GDRIVE_FOLDER_ID" } }),
  ])

  if (!emailSetting?.value || !keySetting?.value || !folderSetting?.value) {
    throw new Error("Chưa cấu hình Google Drive trong Cài đặt hệ thống")
  }

  let parsedKey = keySetting.value.trim()
  if (parsedKey.startsWith("{") && parsedKey.endsWith("}")) {
    try {
      const json = JSON.parse(parsedKey)
      if (json.private_key) parsedKey = json.private_key
    } catch (e) {}
  }
  const privateKey = parsedKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n").replace(/\r/g, "")

  // Build JWT manually to avoid googleapis SDK issues on Vercel
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url")
  const now = Math.floor(Date.now() / 1000)
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: emailSetting.value,
      scope: "https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url")

  const crypto = await import("crypto")
  const sign = crypto.createSign("RSA-SHA256")
  sign.update(`${header}.${claimSet}`)
  const signature = sign.sign(privateKey, "base64url")

  const jwt = `${header}.${claimSet}.${signature}`

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    throw new Error("Không thể lấy token Google: " + errText)
  }

  const tokenData = await tokenRes.json()
  return { accessToken: tokenData.access_token, folderId: folderSetting.value }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll("file") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Chưa cung cấp file" }, { status: 400 })
    }

    const { accessToken, folderId } = await getGoogleAccessToken()

    const viewLinks: string[] = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const fileBuffer = Buffer.from(bytes)

      // Build multipart/related body for Google Drive API
      const boundary = "===UPLOAD_BOUNDARY_" + Date.now() + "==="
      const metadata = JSON.stringify({
        name: file.name,
        parents: [folderId],
      })

      const bodyParts = [
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
        `--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\nContent-Transfer-Encoding: binary\r\n\r\n`,
      ]

      const preamble = Buffer.from(bodyParts[0], "utf-8")
      const fileHeader = Buffer.from(bodyParts[1], "utf-8")
      const epilogue = Buffer.from(`\r\n--${boundary}--`, "utf-8")

      const fullBody = Buffer.concat([preamble, fileHeader, fileBuffer, epilogue])

      // Upload to Google Drive
      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
            "Content-Length": fullBody.length.toString(),
          },
          body: fullBody,
        }
      )

      if (!uploadRes.ok) {
        const errBody = await uploadRes.text()
        console.error("Google Drive upload error:", uploadRes.status, errBody)
        throw new Error(`Lỗi tải tệp ${file.name} lên Google Drive (${uploadRes.status})`)
      }

      const fileData = await uploadRes.json()

      // Set public read permission
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions?supportsAllDrives=true`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: "reader", type: "anyone" }),
        }
      )

      viewLinks.push(fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`)
    }

    return NextResponse.json({ url: viewLinks.join(", ") })
  } catch (err: any) {
    console.error("Upload error:", err)
    return NextResponse.json(
      { error: err.message || "Có lỗi khi tải tệp lên" },
      { status: 500 }
    )
  }
}
