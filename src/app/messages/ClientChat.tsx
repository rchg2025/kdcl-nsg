"use client"

import { useState, useEffect, useRef } from "react"
import { getMessages, sendMessage, startDirectConversation, getConversations } from "@/actions/chat"
import { Search, Send, User as UserIcon, Circle, MessageSquare } from "lucide-react"

export default function ClientChat({ currentUserId, initialConversations, users }: any) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputMsg, setInputMsg] = useState("")
  const [search, setSearch] = useState("")
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: any
    if (activeConv) {
      const fetchMessages = async () => {
        const msgs = await getMessages(activeConv)
        setMessages(prev => {
          // Prevent re-render and scroll jump if messages are exactly the same
          if (JSON.stringify(prev) === JSON.stringify(msgs)) return prev
          return msgs
        })
      }
      fetchMessages()
      interval = setInterval(fetchMessages, 4000)
    } else {
      setMessages([])
    }
    return () => clearInterval(interval)
  }, [activeConv])
  
  // Poll for conversations update
  useEffect(() => {
    const fetchConvs = async () => {
      const convs = await getConversations()
      setConversations(prev => {
        if (JSON.stringify(prev) === JSON.stringify(convs)) return prev
        return convs
      })
    }
    const interval = setInterval(fetchConvs, 10000)
    return () => clearInterval(interval)
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim() || !activeConv) return
    
    // Optimistic UI
    const pendingMsg = {
      id: "temp-" + Date.now(),
      senderId: currentUserId,
      content: inputMsg,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, pendingMsg])
    setInputMsg("")
    
    await sendMessage(activeConv, pendingMsg.content)
  }

  const handleStartChat = async (targetUserId: string) => {
    const convId = await startDirectConversation(targetUserId)
    setActiveConv(convId)
    // Refetch conversations immediately to show
    const convs = await getConversations()
    setConversations(convs)
  }

  const isOnline = (dateStr: string) => {
    if (!dateStr) return false
    const diff = new Date().getTime() - new Date(dateStr).getTime()
    return diff < 120000 // 2 minutes
  }

  const filteredUsers = users.filter((u: any) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 overflow-hidden text-sm">
      {/* Sidebar: Users / Conversations */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50 dark:bg-slate-950/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold mb-4">Trò chuyện</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm đồng nghiệp..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Đồng nghiệp</h3>
            {filteredUsers.map((u: any) => (
              <div 
                key={u.id}
                onClick={() => handleStartChat(u.id)}
                className="flex items-center gap-3 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <Circle className={`absolute bottom-0 right-0 w-3 h-3 rounded-full fill-current ${isOnline(u.lastSeenAt) ? 'text-emerald-500' : 'text-slate-400'} border-2 border-white dark:border-slate-950`} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-semibold truncate">{u.name}</div>
                  <div className="text-xs text-slate-500 truncate">{u.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex items-center gap-3 bg-white/50 backdrop-blur-sm z-10">
               {/* Find partner name safely */}
               <div className="font-bold text-lg">
                 Phòng Trò chuyện
               </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
              {messages.map(msg => {
                const isMe = msg.senderId === currentUserId
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-[var(--primary)] text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none'}`}>
                      {!isMe && <div className="text-xs font-semibold text-[var(--primary)] mb-1">{msg.sender?.name}</div>}
                      <div className="break-words font-medium">{msg.content}</div>
                      <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Nhập nội dung tin nhắn..." 
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] text-sm transition-colors font-medium"
                />
                <button type="submit" disabled={!inputMsg.trim()} className="bg-[var(--primary)] text-white px-5 rounded-xl flex items-center justify-center hover:bg-[var(--primary-hover)] transition-colors shadow-sm disabled:opacity-50">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={64} className="mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300">Không gian Trò chuyện số</h3>
            <p className="mt-2">Chọn một đồng nghiệp bên trái để bắt đầu nhắn tin và trao đổi công việc!</p>
          </div>
        )}
      </div>
    </div>
  )
}
