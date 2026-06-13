"use client"

import { useState } from "react"
import { updateSettings, testDriveConfig, testSmtpConfig } from "@/actions/setting"
import { Save, Loader2, Mail, Cloud, PlayCircle, Globe, LayoutBottom, Code, Bot, UploadCloud, Rocket } from "lucide-react"

type TabId = 'seo' | 'footer' | 'drive' | 'smtp' | 'scripts' | 'chatbot'

const TABS = [
  { id: 'seo' as TabId, label: 'SEO & Logo', icon: Globe },
  { id: 'footer' as TabId, label: 'Footer', icon: LayoutBottom },
  { id: 'drive' as TabId, label: 'Google Drive', icon: Cloud },
  { id: 'smtp' as TabId, label: 'SMTP Email', icon: Mail },
  { id: 'scripts' as TabId, label: 'Mã nhúng', icon: Code },
  { id: 'chatbot' as TabId, label: 'AI Chatbot', icon: Bot },
]

export default function ClientSettings({ initialData }: { initialData: Record<string, string> }) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('seo')
  
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

  const [testingDrive, setTestingDrive] = useState(false)
  const [testingSmtp, setTestingSmtp] = useState(false)

  const handleTestDrive = async () => {
    if (!driveEmail || !driveKey || !driveFolder) return alert("Vui lòng điền đủ thông tin Google Drive")
    setTestingDrive(true)
    const res = await testDriveConfig(driveEmail, driveKey, driveFolder)
    alert(res.message)
    setTestingDrive(false)
  }

  const handleTestSmtp = async () => {
    if (!gmailUser || !gmailPass) return alert("Vui lòng điền đủ thông tin Gmail SMTP")
    setTestingSmtp(true)
    const res = await testSmtpConfig(gmailUser, gmailPass)
    alert(res.message)
    setTestingSmtp(false)
  }

  const handleIndexGoogle = () => {
    alert("Chức năng ép Google Index đang được phát triển và sẽ gọi đến Google Indexing API.")
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
        GMAIL_USER: gmailUser,
        GMAIL_PASS: gmailPass
      })
      alert("Đã lưu cấu hình Hệ thống thành công!")
      window.location.reload()
    } catch {
      alert("Có lỗi khi lưu cấu hình.")
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
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Kéo thả logo vào đây (hoặc click để chọn)</p>
                    <input 
                      type="text" 
                      value={logoUrl} 
                      onChange={e => setLogoUrl(e.target.value)} 
                      placeholder="Hoặc nhập Link URL trực tiếp..." 
                      className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg outline-none focus:border-[var(--primary)] text-xs mt-2" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Ảnh đại diện chia sẻ link (OG Image)</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Ảnh hiển thị mặc định cho các bài viết không có ảnh</p>
                    <input 
                      type="text" 
                      value={ogImageUrl} 
                      onChange={e => setOgImageUrl(e.target.value)} 
                      placeholder="Hoặc nhập Link URL trực tiếp..." 
                      className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg outline-none focus:border-[var(--primary)] text-xs mt-2" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={handleIndexGoogle} className="border border-blue-200 bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors">
                  <Rocket size={18} />
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

        {/* PLACEHOLDER TABS */}
        {['footer', 'scripts', 'chatbot'].includes(activeTab) && (
          <div className="glass rounded-2xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Code size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Đang phát triển</h3>
            <p className="text-slate-500">Tính năng này đang được xây dựng và sẽ sớm ra mắt trong các phiên bản tiếp theo.</p>
          </div>
        )}
      </form>
    </div>
  )
}
