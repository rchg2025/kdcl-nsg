"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { createLog } from "@/actions/log"
import { sendWelcomeEmail } from "@/lib/mail"

export async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
}

export async function getUsers() {
  await checkAdmin()
  return await prisma.user.findMany({
    where: {
      email: { not: "nguyenluyen@nsg.edu.vn" }
    },
    include: { department: true, position: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createUser(data: { name: string; email: string; role: Role; departmentId?: string; positionId?: string; password?: string }) {
  await checkAdmin()
  
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
  if (existingUser) throw new Error("Email đã tồn tại")

  const plainPassword = data.password || "123456"
  const hashedPassword = await bcrypt.hash(plainPassword, 10)
  
  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      departmentId: data.departmentId || null,
      positionId: data.positionId || null,
      password: hashedPassword
    }
  })
  
  // Send email in background
  sendWelcomeEmail(data.email, data.name || "Thành viên", plainPassword).catch(console.error)

  await createLog("CREATE", "Thành viên (User)", `Khởi tạo tài khoản mới: ${data.email} (Quyền: ${data.role})`)
  
  revalidatePath("/admin/users")
  return newUser
}

export async function updateUser(id: string, data: { name: string; role: Role; departmentId?: string; positionId?: string; password?: string }) {
  await checkAdmin()
  
  const updateData: any = {
    name: data.name,
    role: data.role,
    departmentId: data.departmentId || null,
    positionId: data.positionId || null,
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10)
  }

  await prisma.user.update({
    where: { id },
    data: updateData
  })
  
  await createLog("UPDATE", "Thành viên (User)", `Chỉnh sửa thông tin tài khoản: ${data.name} (Quyền: ${data.role})`)
  
  revalidatePath("/admin/users")
}

export async function deleteUser(id: string) {
  await checkAdmin()
  
  const target = await prisma.user.findUnique({ where: { id } })
  await prisma.user.delete({ where: { id } })
  
  await createLog("DELETE", "Thành viên (User)", `Đã xóa tài khoản: ${target?.email}`)
  
  revalidatePath("/admin/users")
}

export async function toggleUserActive(id: string, isActive: boolean) {
  await checkAdmin()
  
  const user = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: { name: true, email: true }
  })
  
  const statusStr = isActive ? "Kích hoạt" : "Vô hiệu hóa"
  await createLog("UPDATE", "Thành viên (User)", `Đã ${statusStr} tài khoản: ${user.name || user.email}`)
  
  revalidatePath("/admin/users")
}
