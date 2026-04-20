"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createLog } from "@/actions/log"

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }
}

export async function getStandards() {
  await checkAdmin()
  return await prisma.standard.findMany({
    include: {
      criteria: {
        include: { items: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'asc' }
      },
      _count: {
        select: { criteria: true }
      }
    },
    orderBy: { year: 'desc' }
  })
}

export async function createStandard(data: { name: string; description?: string; year: number }) {
  await checkAdmin()
  const newStandard = await prisma.standard.create({ data })
  await createLog("CREATE", "Tiêu chuẩn (Standard)", `Tạo tiêu chuẩn: ${data.name} (${data.year})`)
  revalidatePath("/admin/criteria")
  return newStandard
}

export async function updateStandard(id: string, data: { name: string; description?: string; year: number }) {
  await checkAdmin()
  const updatedStandard = await prisma.standard.update({
    where: { id },
    data
  })
  await createLog("UPDATE", "Tiêu chuẩn (Standard)", `Cập nhật tiêu chuẩn: ${data.name}`)
  revalidatePath("/admin/criteria")
  return updatedStandard
}

export async function deleteStandard(id: string) {
  await checkAdmin()
  const target = await prisma.standard.findUnique({ where: { id } })
  await prisma.standard.delete({ where: { id } })
  await createLog("DELETE", "Tiêu chuẩn (Standard)", `Xóa tiêu chuẩn: ${target?.name}`)
  revalidatePath("/admin/criteria")
}
