"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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
