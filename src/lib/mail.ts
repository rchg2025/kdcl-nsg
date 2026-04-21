import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"

export async function sendWelcomeEmail(toEmail: string, name: string, plainTextPassword: string) {
  try {
    const smtpSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ["smtpUser", "smtpPassword", "systemName", "appUrl"] } }
    })
    
    let smtpUser = ""
    let smtpPassword = ""
    let systemName = "Hệ thống Quản lý Chất lượng"
    let appUrl = "https://kdcl-nsg.vercel.app"

    for (const s of smtpSettings) {
      if (s.key === "smtpUser") smtpUser = s.value
      else if (s.key === "smtpPassword") smtpPassword = s.value
      else if (s.key === "systemName") systemName = s.value
      else if (s.key === "appUrl") appUrl = s.value
    }

    if (!smtpUser || !smtpPassword) {
      console.error("Missing SMTP config in DB")
      return false
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tài khoản mới</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background-color: #4F46E5; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px 40px; color: #333333; line-height: 1.6; }
        .content p { margin: 0 0 15px; }
        .account-info { background-color: #f8fafc; border-left: 4px solid #4F46E5; padding: 15px 20px; margin: 20px 0; border-radius: 0 4px 4px 0; }
        .info-row { margin-bottom: 8px; }
        .info-label { font-weight: 600; color: #64748b; display: inline-block; width: 100px; }
        .info-value { font-weight: bold; color: #0f172a; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Chào mừng đến với \${systemName}</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>\${name}</strong>,</p>
            <p>Tài khoản của bạn trên <strong>\${systemName}</strong> đã được tạo thành công bởi Quản trị viên. Dưới đây là thông tin đăng nhập của bạn:</p>
            
            <div class="account-info">
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">\${toEmail}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Mật khẩu:</span>
                    <span class="info-value">\${plainTextPassword}</span>
                </div>
            </div>

            <p style="color: #ef4444; font-size: 14px;"><strong>Lưu ý:</strong> Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu để đảm bảo an toàn.</p>

            <div class="btn-container">
                <a href="\${appUrl}/login" class="btn">Truy cập Hệ thống</a>
            </div>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với Quản trị viên hệ thống.</p>
            <p>Trân trọng,<br>Ban Quản trị \${systemName}</p>
        </div>
        <div class="footer">
            <p>Đây là email tự động, vui lòng không trả lời qua email này.</p>
            <p>&copy; \${new Date().getFullYear()} \${systemName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `

    const info = await transporter.sendMail({
      from: \`"\${systemName}" <\${smtpUser}>\`,
      to: toEmail,
      subject: \`Thông tin tài khoản mới - \${systemName}\`,
      html: htmlTemplate,
    })

    console.log("Message sent: %s", info.messageId)
    return true
  } catch (error) {
    console.error("Error sending email", error)
    return false
  }
}
