"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function getSessionUserId() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  return session.user.id
}

export async function getUsersForChat() {
  const currentUserId = await getSessionUserId()
  return await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      email: { not: "nguyenluyen@nsg.edu.vn" } // Hide God Account
    },
    select: { id: true, name: true, email: true, lastSeenAt: true }
  })
}

export async function getConversations() {
  const currentUserId = await getSessionUserId()
  
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId: currentUserId }
      }
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true, lastSeenAt: true } }
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
  
  const formatted = await Promise.all(conversations.map(async conv => {
    const me = conv.participants.find(p => p.userId === currentUserId)
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: conv.id,
        senderId: { not: currentUserId },
        createdAt: { gt: me?.lastReadAt || new Date(0) }
      }
    })
    return { ...conv, unreadCount }
  }))
  
  return formatted
}

export async function markAsRead(conversationId: string) {
  const currentUserId = await getSessionUserId()
  await prisma.conversationParticipant.update({
    where: { userId_conversationId: { userId: currentUserId, conversationId } },
    data: { lastReadAt: new Date() }
  })
}

export async function createGroupConversation(name: string, userIds: string[]) {
  const currentUserId = await getSessionUserId()
  const allIds = Array.from(new Set([...userIds, currentUserId]))
  
  const newConv = await prisma.conversation.create({
    data: {
      isGroup: true,
      name,
      participants: {
        create: allIds.map(id => ({ userId: id }))
      }
    }
  })
  return newConv.id
}

export async function startDirectConversation(targetUserId: string) {
  const currentUserId = await getSessionUserId()
  
  // Check if direct conversation already exists
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId: currentUserId } } },
        { participants: { some: { userId: targetUserId } } }
      ]
    }
  })
  
  if (existing) return existing.id

  // Create new
  const newConv = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [
          { userId: currentUserId },
          { userId: targetUserId }
        ]
      }
    }
  })
  
  return newConv.id
}

export async function getMessages(conversationId: string) {
  const currentUserId = await getSessionUserId()
  
  // Verify participation
  const isParticipant = await prisma.conversationParticipant.findUnique({
    where: { userId_conversationId: { userId: currentUserId, conversationId } }
  })
  if (!isParticipant) throw new Error("Unauthorized")
    
  return await prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' }
  })
}

export async function sendMessage(conversationId: string, content: string) {
  const currentUserId = await getSessionUserId()
  
  // Verify participation
  const isParticipant = await prisma.conversationParticipant.findUnique({
    where: { userId_conversationId: { userId: currentUserId, conversationId } }
  })
  if (!isParticipant) throw new Error("Unauthorized")

  const msg = await prisma.message.create({
    data: {
      conversationId,
      senderId: currentUserId,
      content
    }
  })
  
  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  })
  
  return msg
}

export async function getTotalUnreadCount() {
  try {
    const currentUserId = await getSessionUserId()
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: currentUserId }
        }
      },
      include: {
        participants: {
          where: { userId: currentUserId }
        }
      }
    })
    
    let total = 0
    for (const conv of conversations) {
      const me = conv.participants[0]
      const count = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: currentUserId },
          createdAt: { gt: me?.lastReadAt || new Date(0) }
        }
      })
      total += count
    }
    return total
  } catch (error) {
    return 0 // fail gracefully for public/unauthorized routes
  }
}

