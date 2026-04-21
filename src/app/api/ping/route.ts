import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    // Fetch unread notifications
    const unreadNotifs = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false }
    })

    // Fetch unread messages
    // Unread message means:
    // 1. Participant in conversation
    // 2. Message sender is not me
    // 3. Message createdAt > participant.lastReadAt
    const participantRecords = await prisma.conversationParticipant.findMany({
      where: { userId: session.user.id },
      select: { conversationId: true, lastReadAt: true }
    })

    let unreadMsgs = 0
    for (const p of participantRecords) {
      const msgs = await prisma.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: session.user.id },
          createdAt: { gt: p.lastReadAt }
        }
      })
      unreadMsgs += msgs
    }

    // Update lastSeenAt
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeenAt: new Date() }
    })

    return NextResponse.json({ 
      success: true,
      unreadNotifs,
      unreadMsgs
    })
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
