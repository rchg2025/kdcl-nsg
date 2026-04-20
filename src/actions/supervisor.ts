"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EvidenceStatus } from "@prisma/client"
import { createLog } from "@/actions/log"
import { createNotification } from "@/actions/notification"

async function checkSupervisor() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }
  return session.user
}

export async function getReviewEvidences() {
  await checkSupervisor()
  
  return await prisma.evidence.findMany({
    include: {
      collaborator: { select: { name: true, email: true } },
      criterion: {
        include: { standard: true }
      },
      evidenceItem: true
    },
    orderBy: [
      { status: 'asc' },
      { createdAt: 'desc' }
    ]
  })
}

export async function getPendingEvidenceCount() {
  try {
    await checkSupervisor()
    return await prisma.evidence.count({
      where: { status: "PENDING" }
    })
  } catch (error) {
    return 0
  }
}

const statusLabels: Record<string, string> = {
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  PENDING: "Chờ duyệt",
  REVIEWING: "Đang xem xét"
}

export async function updateEvidenceStatus(evidenceId: string, status: EvidenceStatus, rejectReason?: string) {
  const reviewer = await checkSupervisor()

  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    include: { criterion: { include: { standard: true } } }
  })

  if (!evidence) throw new Error("Không tìm thấy minh chứng")

  // Require reason when rejecting
  if (status === "REJECTED" && !rejectReason?.trim()) {
    throw new Error("Vui lòng nhập lý do từ chối")
  }

  await prisma.evidence.update({
    where: { id: evidenceId },
    data: {
      status,
      rejectReason: status === "REJECTED" ? rejectReason?.trim() : null
    }
  })

  // Create notification for the collaborator
  const criterionLabel = `${evidence.criterion.standard.name} > ${evidence.criterion.name}`
  const notifTitle = status === "APPROVED"
    ? "✅ Minh chứng Đạt"
    : status === "REJECTED"
      ? "❌ Minh chứng bị Từ chối"
      : `📋 Minh chứng ${statusLabels[status] || status}`

  let notifMessage = `Minh chứng cho "${criterionLabel}" đã được cập nhật sang trạng thái: ${statusLabels[status]}.`
  if (status === "REJECTED" && rejectReason) {
    notifMessage += ` Lý do: ${rejectReason.trim()}`
  }
  notifMessage += ` (Duyệt bởi: ${reviewer.name || reviewer.email})`

  await createNotification(
    evidence.collaboratorId,
    notifTitle,
    notifMessage,
    `EVIDENCE_${status}`,
    "/collaborator/evidence"
  )

  await createLog("UPDATE", "Duyệt nội bộ (Supervisor)", `Đổi trạng thái minh chứng ID: ${evidenceId} sang: ${status}${rejectReason ? ` | Lý do: ${rejectReason}` : ""}`)

  revalidatePath("/supervisor/review")
  revalidatePath("/collaborator/evidence")
  revalidatePath("/investigator/evidence")
}
