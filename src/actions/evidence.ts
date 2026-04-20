"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function checkCollaborator() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "COLLABORATOR"].includes(session.user.role as string)) {
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
  
  revalidatePath("/collaborator/evidence")
  return newEvidence
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
  await checkCollaborator()
  return await prisma.criterion.findMany({
    include: { standard: true },
    orderBy: [
      { standard: { year: 'desc' } },
      { name: 'asc' }
    ]
  })
}
