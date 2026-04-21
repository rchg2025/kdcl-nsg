// SSE Stream endpoint for realtime chat

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const currentUserId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  let lastMessageDate = searchParams.get("lastMessageDate") ? new Date(searchParams.get("lastMessageDate") as string) : null;

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval>;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch(e) {
            closed = true;
          }
        }
      };

      send({ type: "connected", message: "Chat SSE connected" });

      intervalId = setInterval(async () => {
        if (closed) {
          clearInterval(intervalId);
          return;
        }

        try {
          // Find all conversations the user participates in
          const userParticipant = await prisma.conversationParticipant.findMany({
            where: { userId: currentUserId },
            select: { conversationId: true, clearedAt: true },
          });
          const userConvIds = userParticipant.map(p => p.conversationId);

          if (userConvIds.length > 0) {
            const where: any = {
              conversationId: { in: userConvIds },
            };
            if (lastMessageDate) {
              where.createdAt = { gt: lastMessageDate };
            } else {
              // First poll - set bookmark to current newest message
              const newestMessage = await prisma.message.findFirst({
                where: { conversationId: { in: userConvIds } },
                orderBy: { createdAt: "desc" },
              });
              if (newestMessage) {
                lastMessageDate = newestMessage.createdAt;
              } else {
                lastMessageDate = new Date();
              }
              return; // Skip first poll (no old messages)
            }

            const newMessages = await prisma.message.findMany({
              where,
              include: {
                sender: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: "asc" },
            });

            if (newMessages.length > 0) {
              // Filter out messages that are before a user's clearedAt
              const filtered = newMessages.filter(msg => {
                const participant = userParticipant.find(p => p.conversationId === msg.conversationId);
                if (participant?.clearedAt && new Date(msg.createdAt) <= new Date(participant.clearedAt)) {
                  return false;
                }
                return true;
              });

              lastMessageDate = newMessages[newMessages.length - 1].createdAt;
              
              if (filtered.length > 0) {
                send({ type: "messages", data: filtered });
              }
            }
          }
        } catch (err) {
          // Suppress DB errors in loop
        }
      }, 800); // Poll every 800ms for fast-feeling chat
    },
    cancel() {
      closed = true;
      clearInterval(intervalId);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
