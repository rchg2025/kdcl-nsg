"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EvidenceStatus } from "@prisma/client"

export async function getDashboardStats(year?: number) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  // For collaborator, they see evidences from their department
  const isCollaborator = session.user.role === "COLLABORATOR"
  
  let baseWhere: any = {}
  if (isCollaborator) {
    const userDb = await prisma.user.findUnique({ where: { id: session.user.id }, select: { departmentId: true } })
    if (userDb?.departmentId) {
       baseWhere = { collaborator: { departmentId: userDb.departmentId } }
    } else {
       baseWhere = { collaboratorId: session.user.id }
    }
  }

  // Standard filter based on year
  const standardWhere = year ? { standard: { year } } : {}

  const evidences = await prisma.evidence.findMany({
    where: {
      ...baseWhere,
      criterion: { ...standardWhere }
    },
    include: {
      criterion: {
        include: { standard: true }
      },
      evidenceItem: true,
      evaluations: true
    }
  })

  // Investigator custom metrics initialization
  let invApprovedCount = 0
  let invRejectedCount = 0
  let invPendingCount = 0

  evidences.filter(e => e.status === "APPROVED").forEach(e => {
      if (!e.evaluations || e.evaluations.length === 0) invPendingCount++
      else if (e.evaluations[e.evaluations.length - 1].isApproved) invApprovedCount++
      else invRejectedCount++
  })

  // 1. Overall stats
  const total = evidences.length
  const approved = evidences.filter(e => e.status === "APPROVED").length
  const rejected = evidences.filter(e => e.status === "REJECTED").length
  const pending = evidences.filter(e => ["PENDING", "REVIEWING"].includes(e.status)).length

  // 2. Data for Status Pie Chart
  const statusData = session.user.role === "INVESTIGATOR" ? [
    { name: "ĐTV Đạt", value: invApprovedCount, fill: "#10b981" },
    { name: "Chờ ĐTV", value: invPendingCount, fill: "#f59e0b" },
    { name: "ĐTV Không đạt", value: invRejectedCount, fill: "#ef4444" }
  ].filter(d => d.value > 0) : [
    { name: "Đã duyệt", value: approved, fill: "#10b981" },
    { name: "Chờ duyệt", value: pending, fill: "#f59e0b" },
    { name: "Từ chối", value: rejected, fill: "#ef4444" }
  ].filter(d => d.value > 0) // Only show non-zero

  // 3. Data for Standard Bar Chart
  const standardMap: Record<string, { total: number, approved: number }> = {}
  evidences.forEach(ev => {
    // Nếu là ĐTV thì chỉ biểu diễn total = approved của GSV
    if (session.user.role === "INVESTIGATOR") {
       if (ev.status === "APPROVED") {
          const stdName = `${ev.criterion.standard.year} - ${ev.criterion.standard.name}`
          if (!standardMap[stdName]) standardMap[stdName] = { total: 0, approved: 0 }
          standardMap[stdName].total += 1
          if (ev.evaluations && ev.evaluations.length > 0 && ev.evaluations[ev.evaluations.length - 1].isApproved) {
            standardMap[stdName].approved += 1
          }
       }
    } else {
      const stdName = `${ev.criterion.standard.year} - ${ev.criterion.standard.name}`
      if (!standardMap[stdName]) standardMap[stdName] = { total: 0, approved: 0 }
      standardMap[stdName].total += 1
      if (ev.status === "APPROVED") standardMap[stdName].approved += 1
    }
  })

  const standardData = Object.entries(standardMap).map(([name, data]) => ({
    name,
    total: data.total,
    approved: data.approved,
    pending: data.total - data.approved
  }))

  const availableYears = await prisma.standard.findMany({
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" }
  })

  // 4. Detailed Data for the Data Table
  const criterionMap: Record<string, any> = {}
  evidences.forEach(ev => {
    const cid = ev.criterion.id
    if (!criterionMap[cid]) {
      criterionMap[cid] = {
        criterionId: cid,
        standardName: `${ev.criterion.standard.year} - ${ev.criterion.standard.name}`,
        criterionName: ev.criterion.name,
        total: 0,
        approved: 0, // GSV duyệt
        pending: 0, // Chờ duyệt
        rejected: 0, // GSV từ chối
        investigatorApproved: 0, // ĐTV đánh giá Đạt
        investigatorRejected: 0, // ĐTV đánh giá Không đạt
        rawEvidences: [] as any[]
      }
    }
    const cm = criterionMap[cid]
    cm.total += 1
    
    let invEval = 'Chưa đánh giá'
    
    if (ev.status === "APPROVED") {
      cm.approved += 1
      if (ev.evaluations && ev.evaluations.length > 0) {
        const latestEval = ev.evaluations[ev.evaluations.length - 1]
        if (latestEval.isApproved) {
          cm.investigatorApproved += 1
          invEval = 'Đạt'
        } else {
          cm.investigatorRejected += 1
          invEval = 'Không đạt'
        }
      }
    }
    else if (ev.status === "REJECTED") cm.rejected += 1
    else cm.pending += 1
    
    cm.rawEvidences.push({
      itemName: ev.evidenceItem?.name || "Minh chứng (Không xác định)",
      status: ev.status,
      invEval
    })
  })

  const detailedStats = Object.values(criterionMap)

  return {
    userRole: session.user.role,
    summary: { total, approved, rejected, pending, invApprovedCount, invRejectedCount, invPendingCount },
    statusData,
    standardData,
    detailedStats,
    availableYears: availableYears.map(y => y.year)
  }
}
