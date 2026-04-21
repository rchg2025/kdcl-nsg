import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json()
    
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.resetOtp !== otp) {
      return NextResponse.json({ error: "Mã OTP không hợp lệ" }, { status: 400 })
    }

    if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      return NextResponse.json({ error: "Mã OTP đã hết hạn" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpiry: null
      }
    })

    return NextResponse.json({ message: "Mật khẩu đã được đặt lại thành công." })
  } catch (error: any) {
    console.error("Reset pass error:", error)
    return NextResponse.json({ error: "Lỗi hệ thống. Vui lòng thử lại sau." }, { status: 500 })
  }
}
