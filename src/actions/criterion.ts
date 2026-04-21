"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createLog } from "@/actions/log"

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
    include: {
      items: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createCriterion(data: { name: string; description?: string; standardId: string }) {
  await checkAdmin()
  const newCriterion = await prisma.criterion.create({ data })
  await createLog("CREATE", "Tiêu chuẩn (Criterion)", `Tạo tiêu chuẩn mới: ${data.name}`)
  revalidatePath("/admin/criteria")
  return newCriterion
}

export async function updateCriterion(id: string, data: { name: string; description?: string }) {
  await checkAdmin()
  const updatedCriterion = await prisma.criterion.update({
    where: { id },
    data
  })
  await createLog("UPDATE", "Tiêu chuẩn (Criterion)", `Cập nhật tiêu chuẩn: ${data.name}`)
  revalidatePath("/admin/criteria")
  return updatedCriterion
}

export async function deleteCriterion(id: string, standardId: string) {
  await checkAdmin()
  const target = await prisma.criterion.findUnique({ where: { id } })
  await prisma.criterion.delete({ where: { id } })
  await createLog("DELETE", "Tiêu chuẩn (Criterion)", `Xóa tiêu chuẩn: ${target?.name}`)
  revalidatePath(`/admin/criteria/${standardId}`)
}

// --- EvidenceItem ACTIONS ---

export async function getEvidenceItems(criterionId: string) {
  await checkAdmin()
  return await prisma.evidenceItem.findMany({
    where: { criterionId },
    include: { departments: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createEvidenceItem(data: { name: string; description?: string; criterionId: string; departmentIds?: string[] }) {
  await checkAdmin()
  const dptData = data.departmentIds ? {
    departments: { connect: data.departmentIds.map(id => ({ id })) }
  } : {}
  const newItem = await prisma.evidenceItem.create({ 
    data: { 
      name: data.name, 
      description: data.description, 
      criterionId: data.criterionId, 
      ...dptData 
    },
    include: { departments: true }
  })
  await createLog("CREATE", "Mục Minh chứng (EvidenceItem)", `Tạo danh mục minh chứng: ${data.name}`)
  revalidatePath("/admin/criteria")
  revalidatePath("/supervisor/criteria")
  return newItem
}

export async function updateEvidenceItem(id: string, data: { name: string; description?: string; departmentIds?: string[] }) {
  await checkAdmin()
  const updatedItem = await prisma.evidenceItem.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      ...(data.departmentIds ? {
        departments: {
          set: data.departmentIds.map(dId => ({ id: dId }))
        }
      } : {})
    },
    include: { departments: true }
  })
  await createLog("UPDATE", "Mục Minh chứng (EvidenceItem)", `Cập nhật danh mục: ${data.name}`)
  revalidatePath("/admin/criteria")
  revalidatePath("/supervisor/criteria")
  return updatedItem
}

export async function deleteEvidenceItem(id: string) {
  await checkAdmin()
  const target = await prisma.evidenceItem.findUnique({ where: { id } })
  await prisma.evidenceItem.delete({ where: { id } })
  await createLog("DELETE", "Mục Minh chứng (EvidenceItem)", `Xóa danh mục: ${target?.name}`)
  revalidatePath("/admin/criteria")
  revalidatePath("/supervisor/criteria")
}
