"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
}

export async function getStandards() {
  await checkAdmin()
  return await prisma.standard.findMany({
    include: {
      criteria: {
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
  revalidatePath("/admin/criteria")
  return newStandard
}

export async function deleteStandard(id: string) {
  await checkAdmin()
  await prisma.standard.delete({ where: { id } })
  revalidatePath("/admin/criteria")
}
