"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EvidenceStatus } from "@prisma/client"

export async function getDashboardStats(year?: number) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  // For collaborator, they only see their own evidences
  const isCollaborator = session.user.role === "COLLABORATOR"
  const baseWhere = isCollaborator ? { collaboratorId: session.user.id } : {}

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
      }
    }
  })

  // 1. Overall stats
  const total = evidences.length
  const approved = evidences.filter(e => e.status === "APPROVED").length
  const rejected = evidences.filter(e => e.status === "REJECTED").length
  const pending = evidences.filter(e => ["PENDING", "REVIEWING"].includes(e.status)).length

  // 2. Data for Status Pie Chart
  const statusData = [
    { name: "Đã duyệt", value: approved, fill: "#10b981" },
    { name: "Chờ duyệt", value: pending, fill: "#f59e0b" },
    { name: "Từ chối", value: rejected, fill: "#ef4444" }
  ].filter(d => d.value > 0) // Only show non-zero

  // 3. Data for Standard Bar Chart
  const standardMap: Record<string, { total: number, approved: number }> = {}
  evidences.forEach(ev => {
    const stdName = `${ev.criterion.standard.year} - ${ev.criterion.standard.name}`
    if (!standardMap[stdName]) standardMap[stdName] = { total: 0, approved: 0 }
    standardMap[stdName].total += 1
    if (ev.status === "APPROVED") standardMap[stdName].approved += 1
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

  return {
    summary: { total, approved, rejected, pending },
    statusData,
    standardData,
    availableYears: availableYears.map(y => y.year)
  }
}
