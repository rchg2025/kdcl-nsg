import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Vui lòng nhập Email" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Return 200 anyway to prevent user enumeration attacks
      return NextResponse.json({ message: "Nếu email tồn tại, hệ thống đã gửi mã OTP." })
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    // 10 minutes expiry
    const expiry = new Date(Date.now() + 10 * 60000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpiry: expiry
      }
    })

    // Get SMTP configuration from db
    const settings = await prisma.systemSetting.findMany()
    const config: Record<string, string> = {}
    settings.forEach(s => { config[s.key] = s.value })

    if (!config.SMTP_USER || !config.SMTP_PASS) {
      return NextResponse.json({ error: "Hệ thống chưa cấu hình Email gửi OTP. Vui lòng liên hệ Admin." }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    })

    await transporter.sendMail({
      from: `"Hệ thống Kiểm định chất lượng" <${config.SMTP_USER}>`,
      to: email,
      subject: "Mã xác nhận Đặt lại mật khẩu",
      html: `
        <div style="padding:20px; font-family:sans-serif; line-height:1.5;">
           <h2>Đặt lại mật khẩu</h2>
           <p>Xin chào ${user.name || "bạn"},</p>
           <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản ứng dụng Kiểm định chất lượng số.</p>
           <p>Mã OTP của bạn là: <strong style="font-size:24px; color:#4f46e5;">${otp}</strong></p>
           <p>Mã này sẽ hết hạn trong 10 phút.</p>
           <p>Nếu bạn không yêu cầu điều này, xin vui lòng bỏ qua email này.</p>
        </div>
      `
    })

    return NextResponse.json({ message: "Mã OTP đã được gửi." })
  } catch (error: any) {
    console.error("Forgot pass error:", error)
    return NextResponse.json({ error: "Lỗi hệ thống. Vui lòng thử lại sau." }, { status: 500 })
  }
}
