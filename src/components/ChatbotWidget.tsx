"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Loader2, MessageCircleQuestion } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ChatMessage {
  role: "user" | "model"
  content: string
}

interface ChatbotWidgetProps {
  settings: Record<string, string>
}

const INITIAL_SUGGESTIONS = [
  "Tiến độ duyệt minh chứng hiện tại ra sao?",
  "Tiêu chuẩn nào có nhiều minh chứng nhất?",
  "Hệ thống có tổng cộng bao nhiêu tiêu chuẩn và tiêu chí?"
]

export default function ChatbotWidget({ settings }: ChatbotWidgetProps) {
  const enabled = settings["CHATBOT_ENABLED"] === "true"
  const primaryColor = settings["CHATBOT_PRIMARY_COLOR"] || "#FDC700"
  const position = settings["CHATBOT_POSITION"] || "left"
  const width = settings["CHATBOT_WIDTH"] || "350px"
  const height = settings["CHATBOT_HEIGHT"] || "480px"

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content: "Xin chào! Tôi là Trợ lý ảo KDCL - NSG ChatbotAI. Bạn cần hỗ trợ thông tin gì về các Tiêu chuẩn và Tiêu chí đánh giá chất lượng?"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen, dynamicSuggestions])

  if (!enabled) return null

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setDynamicSuggestions([])
    setLoading(true)

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra")
      }

      let rawContent = data.content;
      let newSuggestions: string[] = [];

      // Phân tách phần gợi ý câu hỏi từ AI
      if (rawContent.includes("---SUGGESTIONS---")) {
        const parts = rawContent.split("---SUGGESTIONS---");
        rawContent = parts[0].trim();
        const suggestionsPart = parts[1].trim();
        // Lấy từng dòng, loại bỏ các ký tự dấu -, *, số thứ tự ở đầu
        newSuggestions = suggestionsPart.split("\n")
          .map((line: string) => line.replace(/^[\d\.\-\*\s]+/, '').trim())
          .filter((line: string) => line.length > 0);
      }

      setMessages(prev => [...prev, { role: "model", content: rawContent }])
      if (newSuggestions.length > 0) {
        setDynamicSuggestions(newSuggestions)
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "model", content: `❌ Lỗi API: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`fixed z-[9999] bottom-6 ${position === "left" ? "left-6" : "right-6"}`}>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: primaryColor }}
          className="w-14 h-14 rounded-full text-white shadow-xl shadow-black/20 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Bot size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 origin-bottom"
          style={{ width: width, height: height, maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 48px)' }}
        >
          {/* Header */}
          <div 
            className="px-4 py-3 text-white flex items-center justify-between shadow-sm z-10"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2 font-bold">
              <Bot size={20} />
              KDCL - NSG ChatbotAI
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-black/20 p-1.5 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50 dark:bg-slate-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                    msg.role === "user" 
                      ? "text-white rounded-br-sm shadow-md" 
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm"
                  }`}
                  style={msg.role === "user" ? { backgroundColor: primaryColor } : {}}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-semibold prose-a:underline hover:prose-a:text-blue-800">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" />
                          )
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Suggestions */}
            {dynamicSuggestions.length > 0 && !loading && (
              <div className="flex flex-wrap gap-2 pt-2">
                {dynamicSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <MessageCircleQuestion size={14} className="opacity-70 flex-shrink-0" />
                    <span className="text-left">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2 shadow-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs">AI đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Hỏi AI về tiêu chuẩn, tiêu chí..."
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              style={{ backgroundColor: primaryColor }}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-white disabled:opacity-50 transition-opacity"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
