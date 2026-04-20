"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EvidenceStatus } from "@prisma/client"

async function checkSupervisor() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }
}

export async function getReviewEvidences() {
  await checkSupervisor()
  
  return await prisma.evidence.findMany({
    include: {
      collaborator: { select: { name: true, email: true } },
      criterion: {
        include: { standard: true }
      }
    },
    orderBy: [
      { status: 'asc' }, // usually grouping by status
      { createdAt: 'desc' }
    ]
  })
}

export async function updateEvidenceStatus(evidenceId: string, status: EvidenceStatus) {
  await checkSupervisor()
  
  await prisma.evidence.update({
    where: { id: evidenceId },
    data: { status }
  })
  
  revalidatePath("/supervisor/review")
  revalidatePath("/collaborator/evidence")
  revalidatePath("/investigator/evidence")
}
