import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"
import { prisma } from "@/lib/prisma"
import sitemap from "@/app/sitemap"

export const maxDuration = 60 // 1 phút timeout

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "Quản trị viên")) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 })
    }

    // 1. Get Google Auth config from db
    const settings = await prisma.systemSetting.findMany()
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)

    const clientEmail = settingsMap["GDRIVE_CLIENT_EMAIL"]
    let privateKey = settingsMap["GDRIVE_PRIVATE_KEY"]

    if (!clientEmail || !privateKey) {
      return NextResponse.json({ error: "Chưa cấu hình Service Account trong tab Google Drive" }, { status: 400 })
    }

    // Clean private key
    let parsedKey = privateKey.trim()
    if (parsedKey.startsWith('{') && parsedKey.endsWith('}')) {
      try {
        const json = JSON.parse(parsedKey)
        if (json.private_key) parsedKey = json.private_key
      } catch (e) { }
    }
    const cleanKey = parsedKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\r/g, '')

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: cleanKey,
      scopes: ["https://www.googleapis.com/auth/indexing"]
    })

    const indexing = google.indexing({
      version: "v3",
      auth: auth
    })

    // 2. Get all URLs from sitemap
    const sitemapData = await sitemap()
    const urls = sitemapData.map(item => typeof item === 'string' ? item : item.url)

    if (urls.length === 0) {
       return NextResponse.json({ error: "Sitemap không có URL nào" }, { status: 400 })
    }

    // 3. Publish each URL
    const results = []
    let hasSuccess = false

    // Google API allows ~200 requests per day per project.
    // For large sites we might need to batch, but for <50 URLs loop is fine.
    for (const url of urls) {
      try {
        await indexing.urlNotifications.publish({
          requestBody: {
            url: url,
            type: "URL_UPDATED"
          }
        })
        results.push({ url, status: "success" })
        hasSuccess = true
      } catch (err: any) {
        console.error("Lỗi khi index url:", url, err.message)
        results.push({ url, error: err.message })
      }
    }

    if (!hasSuccess) {
       return NextResponse.json({ 
         error: "Tất cả yêu cầu đều thất bại. Hãy chắc chắn Service Account đã được cấp quyền Owner trong Google Search Console cho domain này.", 
         details: results 
       }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Đã gửi yêu cầu Index thành công cho các URLs`,
      results 
    })

  } catch (error: any) {
    console.error("Indexing API error:", error)
    return NextResponse.json({ error: error.message || "Lỗi hệ thống khi gọi Indexing API" }, { status: 500 })
  }
}
