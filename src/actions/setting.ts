"use server"

import { prisma } from "@/lib/prisma"
import { checkAdmin } from "@/actions/user"
import { revalidatePath } from "next/cache"

export async function getSettings() {
  await checkAdmin()
  const settings = await prisma.systemSetting.findMany()
  const obj: Record<string, string> = {}
  settings.forEach(s => {
    obj[s.key] = s.value
  })
  return obj
}

export async function updateSettings(data: Record<string, string>) {
  await checkAdmin()
  
  const entries = Object.entries(data)
  for (const [key, value] of entries) {
    if (value) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    }
  }

  revalidatePath("/admin/settings")
  return true
}

import { google } from "googleapis"
import nodemailer from "nodemailer"

export async function testDriveConfig(clientId: string, privateKey: string, folderId: string) {
  try {
    let parsedKey = privateKey.trim()

    // 1. If user accidentally pasted the whole JSON file content, extract the private_key field automatically
    if (parsedKey.startsWith('{') && parsedKey.endsWith('}')) {
      try {
        const json = JSON.parse(parsedKey)
        if (json.private_key) parsedKey = json.private_key
      } catch (e) {
        // Not a valid JSON, continue normal parsing
      }
    }

    // 2. Strip leading/trailing quotes if user dumped raw JSON value, and convert literal \n to newlines
    const cleanKey = parsedKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\r/g, '')
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientId,
        private_key: cleanKey,
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    })
    const drive = google.drive({ version: "v3", auth })
    await drive.files.get({ fileId: folderId, fields: "id, name", supportsAllDrives: true })
    return { success: true, message: "Kết nối Google Drive thành công! Thư mục hợp lệ." }
  } catch (err: any) {
    return { success: false, message: "Lỗi kết nối: " + err.message }
  }
}

export async function testSmtpConfig(user: string, pass: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass
      }
    });
    
    await transporter.verify();
    return { success: true, message: "Xác thực Gmail SMTP thành công!" }
  } catch (err: any) {
    return { success: false, message: "Lỗi xác thực: " + err.message }
  }
}
