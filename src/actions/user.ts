"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"

export async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
}

export async function getUsers() {
  await checkAdmin()
  return await prisma.user.findMany({
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
  revalidatePath("/admin/users")
}

export async function deleteUser(id: string) {
  await checkAdmin()
  await prisma.user.delete({ where: { id } })
  revalidatePath("/admin/users")
}
