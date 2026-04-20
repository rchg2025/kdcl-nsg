import { getConversations, getUsersForChat } from "@/actions/chat"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import ClientChat from "./ClientChat"

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const conversations = await getConversations()
  const users = await getUsersForChat()

  return (
    <div className="flex-1 overflow-hidden h-full">
      <ClientChat 
        currentUserId={session.user.id} 
        initialConversations={conversations} 
        users={users} 
      />
    </div>
  )
}
