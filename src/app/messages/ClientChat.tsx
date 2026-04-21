"use client"

import { useState, useEffect, useRef } from "react"
import { getMessages, sendMessage, startDirectConversation, getConversations, createGroupConversation, markAsRead, deleteConversation } from "@/actions/chat"
import { Search, Send, Circle, MessageSquare, Users, Plus, X, User as UserIcon, Home, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"

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
  
  // File attachments in chat
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Group creation modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Load messages when switching conversation (one-time fetch)
  useEffect(() => {
    if (activeConv) {
      const loadMessages = async () => {
        const msgs = await getMessages(activeConv)
        setMessages(msgs)
        await markAsRead(activeConv)
      }
      loadMessages()
    } else {
      setMessages([])
    }
  }, [activeConv])

  // SSE Stream - realtime new message updates
  useEffect(() => {
    if (!currentUserId) return

    const connectSSE = () => {
      const eventSource = new EventSource(`/api/chat/stream`, { withCredentials: true })

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === "messages") {
            const newMsgs = payload.data

            // Play notification sound for messages from other users
            const hasNewOtherMsg = newMsgs.some((m: any) => m.senderId !== currentUserId)
            if (hasNewOtherMsg) {
              playNotification()
            }

            // Append messages to chat window if they belong to the active conversation
            setActiveConv(currentActive => {
              const msgsForActive = newMsgs.filter((m: any) => m.conversationId === currentActive)
              if (msgsForActive.length > 0) {
                setMessages(prev => {
                  const existingIds = new Set(prev.map((m: any) => m.id))
                  const deduped = msgsForActive.filter((m: any) => !existingIds.has(m.id))
                  return deduped.length > 0 ? [...prev, ...deduped] : prev
                })
                // Mark as read in background
                if (currentActive) markAsRead(currentActive)
              }
              return currentActive // Don't actually change state
            })

            // Update conversation list: bump unread counts and latest message preview
            setConversations((prev: any[]) => prev.map((c: any) => {
              const msgsForC = newMsgs.filter((m: any) => m.conversationId === c.id)
              if (msgsForC.length > 0) {
                const latest = msgsForC[msgsForC.length - 1]
                return {
                  ...c,
                  messages: [latest],
                  unreadCount: (c.unreadCount || 0) + msgsForC.filter((m: any) => m.senderId !== currentUserId).length,
                  updatedAt: latest.createdAt
                }
              }
              return c
            }).sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()))
          }
        } catch (e) {}
      }

      eventSource.onerror = () => {
        // Auto-reconnect after 3 seconds on error
        eventSource.close()
        setTimeout(connectSSE, 3000)
      }

      eventSourceRef.current = eventSource
    }

    connectSSE()

    return () => {
      eventSourceRef.current?.close()
    }
  }, [currentUserId])

  // Auto scroll to bottom smoothly
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if ((!inputMsg.trim() && attachedFiles.length === 0) || !activeConv || uploadingFiles) return
    
    setUploadingFiles(true)
    try {
      let finalContent = inputMsg.trim()
      let uploadedUrls: {name: string, url: string}[] = []
      
      // Upload files first if any
      if (attachedFiles.length > 0) {
        setUploadProgress(0)
        const formData = new FormData()
        for (const file of attachedFiles) {
          formData.append("file", file)
        }
        
        const data = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open("POST", "/api/upload")
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100)
              setUploadProgress(pct)
            }
          }
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText))
              } catch(err) {
                resolve({ url: xhr.responseText })
              }
            } else {
              try {
                const err = JSON.parse(xhr.responseText)
                reject(new Error(err.error || "Lỗi upload"))
              } catch(err) {
                reject(new Error("Lỗi upload từ server"))
              }
            }
          }
          
          xhr.onerror = () => reject(new Error("Lỗi kết nối mạng"))
          xhr.send(formData)
        })
        
        if (data.url) {
           // data.url contains comma separated string of links. Let's parse them.
           const links = data.url.split(", ")
           for (let i = 0; i < links.length; i++) {
              uploadedUrls.push({ name: attachedFiles[i].name, url: links[i] })
           }
        }
        
        // Append urls to the message content as JSON string or text link so it shows up.
        // For simplicity we will embed links directly into the text if standard chat layout is used.
        if (uploadedUrls.length > 0) {
           const attachmentText = uploadedUrls.map(f => `[Tệp đính kèm: ${f.name}](${f.url})`).join("\n")
           finalContent = finalContent ? `${finalContent}\n\n${attachmentText}` : attachmentText
        }
      }

      // Optimistic UI might not show the file preview immediately, but we can fake it.
      const pendingMsg = {
        id: "temp-" + Date.now(),
        senderId: currentUserId,
        content: finalContent,
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, pendingMsg])
      setInputMsg("")
      setAttachedFiles([])
      
      await sendMessage(activeConv, finalContent)
      // SSE stream will automatically pick up the new message
    } catch (error) {
       alert("Lỗi khi gửi tệp đính kèm. Vui lòng thử lại.")
    } finally {
       setUploadingFiles(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
       if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          if (blob) {
             const file = new File([blob], `Pasted_Image_${Date.now()}.png`, { type: blob.type })
             setAttachedFiles(prev => [...prev, file])
          }
       }
    }
  }

  const handleStartDirectChat = async (targetUserId: string) => {
    const convId = await startDirectConversation(targetUserId)
    setActiveConv(convId)
    const convs = await getConversations()
    setConversations(convs)
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id)
      if (activeConv === id) setActiveConv(null)
      setConversations((prev: any[]) => prev.filter((c:any) => c.id !== id))
    } catch(e) {
      alert("Lỗi khi xóa hệ thống trò chuyện.")
    }
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
    <div className="flex relative h-[min(100vh,100dvh)] bg-white dark:bg-slate-900 overflow-hidden text-sm w-full">
      {/* Sidebar: Users / Conversations */}
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50 dark:bg-slate-950/50 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
               <Link href="/dashboard" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="Về trang chủ">
                 <Home size={20} />
               </Link>
               <h2 className="text-xl font-bold">Trò chuyện</h2>
             </div>
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
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer group transition-colors relative pr-8 ${activeConv === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
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
                      <div className="shrink-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 transition-opacity md:group-hover:opacity-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </div>
                    )}
                    
                    {/* Delete button */}
                    <button 
                       onClick={(e) => { 
                          e.stopPropagation(); 
                          if (confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này không? Việc này sẽ xóa toàn bộ lịch sử tin nhắn vĩnh viễn và không thể khôi phục!")) {
                             handleDeleteConversation(conv.id);
                          }
                       }}
                       title="Xóa cuộc trò chuyện này"
                       className="absolute right-2 shrink-0 p-1.5 text-red-400 hover:text-red-700 hover:bg-red-100 dark:hover:text-red-300 dark:hover:bg-red-900/40 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-20"
                    >
                       <Trash2 size={16} />
                    </button>
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
      <div className={`flex-1 flex col h-full w-full bg-slate-50 dark:bg-[var(--background)] flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex items-center gap-3 bg-white dark:bg-slate-900 z-10 sticky top-0">
               <button onClick={() => setActiveConv(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
               </button>
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
                        <div className="break-words font-medium whitespace-pre-wrap">
                           {msg.content?.split('\n').map((line: string, i: number) => {
                             // Detect simple link pattern we created above
                             const linkMatch = line.match(/\[Tệp đính kèm:\s*(.*?)\]\((.*?)\)/)
                             if (linkMatch) {
                               const [, name, url] = linkMatch
                               const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)
                               if (isImage) {
                                 let imgUrl = url;
                                 const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                 const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                                 const fileId = dMatch ? dMatch[1] : (idMatch ? idMatch[1] : null);
                                 if (fileId) {
                                     imgUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
                                 }
                                 return (
                                   <a key={i} href={url} target="_blank" className="block mt-2">
                                     <img src={imgUrl} alt={name} className="max-w-[200px] sm:max-w-[250px] h-auto rounded-xl border border-slate-200/50 dark:border-slate-700/50" />
                                   </a>
                                 )
                               }
                               return <a key={i} href={url} target="_blank" className="block mt-1 text-sm underline opacity-90 hover:opacity-100 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]" title={name}>Tệp: {name}</a>
                             }
                             return <span key={i} className="block">{line}</span>
                           })}
                        </div>
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
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 pb-4 md:pb-3 relative">
              {/* Progress Overlay */}
              {uploadingFiles && (
                <div className="absolute inset-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 size={20} className="animate-spin text-[var(--primary)]" />
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      Đang xử lý tệp ({uploadProgress}%)
                    </span>
                  </div>
                  <div className="w-full max-w-[200px] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-[var(--primary)] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {attachedFiles.length > 0 && (
                <div className="flex gap-2 p-2 overflow-x-auto mb-2 border-b border-slate-100 dark:border-slate-800">
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className=" relative bg-slate-100 dark:bg-slate-800 rounded p-2 text-xs flex items-center gap-2 max-w-[150px]">
                      <span className="truncate">{file.name}</span>
                      <button onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500"><X size={12}/></button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-2 items-end relative">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 shrink-0 self-stretch flex items-center justify-center mb-0 transition-colors h-[46px]">
                  <Plus size={18} />
                </button>
                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={e => {
                  if (e.target.files) setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)])
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }} />
                
                <textarea 
                  rows={1}
                  value={inputMsg}
                  onChange={e => {
                    setInputMsg(e.target.value)
                    e.currentTarget.style.height = 'auto'
                    e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 72) + 'px'
                  }}
                  onPaste={handlePaste}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Nhập tin nhắn hoặc dán ảnh..." 
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] text-base md:text-sm transition-colors font-medium min-w-0 resize-none overflow-y-auto"
                  style={{ minHeight: '46px', maxHeight: '72px', height: '46px' }}
                />
                <button type="submit" disabled={(!inputMsg.trim() && attachedFiles.length === 0) || uploadingFiles} className="bg-[var(--primary)] text-white px-5 rounded-xl flex items-center justify-center hover:bg-[var(--primary-hover)] transition-colors shadow-sm disabled:opacity-50 h-[46px] shrink-0">
                  {uploadingFiles ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
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
