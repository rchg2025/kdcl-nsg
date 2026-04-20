"use client"

import { useState } from "react"
import Link from "next/link"
import { createStandard, deleteStandard } from "@/actions/standard"
import { Plus, Folder, Trash2, Edit, ChevronDown, ChevronRight, Loader2 } from "lucide-react"

type Standard = {
  id: string
  name: string
  description: string | null
  year: number
  _count: { criteria: number }
}

export default function ClientCriteriaList({ initialStandards }: { initialStandards: Standard[] }) {
  const [standards, setStandards] = useState(initialStandards)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newStd = await createStandard({ name, description, year })
      setStandards([{...newStd, _count: { criteria: 0 }}, ...standards])
      setIsModalOpen(false)
      setName("")
      setDescription("")
    } catch (err) {
      console.error(err)
      alert("Đã xảy ra lỗi khi tạo tiêu chuẩn")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tiêu chuẩn này? Tất cả tiêu chí và minh chứng bên trong sẽ bị xóa!")) return
    try {
      await deleteStandard(id)
      setStandards(standards.filter(s => s.id !== id))
    } catch (err) {
      console.error(err)
      alert("Đã xảy ra lỗi khi xóa")
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-colors shadow-md shadow-indigo-500/20"
        >
          <Plus size={18} />
          Thêm Tiêu chuẩn
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {standards.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Folder size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Chưa có Tiêu chuẩn nào</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">Tạo tiêu chuẩn đầu tiên để bắt đầu thêm các tiêu chí quản lý chất lượng.</p>
          </div>
        ) : (
          standards.map((std) => (
            <div key={std.id} className="glass rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors group relative">
              <Link href={`/admin/criteria/${std.id}`} className="absolute inset-0 z-0"></Link>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-start gap-4 pointer-events-none">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[var(--primary)] flex-shrink-0 mt-1">
                    <Folder size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-[var(--foreground)]">{std.name}</h3>
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg">Năm {std.year}</span>
                    </div>
                    {std.description && <p className="text-sm text-slate-500 mt-1.5">{std.description}</p>}
                    <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {std._count.criteria} Tiêu chí
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button className="p-2 text-slate-400 hover:text-[var(--primary)] hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(std.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold">Thêm Tiêu chuẩn mơi</h3>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Tên Tiêu chuẩn</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                  placeholder="Vd: Tiêu chuẩn 1: Tầm nhìn, sứ mạng"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Mô tả chi tiết</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] min-h-[100px]"
                  placeholder="Mô tả cho tiêu chuẩn này..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Năm áp dụng</label>
                <input 
                  type="number" 
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                  required
                />
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
                  Lưu Tiêu chuẩn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
