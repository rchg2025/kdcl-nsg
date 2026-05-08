"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function getDashboardStats(year?: number, type?: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const role = session.user.role as string
  const userId = session.user.id

  const isCollaborator = role === "COLLABORATOR"
  let departmentId: string | null = null

  if (isCollaborator) {
    const userDb = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } })
    departmentId = userDb?.departmentId || null
  }

  // Build evidence filter based on role
  let baseWhere: any = {}
  if (isCollaborator) {
    if (departmentId) {
      baseWhere = { collaborator: { departmentId } }
    } else {
      baseWhere = { collaboratorId: userId }
    }
  }
  // ADMIN, SUPERVISOR, INVESTIGATOR → see all evidence (baseWhere = {})

  const standardWhere: any = {}
  if (year) standardWhere.year = year
  if (type && type !== "ALL") standardWhere.type = type

  // ===== For COLLABORATOR: Also get assigned items to calculate progress =====
  let assignedItemsCount = 0
  let submittedItemsCount = 0
  let assignedItemsByStandard: Record<string, { name: string, totalItems: number, submittedItems: number }> = {}

  if (isCollaborator && departmentId) {
    // Build the item filter matching the statistics page logic
    const hasDept: any = {
      OR: [
        { departments: { some: { id: departmentId } } },
        { sharedFrom: { departments: { some: { id: departmentId } } } },
        { sharedFrom: { sharedFrom: { departments: { some: { id: departmentId } } } } },
        { sharedFrom: { sharedFrom: { sharedFrom: { departments: { some: { id: departmentId } } } } } },
        { sharedFrom: { sharedFrom: { sharedFrom: { sharedFrom: { departments: { some: { id: departmentId } } } } } } }
      ]
    }

    const getNoDeptCondition = (levels: number): any => {
      if (levels === 0) return { departments: { none: {} } }
      return {
        departments: { none: {} },
        OR: [
          { sharedFromId: null },
          { sharedFrom: getNoDeptCondition(levels - 1) }
        ]
      }
    }

    const itemsWhere: any = {
      OR: [hasDept, getNoDeptCondition(5)]
    }

    // Get all assigned items grouped by standard
    const assignedItems = await prisma.evidenceItem.findMany({
      where: {
        ...itemsWhere,
        criterion: { standard: standardWhere }
      },
      select: {
        id: true,
        name: true,
        criterion: {
          select: {
            standard: { select: { name: true, year: true } }
          }
        },
        evidences: {
          where: { collaborator: { departmentId } },
          select: { id: true, status: true }
        }
      }
    })

    assignedItemsCount = assignedItems.length
    submittedItemsCount = assignedItems.filter(item => item.evidences.length > 0).length

    // Group by standard for the department bar chart
    assignedItems.forEach(item => {
      const stdKey = `${item.criterion.standard.year} - ${item.criterion.standard.name}`
      if (!assignedItemsByStandard[stdKey]) {
        assignedItemsByStandard[stdKey] = { name: stdKey, totalItems: 0, submittedItems: 0 }
      }
      assignedItemsByStandard[stdKey].totalItems += 1
      if (item.evidences.length > 0) {
        assignedItemsByStandard[stdKey].submittedItems += 1
      }
    })
  }

  // ===== Query submitted evidence =====
  const evidences = await prisma.evidence.findMany({
    where: {
      ...baseWhere,
      criterion: { standard: standardWhere }
    },
    select: {
      id: true,
      status: true,
      collaborator: {
        select: {
          name: true,
          department: { select: { id: true, name: true } }
        }
      },
      criterion: {
        select: {
          id: true,
          name: true,
          standard: {
            select: { name: true, year: true }
          }
        }
      },
      evidenceItem: { select: { name: true } },
      evaluations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { isApproved: true }
      }
    }
  })

  // ===== Investigator custom metrics =====
  let invApprovedCount = 0
  let invRejectedCount = 0
  let invPendingCount = 0

  evidences.filter((e: any) => e.status === "APPROVED").forEach((e: any) => {
    if (!e.evaluations || e.evaluations.length === 0) invPendingCount++
    else if (e.evaluations[0].isApproved) invApprovedCount++
    else invRejectedCount++
  })

  // ===== 1. Overall summary stats =====
  const total = evidences.length
  const approved = evidences.filter((e: any) => e.status === "APPROVED").length
  const rejected = evidences.filter((e: any) => e.status === "REJECTED").length
  const pending = evidences.filter((e: any) => ["PENDING", "REVIEWING"].includes(e.status)).length

  // ===== 2. Pie Chart data (role-aware) =====
  let statusData: any[]
  if (role === "INVESTIGATOR") {
    statusData = [
      { name: "ĐTV Đạt", value: invApprovedCount, fill: "#10b981" },
      { name: "Chờ ĐTV", value: invPendingCount, fill: "#f59e0b" },
      { name: "ĐTV Không đạt", value: invRejectedCount, fill: "#ef4444" }
    ].filter(d => d.value > 0)
  } else if (isCollaborator && assignedItemsCount > 0) {
    // For collaborator: show progress (submitted vs not submitted)
    const notSubmitted = assignedItemsCount - submittedItemsCount
    statusData = [
      { name: "Đã duyệt", value: approved, fill: "#10b981" },
      { name: "Chờ duyệt", value: pending, fill: "#f59e0b" },
      { name: "Không đạt", value: rejected, fill: "#ef4444" },
      { name: "Chưa nộp", value: notSubmitted, fill: "#94a3b8" }
    ].filter(d => d.value > 0)
  } else {
    statusData = [
      { name: "Đã duyệt", value: approved, fill: "#10b981" },
      { name: "Chờ duyệt", value: pending, fill: "#f59e0b" },
      { name: "Không đạt", value: rejected, fill: "#ef4444" }
    ].filter(d => d.value > 0)
  }

  // ===== 3. Standard Bar Chart data =====
  const standardMap: Record<string, { total: number, approved: number }> = {}
  evidences.forEach((ev: any) => {
    if (role === "INVESTIGATOR") {
      if (ev.status === "APPROVED") {
        const stdName = `${ev.criterion.standard.year} - ${ev.criterion.standard.name}`
        if (!standardMap[stdName]) standardMap[stdName] = { total: 0, approved: 0 }
        standardMap[stdName].total += 1
        if (ev.evaluations && ev.evaluations.length > 0 && ev.evaluations[0].isApproved) {
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

  // ===== 4. Department / Progress chart data (role-aware) =====
  let departmentData: any[] = []

  if (isCollaborator && departmentId) {
    // For collaborator: show progress by standard (assigned items vs submitted)
    departmentData = Object.values(assignedItemsByStandard).map(d => ({
      name: d.name,
      total: d.totalItems,
      approved: d.submittedItems,
      pending: d.totalItems - d.submittedItems,
      rejected: 0
    })).sort((a, b) => b.total - a.total)
  } else {
    // For ADMIN, SUPERVISOR, INVESTIGATOR: show department breakdown
    const deptMap: Record<string, { name: string, total: number, approved: number, pending: number, rejected: number }> = {}
    evidences.forEach((ev: any) => {
      const deptName = ev.collaborator?.department?.name || "Chưa phân đơn vị"
      const deptId = ev.collaborator?.department?.id || "unknown"
      if (!deptMap[deptId]) {
        deptMap[deptId] = { name: deptName, total: 0, approved: 0, pending: 0, rejected: 0 }
      }

      if (role === "INVESTIGATOR") {
        if (ev.status === "APPROVED") {
          deptMap[deptId].total += 1
          if (ev.evaluations && ev.evaluations.length > 0) {
            if (ev.evaluations[0].isApproved) deptMap[deptId].approved += 1
            else deptMap[deptId].rejected += 1
          } else {
            deptMap[deptId].pending += 1
          }
        }
      } else {
        deptMap[deptId].total += 1
        if (ev.status === "APPROVED") deptMap[deptId].approved += 1
        else if (ev.status === "REJECTED") deptMap[deptId].rejected += 1
        else deptMap[deptId].pending += 1
      }
    })

    departmentData = Object.values(deptMap)
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
  }

  // ===== 5. Available years =====
  const availableYears = await prisma.standard.findMany({
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" }
  })

  // ===== 6. Detailed Data Table =====
  const criterionMap: Record<string, any> = {}
  evidences.forEach((ev: any) => {
    const cid = ev.criterion.id
    if (!criterionMap[cid]) {
      criterionMap[cid] = {
        criterionId: cid,
        standardName: `${ev.criterion.standard.year} - ${ev.criterion.standard.name}`,
        criterionName: ev.criterion.name,
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        investigatorApproved: 0,
        investigatorRejected: 0,
        rawEvidences: [] as any[]
      }
    }
    const cm = criterionMap[cid]
    cm.total += 1

    let invEval = 'Chưa đánh giá'

    if (ev.status === "APPROVED") {
      cm.approved += 1
      if (ev.evaluations && ev.evaluations.length > 0) {
        const latestEval = ev.evaluations[0]
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
    userRole: role,
    summary: {
      total: isCollaborator ? assignedItemsCount || total : total,
      approved,
      rejected,
      pending,
      invApprovedCount,
      invRejectedCount,
      invPendingCount,
      // Collaborator-specific
      assignedItems: assignedItemsCount,
      submittedItems: submittedItemsCount,
      notSubmitted: assignedItemsCount - submittedItemsCount
    },
    statusData,
    standardData,
    departmentData,
    detailedStats,
    availableYears: availableYears.map(y => y.year)
  }
}
