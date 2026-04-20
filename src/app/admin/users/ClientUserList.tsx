"use client"

import { useState } from "react"
import { createUser, deleteUser, updateUser } from "@/actions/user"
import { Plus, Trash2, Edit2, ShieldAlert, Loader2, KeyRound } from "lucide-react"
import Link from "next/link"

type Department = { id: string; name: string }
type Position = { id: string; name: string }

type UserInfo = {
  id: string
  name: string | null
  email: string | null
  role: string
  departmentId: string | null
  positionId: string | null
  department?: Department | null
  position?: Position | null
  createdAt: Date
}

export default function ClientUserList({ initialUsers, departments, positions }: { initialUsers: UserInfo[], departments: Department[], positions: Position[] }) {
  const [users, setUsers] = useState<UserInfo[]>(initialUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form values
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("COLLABORATOR")
  const [departmentId, setDepartmentId] = useState("")
  const [positionId, setPositionId] = useState("")

  const openCreate = () => {
    setEditingId(null)
    setName("")
    setEmail("")
    setPassword("")
    setRole("COLLABORATOR")
    setDepartmentId("")
    setPositionId("")
    setIsModalOpen(true)
  }

  const openEdit = (user: UserInfo) => {
    setEditingId(user.id)
    setName(user.name || "")
    setEmail(user.email || "")
    setPassword("") // Left blank unless they want to change it
    setRole(user.role)
    setDepartmentId(user.departmentId || "")
    setPositionId(user.positionId || "")
    setIsModalOpen(true)
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingId) {
        await updateUser(editingId, { 
          name, 
          role: role as any, 
          departmentId, 
          positionId,
          password: password.trim() ? password : undefined 
        })
      } else {
        await createUser({ 
          name, 
          email, 
          role: role as any, 
          departmentId, 
          positionId, 
          password: password.trim() ? password : undefined 
        })
      }
      window.location.reload()
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi")
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này không?")) return
    try {
      await deleteUser(id)
      setUsers(users.filter(u => u.id !== id))
    } catch (err) {
      alert("Đã xảy ra lỗi khi xóa")
    }
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    SUPERVISOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    COLLABORATOR: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    INVESTIGATOR: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400"
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button 
          onClick={openCreate}
          className="bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-colors shadow-md shadow-indigo-500/20"
        >
          <Plus size={18} />
          Thêm thành viên
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-3">
          <thead>
            <tr className="text-slate-400 text-xs tracking-wider uppercase px-4">
              <th className="font-semibold px-4 pb-2">Người dùng</th>
              <th className="font-semibold px-4 pb-2">Đơn vị / Chức vụ</th>
              <th className="font-semibold px-4 pb-2">Vai trò Hệ thống</th>
              <th className="font-semibold px-4 pb-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="group">
                <td className="bg-white dark:bg-slate-900/80 px-4 py-4 rounded-l-2xl border-y border-l border-slate-100 dark:border-slate-800 shadow-sm relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                      {user.name?.[0] || user.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--foreground)]">{user.name}</h4>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                
                <td className="bg-white dark:bg-slate-900/80 px-4 py-4 border-y border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="text-sm">
                    <div className="font-medium text-slate-700 dark:text-slate-200">{user.department?.name || <span className="text-slate-400 italic">Chưa CBP</span>}</div>
                    <div className="text-xs text-slate-500">{user.position?.name || "---"}</div>
                  </div>
                </td>

                <td className="bg-white dark:bg-slate-900/80 px-4 py-4 border-y border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex gap-2 items-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </div>
                </td>

                <td className="bg-white dark:bg-slate-900/80 px-4 py-4 rounded-r-2xl border-y border-r border-slate-100 dark:border-slate-800 shadow-sm text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/users/permissions/${user.id}`} title="Ma trận Phân quyền">
                      <button className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                        <ShieldAlert size={16} />
                      </button>
                    </Link>
                    <button onClick={() => openEdit(user)} title="Sửa thông tin" className="p-2 text-slate-400 hover:text-[var(--primary)] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} title="Xóa tài khoản" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold">{editingId ? "Cập nhật Thông tin" : "Tạo Thành viên mới"}</h3>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Họ và tên</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Địa chỉ Email</label>
                  <input required disabled={!!editingId} type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm disabled:opacity-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Đơn vị (Khoa/Phòng)</label>
                  <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="w-full px-4 py-2 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm">
                    <option value="">-- Chưa biên chế --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Chức vụ</label>
                  <select value={positionId} onChange={e => setPositionId(e.target.value)} className="w-full px-4 py-2 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm">
                    <option value="">-- Trống --</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Vai trò Hệ thống</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm font-medium">
                  <option value="COLLABORATOR">Nộp & Viết báo cáo (COLLABORATOR)</option>
                  <option value="SUPERVISOR">Thu thập & Duyệt minh chứng (SUPERVISOR)</option>
                  <option value="INVESTIGATOR">Đánh giá Kết luận (INVESTIGATOR)</option>
                  <option value="ADMIN">Quản trị toàn quyền (ADMIN)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 flex justify-between">
                  Mật khẩu đăng nhập
                  <span className="font-normal text-slate-500 text-xs">Để trống = "123456"</span>
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editingId ? "Giữ trống nếu không đổi..." : "123456"} className="w-full px-4 py-2 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium text-sm">Hủy</button>
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-[var(--primary)] text-white rounded-xl font-medium flex items-center justify-center text-sm">{loading ? <Loader2 size={16} className="animate-spin" /> : "Lưu"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
