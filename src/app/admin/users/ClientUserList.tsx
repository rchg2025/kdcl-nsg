"use client"

import { useState } from "react"
import { createUser, updateUserRole, deleteUser } from "@/actions/user"
import { Plus, UserCircle, Trash2, Edit, Loader2 } from "lucide-react"
import { Role } from "@prisma/client"

type UserItem = {
  id: string
  name: string | null
  email: string | null
  role: Role
}

export default function ClientUserList({ initialUsers }: { initialUsers: UserItem[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("COLLABORATOR")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newUser = await createUser({ name, email, role })
      setUsers([newUser, ...users])
      setIsModalOpen(false)
      setName("")
      setEmail("")
      alert("Tạo tài khoản thành công! Mật khẩu mặc định là: 123456")
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi tạo thành viên")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (id: string, newRole: Role) => {
    try {
      await updateUserRole(id, newRole)
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    } catch (err) {
      alert("Lỗi khi cập nhật quyền")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return
    try {
      await deleteUser(id)
      setUsers(users.filter(u => u.id !== id))
    } catch (err) {
      alert("Đã xảy ra lỗi khi xóa")
    }
  }

  const roleLabels: Record<Role, string> = {
    ADMIN: "Quản trị viên",
    SUPERVISOR: "Giám sát viên",
    COLLABORATOR: "Cộng tác viên",
    INVESTIGATOR: "Điều tra viên"
  }

  const roleColors: Record<Role, string> = {
    ADMIN: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    SUPERVISOR: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    COLLABORATOR: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    INVESTIGATOR: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-colors shadow-md shadow-indigo-500/20"
        >
          <Plus size={18} />
          Thêm Thành viên
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className="p-4 text-sm font-semibold text-slate-500">Tên</th>
              <th className="p-4 text-sm font-semibold text-slate-500">Email</th>
              <th className="p-4 text-sm font-semibold text-slate-500">Vai trò</th>
              <th className="p-4 text-sm font-semibold text-slate-500 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <UserCircle size={24} className="text-slate-400" />
                    <span className="font-semibold text-[var(--foreground)]">{user.name || "Chưa cập nhật"}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-500">{user.email}</td>
                <td className="p-4">
                  <select 
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${roleColors[user.role]}`}
                  >
                    {Object.entries(roleLabels).map(([val, label]) => (
                      <option key={val} value={val} className="text-slate-900 bg-white">{label}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold">Thêm Thành viên mới</h3>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Họ & Tên</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                  placeholder="Vd: Nguyễn Văn A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Đại chỉ Email (Tài khoản đăng nhập)</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                  placeholder="email@truongnsg.edu.vn"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phân quyền</label>
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value as Role)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="ADMIN">Quản trị viên</option>
                  <option value="SUPERVISOR">Giám sát viên</option>
                  <option value="COLLABORATOR">Cộng tác viên</option>
                  <option value="INVESTIGATOR">Điều tra viên</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Tạo Tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
