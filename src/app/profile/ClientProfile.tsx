"use client"

import { useState } from "react"
import { updateMyProfile } from "@/actions/profile"
import { User, Mail, Building, Briefcase, KeyRound, Loader2, Save } from "lucide-react"

export default function ClientProfile({ user }: { user: any }) {
  const [name, setName] = useState(user.name || "")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword && !oldPassword) {
       return alert("Vui lòng nhập mật khẩu cũ để xác thực đổi mật khẩu.")
    }
    setLoading(true)
    try {
      await updateMyProfile({ name, oldPassword, newPassword })
      alert("Cập nhật thông tin thành công!")
      setOldPassword("")
      setNewPassword("")
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-1 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-4xl font-bold shadow-lg mb-4">
          {user.name?.[0] || user.email?.[0]?.toUpperCase()}
        </div>
        <h2 className="text-lg font-bold text-center">{user.name}</h2>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold rounded-full mt-2 tracking-wider">
          {user.role}
        </span>
      </div>

      <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-2">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 mb-2"><Mail size={16}/> Email đăng nhập</label>
              <input type="email" disabled value={user.email} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 cursor-not-allowed text-sm" />
            </div>
            
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2"><User size={16}/> Họ và tên</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-[var(--primary)] text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 mb-2"><Building size={16}/> Đơn vị biên chế</label>
                <input type="text" disabled value={user.department?.name || "Chưa trực thuộc"} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 cursor-not-allowed text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 mb-2"><Briefcase size={16}/> Chức vụ hiện tại</label>
                <input type="text" disabled value={user.position?.name || "---"} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 cursor-not-allowed text-sm" />
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-800 my-2" />

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2"><KeyRound size={16}/> Đổi mật khẩu mới (Tùy chọn)</label>
              <div className="space-y-3">
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Nhập Mật khẩu Cũ để xác nhận..." className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-amber-500 text-sm" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nhập Mật khẩu Mới..." className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-amber-500 text-sm" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button disabled={loading} type="submit" className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-colors shadow-md disabled:opacity-70">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
