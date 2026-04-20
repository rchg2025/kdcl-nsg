"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPERVISOR", "COLLABORATOR"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }
}

export async function getCriteria(standardId: string) {
  await checkAdmin()
  return await prisma.criterion.findMany({
    where: { standardId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createCriterion(data: { name: string; description?: string; standardId: string }) {
  await checkAdmin()
  const newCriterion = await prisma.criterion.create({ data })
  revalidatePath("/admin/criteria")
  return newCriterion
}

export async function updateCriterion(id: string, data: { name: string; description?: string }) {
  await checkAdmin()
  const updatedCriterion = await prisma.criterion.update({
    where: { id },
    data
  })
  revalidatePath("/admin/criteria")
  return updatedCriterion
}

export async function deleteCriterion(id: string, standardId: string) {
  await checkAdmin()
  await prisma.criterion.delete({ where: { id } })
  revalidatePath(`/admin/criteria/${standardId}`)
}
