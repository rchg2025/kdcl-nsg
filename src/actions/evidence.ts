"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createLog } from "@/actions/log"
import { uploadFileToDrive } from "@/lib/drive"

// Server Action for file upload (supports up to 10MB via bodySizeLimit config)
export async function uploadFileAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Chưa đăng nhập" }

    const file = formData.get("file") as File
    if (!file || !file.name) return { error: "Chưa cung cấp file" }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const viewLink = await uploadFileToDrive(buffer, file.name, file.type || "application/octet-stream")
    if (!viewLink) return { error: "Google Drive không trả về link xem" }

    return { url: viewLink }
  } catch (err: any) {
    console.error("uploadFileAction error:", err)
    return { error: err.message || "Lỗi không xác định khi tải tệp lên Google Drive" }
  }
}

async function checkCollaborator() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "COLLABORATOR", "SUPERVISOR"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function createEvidence(data: { criterionId: string; content: string; fileUrl?: string; evidenceItemId?: string }) {
  const userId = await checkCollaborator()
  
  const newEvidence = await prisma.evidence.create({
    data: {
      ...data,
      collaboratorId: userId,
      status: "PENDING",
      lastUpdaterId: userId
    }
  })
  const logTitle = data.criterionId // Can't fetch from DB before we have criterion info, let's fetch it:
  const criterionInfo = await prisma.criterion.findUnique({ where: { id: data.criterionId } })
  const itemName = criterionInfo?.name || data.criterionId

  await createLog("CREATE", "Minh chứng (Evidence)", `Đã báo cáo minh chứng mới cho Tiêu chuẩn: ${itemName}`)
  
  revalidatePath("/collaborator/evidence")
  return newEvidence
}

export async function updateEvidence(id: string, data: { content: string; fileUrl?: string; evidenceItemId?: string }) {
  const userId = await checkCollaborator()
  
  // Verify ownership and status
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === "ADMIN"
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const existing = await prisma.evidence.findUnique({ where: { id }, include: { collaborator: true, criterion: true } })
  if (!existing) throw new Error("Not found")

  const isOwner = existing.collaboratorId === userId
  const isSameDept = user?.departmentId && existing.collaborator?.departmentId === user.departmentId
  
  if (!isOwner && !isSameDept && !isAdmin) throw new Error("Unauthorized")
  if (["APPROVED", "REVIEWING"].includes(existing.status) && !isAdmin) throw new Error("Mã trạng thái này không cho phép sửa")

  const updatedEvidence = await prisma.evidence.update({
    where: { id },
    data: {
      ...data,
      status: "PENDING", // Reset status for re-review
      rejectReason: null, // Xóa lý do không đạt cũ
      lastUpdaterId: userId
    }
  })
  
  await createLog("UPDATE", "Minh chứng (Evidence)", `Cập nhật lại minh chứng cho Tiêu chuẩn: ${existing.criterion.name}`)
  
  revalidatePath("/collaborator/evidence")
  return updatedEvidence
}

export async function getCollaboratorEvidences() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "COLLABORATOR", "SUPERVISOR"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }
  
  const userId = session.user.id
  const isAdmin = session.user.role === "ADMIN"
  
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const baseWhere = isAdmin ? {} : user?.departmentId ? { collaborator: { departmentId: user.departmentId } } : { collaboratorId: userId }

  return await prisma.evidence.findMany({
    where: baseWhere,
    select: {
      id: true,
      content: true,
      fileUrl: true,
      status: true,
      rejectReason: true,
      createdAt: true,
      reviewedAt: true,
      updatedAt: true,
      collaborator: { select: { name: true, department: { select: { name: true } } } },
      criterion: {
        select: {
          name: true,
          standard: {
            select: { name: true, year: true, type: true, programId: true, program: { select: { name: true } } }
          }
        }
      },
      evidenceItem: { select: { name: true } },
      reviewer: { select: { name: true, email: true } },
      lastUpdater: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getAllCriteriaForDropdown() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  
  let whereClause = {}
  let itemsFilter = {}
  
  if (!["ADMIN", "SUPERVISOR"].includes(session.user.role as string)) {
    const permissions = await prisma.userPermission.findMany({
      where: { userId: session.user.id, permissionType: "CRITERION" }
    })
    const allowedIds = permissions.map(p => p.resourceId)
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    
    whereClause = {
      OR: [
        { id: { in: allowedIds } },
        ...(user?.departmentId ? [{
          items: {
            some: {
              departments: {
                some: { id: user.departmentId }
              }
            }
          }
        }] : [])
      ]
    }

    if (user?.departmentId) {
      itemsFilter = {
        where: {
          OR: [
            { departments: { none: {} } },
            { departments: { some: { id: user.departmentId } } }
          ]
        }
      }
    }
  }

  return await prisma.criterion.findMany({
    where: whereClause,
    select: { 
      id: true,
      name: true,
      standard: { 
        select: { name: true, year: true, type: true, programId: true, program: { select: { id: true, name: true } } } 
      }, 
      items: { 
        ...itemsFilter,
        select: { id: true, name: true },
        orderBy: { createdAt: 'asc' } 
      } 
    },
    orderBy: [
      { standard: { year: 'desc' } },
      { name: 'asc' }
    ]
  })
}
