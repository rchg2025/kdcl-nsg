"use client"

import { useState, useRef } from "react"
import { updateSettings, testDriveConfig, testSmtpConfig } from "@/actions/setting"
import { Save, Loader2, Mail, Cloud, PlayCircle, Globe, Layout, Code, Bot, UploadCloud, Rocket, CheckCircle2, XCircle, AlertCircle, Key } from "lucide-react"
import { getDirectImageUrl } from "@/lib/utils"

type TabId = 'seo' | 'drive' | 'smtp' | 'google-login' | 'chatbot'

const TABS = [
  { id: 'seo' as TabId, label: 'SEO & Logo', icon: Globe },
  { id: 'drive' as TabId, label: 'Google Drive', icon: Cloud },
  { id: 'smtp' as TabId, label: 'SMTP Email', icon: Mail },
  { id: 'google-login' as TabId, label: 'Google Login', icon: Key },
  { id: 'chatbot' as TabId, label: 'AI Chatbot', icon: Bot },
]

export default function ClientSettings({ initialData }: { initialData: Record<string, string> }) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('seo')
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const ogImageInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingOgImage, setUploadingOgImage] = useState(false)

  const [toast, setToast] = useState<{message: string, type: 'success'|'error', visible: boolean}>({ message: '', type: 'success', visible: false })

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000)
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'ogImage') => {
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    
    if (type === 'logo') setUploadingLogo(true)
    else setUploadingOgImage(true)
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Lỗi tải ảnh lên")
      
      if (type === 'logo') setLogoUrl(data.url)
      else setOgImageUrl(data.url)
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      if (type === 'logo') setUploadingLogo(false)
      else setUploadingOgImage(false)
    }
  }
  
  // SEO & Logo State
  const [seoTitle, setSeoTitle] = useState(initialData["SEO_TITLE"] || "")
  const [seoDescription, setSeoDescription] = useState(initialData["SEO_DESCRIPTION"] || "")
  const [gscCode, setGscCode] = useState(initialData["GSC_CODE"] || "")
  const [logoUrl, setLogoUrl] = useState(initialData["LOGO_URL"] || "")
  const [ogImageUrl, setOgImageUrl] = useState(initialData["OG_IMAGE_URL"] || "")

  // Drive State
  const [driveEmail, setDriveEmail] = useState(initialData["GDRIVE_CLIENT_EMAIL"] || "")
  const [driveKey, setDriveKey] = useState(initialData["GDRIVE_PRIVATE_KEY"] || "")
  const [driveFolder, setDriveFolder] = useState(initialData["GDRIVE_FOLDER_ID"] || "")
  
  // Gmail State
  const [gmailUser, setGmailUser] = useState(initialData["GMAIL_USER"] || "")
  const [gmailPass, setGmailPass] = useState(initialData["GMAIL_PASS"] || "")

  // Google Login State
  const [googleClientId, setGoogleClientId] = useState(initialData["GOOGLE_CLIENT_ID"] || "")
  const [googleClientSecret, setGoogleClientSecret] = useState(initialData["GOOGLE_CLIENT_SECRET"] || "")

  // Chatbot State
  const [chatbotEnabled, setChatbotEnabled] = useState(initialData["CHATBOT_ENABLED"] === "true")
  const [chatbotApiKey, setChatbotApiKey] = useState(initialData["CHATBOT_API_KEY"] || "")
  const [chatbotPrimaryColor, setChatbotPrimaryColor] = useState(initialData["CHATBOT_PRIMARY_COLOR"] || "#FDC700")
  const [chatbotPosition, setChatbotPosition] = useState(initialData["CHATBOT_POSITION"] || "left")
  const [chatbotWidth, setChatbotWidth] = useState(initialData["CHATBOT_WIDTH"] || "350px")
  const [chatbotHeight, setChatbotHeight] = useState(initialData["CHATBOT_HEIGHT"] || "480px")

  const [testingDrive, setTestingDrive] = useState(false)
  const [testingSmtp, setTestingSmtp] = useState(false)

  const handleTestDrive = async () => {
    if (!driveEmail || !driveKey || !driveFolder) return showToast("Vui lòng điền đủ thông tin Google Drive", 'error')
    setTestingDrive(true)
    const res = await testDriveConfig(driveEmail, driveKey, driveFolder)
    showToast(res.message, res.success ? 'success' : 'error')
    setTestingDrive(false)
  }

  const handleTestSmtp = async () => {
    if (!gmailUser || !gmailPass) return showToast("Vui lòng điền đủ thông tin Gmail SMTP", 'error')
    setTestingSmtp(true)
    const res = await testSmtpConfig(gmailUser, gmailPass)
    showToast(res.message, res.success ? 'success' : 'error')
    setTestingSmtp(false)
  }

  const [indexing, setIndexing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleIndexGoogle = () => {
    setShowConfirm(true)
  }

  const executeIndexGoogle = async () => {
    setShowConfirm(false)
    setIndexing(true)
    try {
      const res = await fetch('/api/indexing', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Lỗi ép Index Google")
      }
      showToast(data.message || "Gửi yêu cầu ép Index thành công!")
      console.log("Index results:", data.results)
    } catch (err: any) {
      showToast("Có lỗi: " + err.message, 'error')
    } finally {
      setIndexing(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateSettings({
        SEO_TITLE: seoTitle,
        SEO_DESCRIPTION: seoDescription,
        GSC_CODE: gscCode,
        LOGO_URL: logoUrl,
        OG_IMAGE_URL: ogImageUrl,
        GDRIVE_CLIENT_EMAIL: driveEmail,
        GDRIVE_PRIVATE_KEY: driveKey,
        GDRIVE_FOLDER_ID: driveFolder,
        GMAIL_PASS: gmailPass,
        GOOGLE_CLIENT_ID: googleClientId,
        GOOGLE_CLIENT_SECRET: googleClientSecret,
        CHATBOT_ENABLED: chatbotEnabled.toString(),
        CHATBOT_API_KEY: chatbotApiKey,
        CHATBOT_PRIMARY_COLOR: chatbotPrimaryColor,
        CHATBOT_POSITION: chatbotPosition,
        CHATBOT_WIDTH: chatbotWidth,
        CHATBOT_HEIGHT: chatbotHeight,
      })
      showToast("Đã lưu cấu hình Hệ thống thành công!")
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      showToast("Có lỗi khi lưu cấu hình.", 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* TABS HEADER */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors whitespace-nowrap border-b-2 ${
                isActive 
                  ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5" 
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSave} className="pb-12">
        
        {/* SEO & LOGO TAB */}
        {activeTab === 'seo' && (
          <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Thông tin Website (SEO & Logo)</h3>
                <p className="text-xs text-slate-500">Cấu hình hiển thị website trên các công cụ tìm kiếm và mạng xã hội</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Tiêu đề Website (SEO Title)</label>
                <input 
                  type="text" 
                  value={seoTitle} 
                  onChange={e => setSeoTitle(e.target.value)} 
                  placeholder="VD: Hệ Thống Tư Vấn Tuyển Sinh" 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-[var(--primary)] text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Mô tả Website (SEO Description)</label>
                <textarea 
                  value={seoDescription} 
                  onChange={e => setSeoDescription(e.target.value)} 
                  placeholder="VD: Nền tảng tư vấn hỏi đáp sinh viên..." 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-[var(--primary)] text-sm min-h-[80px]" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Mã xác minh Google Search Console (Mã Code dạng chuỗi dài)</label>
                <input 
                  type="text" 
                  value={gscCode} 
                  onChange={e => setGscCode(e.target.value)} 
                  placeholder="Vd: 31X..." 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-[var(--primary)] text-sm" 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Link Logo chung</label>
                  <div 
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {uploadingLogo ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="animate-spin text-[var(--primary)] mb-2" size={32} />
                        <p className="text-sm font-medium text-slate-500">Đang tải lên...</p>
                      </div>
                    ) : logoUrl ? (
                      <div className="flex flex-col items-center justify-center">
                        <img src={getDirectImageUrl(logoUrl)} alt="Logo" className="max-h-24 mb-4 object-contain" />
                        <p className="text-xs text-slate-500 hover:text-[var(--primary)]">Click để tải ảnh khác</p>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Click để tải logo lên Drive</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'logo')
                        e.target.value = ''
                      }}
                    />
                  </div>
                  <input 
                    type="text" 
                    value={logoUrl} 
                    onChange={e => setLogoUrl(e.target.value)} 
                    placeholder="Hoặc nhập Link URL trực tiếp..." 
                    className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg outline-none focus:border-[var(--primary)] text-xs mt-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Ảnh đại diện chia sẻ link (OG Image)</label>
                  <div 
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                    onClick={() => ogImageInputRef.current?.click()}
                  >
                    {uploadingOgImage ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="animate-spin text-[var(--primary)] mb-2" size={32} />
                        <p className="text-sm font-medium text-slate-500">Đang tải lên...</p>
                      </div>
                    ) : ogImageUrl ? (
                      <div className="flex flex-col items-center justify-center">
                        <img src={getDirectImageUrl(ogImageUrl)} alt="OG Image" className="max-h-24 mb-4 object-contain" />
                        <p className="text-xs text-slate-500 hover:text-[var(--primary)]">Click để tải ảnh khác</p>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Click để tải OG Image lên Drive</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={ogImageInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'ogImage')
                        e.target.value = ''
                      }}
                    />
                  </div>
                  <input 
                    type="text" 
                    value={ogImageUrl} 
                    onChange={e => setOgImageUrl(e.target.value)} 
                    placeholder="Hoặc nhập Link URL trực tiếp..." 
                    className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg outline-none focus:border-[var(--primary)] text-xs mt-2" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={handleIndexGoogle} disabled={indexing} className="border border-blue-200 bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50">
                  {indexing ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
                  Ép Google Index
                </button>
                <button disabled={loading} type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DRIVE TAB */}
        {activeTab === 'drive' && (
          <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                <Cloud size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Lưu trữ Google Drive (Kho MC)</h3>
                <p className="text-xs text-slate-500">Service Account cấu hình cho quá trình Upload</p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-semibold mb-2">Thư mục Đích (Folder ID)</label>
                <input 
                  type="text" 
                  value={driveFolder} 
                  onChange={e => setDriveFolder(e.target.value)} 
                  placeholder="VD: 1aB2c3D4e5F6g7H8i9J0kL..." 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-blue-500 text-sm font-mono" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Service Account Email</label>
                <input 
                  type="email" 
                  value={driveEmail} 
                  onChange={e => setDriveEmail(e.target.value)} 
                  placeholder="kđcl-system@project.iam.gserviceaccount.com" 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-blue-500 text-sm font-mono" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Private Key (Nội dung chứng chỉ PEM)</label>
                <textarea 
                  value={driveKey} 
                  onChange={e => setDriveKey(e.target.value)} 
                  placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgk...\n-----END PRIVATE KEY-----" 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-blue-500 text-xs font-mono min-h-[140px]" 
                />
              </div>
              
              <button 
                type="button" 
                onClick={handleTestDrive}
                disabled={testingDrive}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {testingDrive ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                Kiểm tra Kết nối Drive
              </button>

              <div className="flex justify-end mt-4">
                <button disabled={loading} type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SMTP TAB */}
        {activeTab === 'smtp' && (
          <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Mail Server (Gmail SMTP)</h3>
                <p className="text-xs text-slate-500">Dùng để gửi thông báo tự động từ hệ thống</p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-semibold mb-2">Tài khoản Email gửi</label>
                <input 
                  type="email" 
                  value={gmailUser} 
                  onChange={e => setGmailUser(e.target.value)} 
                  placeholder="admin.truong@gmail.com" 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-rose-500 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">App Password (Mật khẩu ứng dụng 16 ký tự)</label>
                <input 
                  type="password" 
                  value={gmailPass} 
                  onChange={e => setGmailPass(e.target.value)} 
                  placeholder="••••••••••••••••" 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-rose-500 text-sm font-mono tracking-widest" 
                />
                <p className="text-xs text-slate-400 mt-2 italic">Dấu *** ẩn mã mật khẩu đảm bảo an toàn giao diện theo yêu cầu chuẩn ISO.</p>
              </div>

              <button 
                type="button" 
                onClick={handleTestSmtp}
                disabled={testingSmtp}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
              >
                {testingSmtp ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                Kiểm tra Kết nối Gmail
              </button>
              
              <div className="flex justify-end mt-4">
                <button disabled={loading} type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GOOGLE LOGIN TAB */}
        {activeTab === 'google-login' && (
          <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Cấu hình Đăng nhập bằng Google</h3>
                <p className="text-xs text-slate-500">Cấu hình OAuth 2.0 Client ID để cho phép đăng nhập bằng tài khoản Google</p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-semibold mb-2">Google Client ID</label>
                <input 
                  type="text" 
                  value={googleClientId} 
                  onChange={e => setGoogleClientId(e.target.value)} 
                  placeholder="VD: 1234567890-abc123def456..." 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-orange-500 text-sm font-mono" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Google Client Secret</label>
                <input 
                  type="password" 
                  value={googleClientSecret} 
                  onChange={e => setGoogleClientSecret(e.target.value)} 
                  placeholder="VD: GOCSPX-..." 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-orange-500 text-sm font-mono tracking-widest" 
                />
              </div>

              <div className="flex justify-end mt-4">
                <button disabled={loading} type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHATBOT TAB */}
        {activeTab === 'chatbot' && (
          <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Cấu hình AI Chatbot</h3>
                <p className="text-xs text-slate-500">Cấu hình trợ lý ảo AI để trả lời câu hỏi của người dùng dựa trên Tiêu chuẩn và Tiêu chí.</p>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="chatbotEnabled"
                  checked={chatbotEnabled} 
                  onChange={e => setChatbotEnabled(e.target.checked)} 
                  className="w-4 h-4 text-[var(--primary)] rounded border-slate-300 focus:ring-[var(--primary)]" 
                />
                <label htmlFor="chatbotEnabled" className="text-sm font-semibold cursor-pointer">Kích hoạt Chatbot AI</label>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Gemini API Key</label>
                <input 
                  type="password" 
                  value={chatbotApiKey} 
                  onChange={e => setChatbotApiKey(e.target.value)} 
                  placeholder="AIzaSy..." 
                  className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono tracking-widest" 
                />
                <p className="text-xs text-slate-400 mt-2">Lấy tại Google AI Studio. Có thể để trống nếu đã cấu hình trong .env.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Màu sắc chủ đạo</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={chatbotPrimaryColor} 
                      onChange={e => setChatbotPrimaryColor(e.target.value)} 
                      className="w-10 h-10 p-1 rounded border dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer" 
                    />
                    <input 
                      type="text" 
                      value={chatbotPrimaryColor} 
                      onChange={e => setChatbotPrimaryColor(e.target.value)} 
                      className="flex-1 px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Vị trí hiển thị</label>
                  <select 
                    value={chatbotPosition} 
                    onChange={e => setChatbotPosition(e.target.value)} 
                    className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="left">Góc dưới bên trái</option>
                    <option value="right">Góc dưới bên phải</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Chiều rộng khung chat</label>
                  <input 
                    type="text" 
                    value={chatbotWidth} 
                    onChange={e => setChatbotWidth(e.target.value)} 
                    placeholder="350px" 
                    className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Chiều cao khung chat</label>
                  <input 
                    type="text" 
                    value={chatbotHeight} 
                    onChange={e => setChatbotHeight(e.target.value)} 
                    placeholder="480px" 
                    className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono" 
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button disabled={loading} type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        )}




      </form>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-4 right-4 z-[9999] transition-all duration-500 transform ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/80 dark:border-red-800/50 dark:text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={24} className="text-emerald-500" /> : <XCircle size={24} className="text-red-500" />}
          <div>
            <h4 className="font-bold text-sm">{toast.type === 'success' ? 'Thành công' : 'Lỗi'}</h4>
            <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>
          </div>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold">Xác nhận ép Index</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Hệ thống sẽ gửi tất cả các Link từ sitemap lên Google. Bạn đã cấu hình Service Account trong Google Search Console chưa?
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowConfirm(false)} className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors">
                Huỷ
              </button>
              <button type="button" onClick={executeIndexGoogle} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2">
                <Rocket size={16} />
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
