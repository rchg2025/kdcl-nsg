"use client"

import { useState, useEffect, useRef } from "react"
import { getMessages, sendMessage, startDirectConversation, getConversations, createGroupConversation, markAsRead } from "@/actions/chat"
import { Search, Send, Circle, MessageSquare, Users, Plus, X, User as UserIcon } from "lucide-react"

function playNotification() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3)
    osc.stop(ctx.currentTime + 0.3)
  } catch(e) {}
}

export default function ClientChat({ currentUserId, initialConversations, users }: any) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputMsg, setInputMsg] = useState("")
  const [search, setSearch] = useState("")
  
  // Group creation modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  // Notification memory
  const previousTotalUnread = useRef(0)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // Poll for messages if active conversation
  useEffect(() => {
    let interval: any
    if (activeConv) {
      const fetchMessages = async () => {
        const msgs = await getMessages(activeConv)
        setMessages((prev: any[]) => {
          if (JSON.stringify(prev) === JSON.stringify(msgs)) return prev
          return msgs
        })
        await markAsRead(activeConv)
      }
      fetchMessages()
      interval = setInterval(fetchMessages, 4000)
    } else {
      setMessages([])
    }
    return () => clearInterval(interval)
  }, [activeConv])
  
  // Poll for conversations update & Audio Notifications
  useEffect(() => {
    const fetchConvs = async () => {
      const convs = await getConversations()
      setConversations((prev: any[]) => {
        if (JSON.stringify(prev) === JSON.stringify(convs)) return prev
        return convs
      })
      
      const totalUnread = convs.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0)
      if (totalUnread > previousTotalUnread.current) {
        playNotification() // New message arrived!
      }
      previousTotalUnread.current = totalUnread
    }
    const interval = setInterval(fetchConvs, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto scroll to bottom smoothly
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
    // Refetch immediately to update sidebar sorting
    const convs = await getConversations()
    setConversations(convs)
  }

  const handleStartDirectChat = async (targetUserId: string) => {
    const convId = await startDirectConversation(targetUserId)
    setActiveConv(convId)
    const convs = await getConversations()
    setConversations(convs)
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim() || selectedUsers.length === 0) return
    
    const convId = await createGroupConversation(groupName, selectedUsers)
    setActiveConv(convId)
    setIsGroupModalOpen(false)
    setGroupName("")
    setSelectedUsers([])
    
    const convs = await getConversations()
    setConversations(convs)
  }

  const isOnline = (dateStr: string) => {
    if (!dateStr) return false
    const diff = new Date().getTime() - new Date(dateStr).getTime()
    return diff < 120000 // 2 minutes
  }

  const filteredUsers = users.filter((u: any) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  
  // Find current active conversation name safely
  const currentConvData = conversations.find((c: any) => c.id === activeConv)
  let activeName = "Phòng Trò chuyện"
  if (currentConvData) {
    if (currentConvData.isGroup) activeName = currentConvData.name || "Nhóm"
    else {
      const otherUser = currentConvData.participants.find((p: any) => p.userId !== currentUserId)?.user
      if (otherUser) activeName = otherUser.name
    }
  }

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 overflow-hidden text-sm">
      {/* Sidebar: Users / Conversations */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50 dark:bg-slate-950/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold">Trò chuyện</h2>
             <button 
                onClick={() => setIsGroupModalOpen(true)}
                title="Tạo nhóm mới"
                className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-full hover:bg-indigo-200 transition-colors"
             >
               <Plus size={18} />
             </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm đồng nghiệp..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {conversations.length > 0 && !search && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gần đây</h3>
              {conversations.map((conv: any) => {
                let name = conv.isGroup ? conv.name : "..."
                let subtext = ""
                let online = false
                if (!conv.isGroup) {
                   const otherUser = conv.participants.find((p: any) => p.userId !== currentUserId)?.user
                   name = otherUser?.name || "Người dùng"
                   subtext = otherUser?.email || ""
                   online = isOnline(otherUser?.lastSeenAt)
                } else {
                   subtext = `${conv.participants.length} thành viên`
                }
                
                return (
                  <div 
                    key={conv.id}
                    onClick={() => { setActiveConv(conv.id); markAsRead(conv.id) }}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${activeConv === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                        {conv.isGroup ? <Users size={18} /> : name?.charAt(0).toUpperCase()}
                      </div>
                      {!conv.isGroup && <Circle className={`absolute bottom-0 right-0 w-3 h-3 rounded-full fill-current ${online ? 'text-emerald-500' : 'text-slate-400'} border-2 border-white dark:border-slate-950`} />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-semibold truncate text-[var(--foreground)]">{name}</div>
                      <div className="text-xs text-slate-500 truncate">{subtext}</div>
                    </div>
                    {conv.unreadCount > 0 && conv.id !== activeConv && (
                      <div className="shrink-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Danh bạ hệ thống</h3>
            {filteredUsers.map((u: any) => (
              <div 
                key={u.id}
                onClick={() => handleStartDirectChat(u.id)}
                className="flex items-center gap-3 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                <div className="relative shrink-0">
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
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[var(--background)]">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex items-center gap-3 bg-white dark:bg-slate-900 z-10">
               <div className="w-10 h-10 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                  {currentConvData?.isGroup ? <Users size={18} /> : activeName?.charAt(0).toUpperCase()}
               </div>
               <div>
                 <div className="font-bold text-lg leading-tight">{activeName}</div>
                 <div className="text-xs text-slate-500">{currentConvData?.isGroup ? `${currentConvData.participants.length} thành viên` : 'Trò chuyện cá nhân'}</div>
               </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUserId
                // Only show name for received messages in group chats
                const showName = !isMe && currentConvData?.isGroup && (idx === 0 || messages[idx-1].senderId !== msg.senderId);
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showName && <span className="text-[10px] font-bold text-slate-500 ml-2 mb-1">{msg.sender?.name}</span>}
                      <div className={`rounded-2xl px-4 py-2 ${isMe ? 'bg-[var(--primary)] text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'}`}>
                        <div className="break-words font-medium">{msg.content}</div>
                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </div>
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
            <MessageSquare size={80} className="mb-6 opacity-20" />
            <h3 className="text-2xl font-bold text-slate-600 dark:text-slate-400">Không gian Trò chuyện số</h3>
            <p className="mt-2 text-center max-w-sm">Chọn một đồng nghiệp hoặc nhóm bên trái để bắt đầu nhắn tin và trao đổi công việc!</p>
          </div>
        )}
      </div>

      {/* Group Create Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg">Tạo nhóm trò chuyện</h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Tên nhóm</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)]"
                  placeholder="Nhập tên nhóm..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Chọn thành viên</label>
                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2 space-y-1">
                  {users.map((u: any) => (
                    <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                      <input 
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUsers(prev => [...prev, u.id])
                          else setSelectedUsers(prev => prev.filter(id => id !== u.id))
                        }}
                        className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <div className="flex-1 font-medium text-sm">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </label>
                  ))}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="w-full py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
              >
                Khởi tạo Nhóm
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
