"use client"

import { useState } from "react"
import { updateSettings, testDriveConfig, testSmtpConfig } from "@/actions/setting"
import { Save, Loader2, Database, Mail, Cloud, PlayCircle } from "lucide-react"

export default function ClientSettings({ initialData }: { initialData: Record<string, string> }) {
  const [loading, setLoading] = useState(false)
  
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateSettings({
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
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
      {/* GOOGLE DRIVE CONFIG */}
      <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
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
              required
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
              required
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
              required
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
        </div>
      </div>

      {/* GMAIL SMTP CONFIG */}
      <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
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
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="lg:col-span-2 flex justify-end gap-4 mt-2">
        <button disabled={loading} type="submit" className="bg-[var(--primary)] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-colors shadow-lg shadow-indigo-500/30 text-lg">
          {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
          Lưu Toàn bộ Điểm Cấu hình
        </button>
      </div>
    </form>
  )
}
