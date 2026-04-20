"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createLog } from "@/actions/log"

async function checkCollaborator() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "COLLABORATOR", "SUPERVISOR"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function createEvidence(data: { criterionId: string; content: string; fileUrl?: string }) {
  const userId = await checkCollaborator()
  
  const newEvidence = await prisma.evidence.create({
    data: {
      ...data,
      collaboratorId: userId,
      status: "PENDING"
    }
  })
  
  await createLog("CREATE", "Minh chứng (Evidence)", `Đã báo cáo minh chứng ID: ${newEvidence.id} cho Tiêu chí ${data.criterionId}`)
  
  revalidatePath("/collaborator/evidence")
  return newEvidence
}

export async function updateEvidence(id: string, data: { content: string; fileUrl?: string }) {
  const userId = await checkCollaborator()
  
  // Verify ownership and status
  const existing = await prisma.evidence.findUnique({ where: { id } })
  if (!existing || existing.collaboratorId !== userId) throw new Error("Unauthorized")
  if (["APPROVED", "REVIEWING"].includes(existing.status)) throw new Error("Mã trạng thái này không cho phép sửa")

  const updatedEvidence = await prisma.evidence.update({
    where: { id },
    data: {
      ...data,
      status: "PENDING" // Reset status for re-review
    }
  })
  
  await createLog("UPDATE", "Minh chứng (Evidence)", `Cập nhật lại minh chứng ID: ${id}`)
  
  revalidatePath("/collaborator/evidence")
  return updatedEvidence
}

export async function getCollaboratorEvidences() {
  const userId = await checkCollaborator()
  
  return await prisma.evidence.findMany({
    where: { collaboratorId: userId },
    include: {
      criterion: {
        include: { standard: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getAllCriteriaForDropdown() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  
  let whereClause = {}
  
  if (session.user.role !== "ADMIN") {
    const permissions = await prisma.userPermission.findMany({
      where: { userId: session.user.id, permissionType: "CRITERION" }
    })
    const allowedIds = permissions.map(p => p.resourceId)
    // Even if empty, it will return nothing which is correct
    whereClause = { id: { in: allowedIds } }
  }

  return await prisma.criterion.findMany({
    where: whereClause,
    include: { standard: true },
    orderBy: [
      { standard: { year: 'desc' } },
      { name: 'asc' }
    ]
  })
}
