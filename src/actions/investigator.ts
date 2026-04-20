"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createLog } from "@/actions/log"

async function checkInvestigator() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "INVESTIGATOR"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function getInvestigatorEvidences() {
  await checkInvestigator()
  
  return await prisma.evidence.findMany({
    where: { status: "APPROVED" }, // Investigators only verify what is already "Approved" by supervisors
    include: {
      collaborator: { select: { name: true } },
      criterion: {
        include: { standard: true }
      },
      evaluations: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function evaluateEvidence(data: { evidenceId: string; isApproved: boolean; comments: string }) {
  const evaluatorId = await checkInvestigator()
  
  await prisma.evaluation.create({
    data: {
      ...data,
      evaluatorId
    }
  })
  
  await createLog("APPROVE", "Đánh giá KQ (Evaluation)", `Đánh giá minh chứng ID: ${data.evidenceId}. Kết quả: ${data.isApproved ? 'Đạt' : 'Không đạt'}`)
  
  revalidatePath("/investigator/evaluate")
}
