"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function getMyProfile() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  return await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { department: true, position: true }
  })
}

export async function updateMyProfile(data: { name: string; oldPassword?: string; newPassword?: string }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error("User not found")

  const updateData: any = { name: data.name }

  if (data.newPassword && data.oldPassword) {
     const isMatch = await bcrypt.compare(data.oldPassword, user.password || "")
     if (!isMatch) throw new Error("Mật khẩu cũ bạn nhập không chính xác")
     updateData.password = await bcrypt.hash(data.newPassword, 10)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData
  })
  
  revalidatePath("/profile")
}
