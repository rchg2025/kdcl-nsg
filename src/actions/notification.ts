"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function getSessionUserId() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  return session.user.id
}

export async function getNotifications() {
  const userId = await getSessionUserId()
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20
  })
}

export async function getUnreadNotificationCount() {
  try {
    const userId = await getSessionUserId()
    return await prisma.notification.count({
      where: { userId, isRead: false }
    })
  } catch {
    return 0
  }
}

export async function markNotificationsRead() {
  const userId = await getSessionUserId()
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  })
}

export async function createNotification(userId: string, title: string, message: string, type: string, link?: string) {
  return await prisma.notification.create({
    data: { userId, title, message, type, link }
  })
}
