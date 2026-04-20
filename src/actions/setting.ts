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
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientId,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    })
    const drive = google.drive({ version: "v3", auth })
    await drive.files.get({ fileId: folderId, fields: "id, name" })
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
