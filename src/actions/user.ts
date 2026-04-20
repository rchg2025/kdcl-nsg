"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
}

export async function getUsers() {
  await checkAdmin()
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createUser(data: { name: string; email: string; role: Role }) {
  await checkAdmin()
  
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
  if (existingUser) throw new Error("Email đã tồn tại")

  const hashedPassword = await bcrypt.hash("123456", 10) // Default password
  
  const newUser = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword
    }
  })
  revalidatePath("/admin/users")
  return newUser
}

export async function updateUserRole(id: string, role: Role) {
  await checkAdmin()
  await prisma.user.update({
    where: { id },
    data: { role }
  })
  revalidatePath("/admin/users")
}

export async function deleteUser(id: string) {
  await checkAdmin()
  await prisma.user.delete({ where: { id } })
  revalidatePath("/admin/users")
}
