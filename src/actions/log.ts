"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { checkAdmin } from "@/actions/user"

export async function createSystemLog(userId: string, action: string, resource: string, details?: string) {
  try {
    await prisma.systemLog.create({
      data: {
        userId,
        action,
        resource,
        details
      }
    })
  } catch (err) {
    console.error("Failed to create system log:", err)
  }
}

export async function createLog(action: string, resource: string, details?: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return
    await createSystemLog(session.user.id, action, resource, details)
  } catch (err) {
    console.error("Failed to create log:", err)
  }
}

export async function getLogs() {
  await checkAdmin()
  return await prisma.systemLog.findMany({
    include: {
      user: { select: { name: true, email: true, role: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function deleteSystemLogs(monthsToKeep: number) {
  await checkAdmin()
  
  if (monthsToKeep === 0) {
    await prisma.systemLog.deleteMany({})
    await createLog("DELETE", "Nhật ký hệ thống", "Đã xóa toàn bộ nhật ký hệ thống")
  } else {
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep)
    
    await prisma.systemLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })
    await createLog("DELETE", "Nhật ký hệ thống", `Đã xóa các nhật ký từ trước ${monthsToKeep} tháng`)
  }
  
  revalidatePath("/admin/logs")
}
