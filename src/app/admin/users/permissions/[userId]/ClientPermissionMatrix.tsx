"use client"

import { useState } from "react"
import { updateMenuPermissions, updateCriterionPermissions } from "@/actions/permission"
import { LayoutDashboard, FileText, CheckSquare, FileCheck, Save, Loader2, FolderOpen } from "lucide-react"

type Permission = {
  id: string
  permissionType: string
  resourceId: string
}

type StandardWithCriteria = {
  id: string
  name: string
  year: number
  criteria: { id: string; name: string }[]
}

const ALL_MENUS = [
  { path: "/collaborator/evidence", name: "Cấp độ Nộp (Cộng tác viên)", icon: FileText },
  { path: "/supervisor/review", name: "Cấp độ Duyệt (Giám sát viên)", icon: FileCheck },
  { path: "/investigator/evaluate", name: "Cấp độ Đánh giá (Điều tra viên)", icon: CheckSquare },
]

export default function ClientPermissionMatrix({ userId, userRole, initialPermissions, standards }: { userId: string, userRole: string, initialPermissions: Permission[], standards: StandardWithCriteria[] }) {
  const [loading, setLoading] = useState(false)
  
  const initMenuSet = new Set(initialPermissions.filter(p => p.permissionType === "MENU").map(p => p.resourceId))
  const initCritSet = new Set(initialPermissions.filter(p => p.permissionType === "CRITERION").map(p => p.resourceId))

  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(initMenuSet)
  const [selectedCriteria, setSelectedCriteria] = useState<Set<string>>(initCritSet)

  const toggleMenu = (path: string) => {
    const newSet = new Set(selectedMenus)
    if (newSet.has(path)) newSet.delete(path)
    else newSet.add(path)
    setSelectedMenus(newSet)
  }

  const toggleCriterion = (id: string) => {
    const newSet = new Set(selectedCriteria)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedCriteria(newSet)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateMenuPermissions(userId, Array.from(selectedMenus))
      await updateCriterionPermissions(userId, Array.from(selectedCriteria))
      alert("Đã áp dụng toàn bộ Quy tắc Phân quyền (Permissions Matrix) thành công!")
    } catch {
      alert("Lỗi khi lưu phân quyền")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* CỘT MENU */}
      <div className="glass rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold mb-1">Cấp quyền Truy cập Giao diện (Menu)</h3>
        <p className="text-xs text-slate-500 mb-6">Tài khoản này được phép nhìn thấy và bấm vào các trang nào trên thanh công cụ Sidebar?</p>

        <div className="space-y-3">
          {ALL_MENUS.map(m => (
            <label key={m.path} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${selectedMenus.has(m.path) ? 'border-[var(--primary)] bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <div className="flex-1 flex items-center gap-3">
                <m.icon size={20} className={selectedMenus.has(m.path) ? 'text-[var(--primary)]' : 'text-slate-400'} />
                <div>
                  <h4 className="font-bold text-sm">{m.name}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{m.path}</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={selectedMenus.has(m.path)}
                onChange={() => toggleMenu(m.path)}
                className="w-5 h-5 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
            </label>
          ))}
        </div>
        
        <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 italic">
          Lưu ý: Đối với tài khoản ADMIN, các link menu mặc định của hệ thống quản trị (/admin/...) vẫn luôn hiển thị bất chấp bảng phân quyền trên đây. Bảng này đặc tả giới hạn luồng "Nghiệp vụ Môn học" (Nộp, Duyệt, Chấm).
        </div>
      </div>

      {/* CỘT TIÊU CHÍ */}
      <div className="glass rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[70vh] overflow-hidden">
        <div className="shrink-0">
          <h3 className="text-lg font-bold mb-1">Cấp quyền Tham gia Tiêu chí (Criterion)</h3>
          <p className="text-xs text-slate-500 mb-6">Tài khoản này được phép nộp minh chứng cho những tiêu chí cụ thể nào?</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {standards.map(std => (
            <div key={std.id} className="space-y-2">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 px-3 rounded-lg sticky top-0 z-10 font-bold text-sm shadow-sm">
                <FolderOpen size={16} className="text-amber-500" />
                {std.year} - {std.name}
              </div>
              <div className="pl-4 space-y-2">
                {std.criteria.map(crit => (
                  <label key={crit.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                     <input 
                      type="checkbox" 
                      checked={selectedCriteria.has(crit.id)}
                      onChange={() => toggleCriterion(crit.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium">{crit.name}</span>
                  </label>
                ))}
                {std.criteria.length === 0 && <span className="text-xs text-slate-400 italic">Chưa có tiêu chí con.</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nút SAVE cố định */}
      <div className="lg:col-span-2 flex justify-end">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-[var(--primary)] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-colors shadow-lg shadow-indigo-500/30 text-lg"
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
          Lưu Ma trận Phân Quyền
        </button>
      </div>
    </div>
  )
}
