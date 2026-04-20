"use client"

import { useState } from "react"
import { createStandard, deleteStandard } from "@/actions/standard"
import { createCriterion, deleteCriterion } from "@/actions/criterion"
import { Plus, Folder, Trash2, Edit, ChevronDown, ChevronRight, Loader2, ListTodo } from "lucide-react"

type Criterion = {
  id: string
  name: string
  description: string | null
  standardId: string
}

type Standard = {
  id: string
  name: string
  description: string | null
  year: number
  criteria: Criterion[]
  _count: { criteria: number }
}

export default function ClientCriteriaList({ initialStandards }: { initialStandards: Standard[] }) {
  const [standards, setStandards] = useState(initialStandards)
  const [expandedStds, setExpandedStds] = useState<Record<string, boolean>>({})
  
  // Modals state
  const [isStdModalOpen, setIsStdModalOpen] = useState(false)
  const [isCritModalOpen, setIsCritModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())
  const [parentStdId, setParentStdId] = useState("")

  const toggleExpand = (id: string) => {
    setExpandedStds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCreateStandard = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newStd = await createStandard({ name, description, year })
      setStandards([{...newStd, criteria: [], _count: { criteria: 0 }}, ...standards])
      setIsStdModalOpen(false)
      setName("")
      setDescription("")
    } catch (err) {
      alert("Đã xảy ra lỗi khi tạo tiêu chuẩn")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCriterion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parentStdId) return alert("Vui lòng chọn tiêu chuẩn cha!")
    setLoading(true)
    try {
      const newCrit = await createCriterion({ name, description, standardId: parentStdId })
      
      setStandards(standards.map(std => {
        if (std.id === parentStdId) {
          return { 
            ...std, 
            criteria: [...std.criteria, newCrit],
            _count: { criteria: std._count.criteria + 1 }
          }
        }
        return std
      }))
      
      setExpandedStds(prev => ({ ...prev, [parentStdId]: true }))
      setIsCritModalOpen(false)
      setName("")
      setDescription("")
      setParentStdId("")
    } catch (err) {
      alert("Đã xảy ra lỗi khi tạo tiêu chí")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStd = async (id: string) => {
    if (!confirm("Xóa Tiêu chuẩn này sẽ xóa mọi Tiêu chí và Minh chứng bên trong. Bạn chắc chưa?")) return
    try {
      await deleteStandard(id)
      setStandards(standards.filter(s => s.id !== id))
    } catch (err) {}
  }

  const handleDeleteCrit = async (id: string, stdId: string) => {
    if (!confirm("Xóa Tiêu chí này? Toàn bộ minh chứng sẽ mất!")) return
    try {
      await deleteCriterion(id, stdId)
      setStandards(standards.map(std => {
        if (std.id === stdId) {
          return { 
            ...std, 
            criteria: std.criteria.filter(c => c.id !== id),
            _count: { criteria: std._count.criteria - 1 }
          }
        }
        return std
      }))
    } catch (err) {}
  }

  return (
    <div>
      <div className="flex justify-end gap-3 mb-6">
        <button 
          onClick={() => { setIsStdModalOpen(true); setName(""); setDescription(""); }}
          className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Folder size={18} className="text-amber-500" />
          Thêm Tiêu chuẩn
        </button>
        <button 
          onClick={() => { setIsCritModalOpen(true); setName(""); setDescription(""); setParentStdId(standards[0]?.id || ""); }}
          className="bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-colors shadow-md shadow-indigo-500/20"
        >
          <Plus size={18} />
          Thêm Tiêu chí
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {standards.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-slate-700">Chưa có Tiêu chuẩn nào</h3>
          </div>
        ) : (
          standards.map((std) => (
            <div key={std.id} className="glass rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="p-5 flex items-start justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => toggleExpand(std.id)}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 flex-shrink-0 mt-1">
                    {expandedStds[std.id] ? <Folder size={24} /> : <Folder size={24} className="fill-current opacity-20" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-[var(--foreground)]">{std.name}</h3>
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg">Năm {std.year}</span>
                    </div>
                    {std.description && <p className="text-sm text-slate-500 mt-1.5">{std.description}</p>}
                    <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-[var(--primary)]">
                        {std._count.criteria} Tiêu chí bên trong
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteStd(std.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={18} />
                  </button>
                  <div className="p-2 text-slate-400">
                    {expandedStds[std.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </div>
              </div>

              {expandedStds[std.id] && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-4 pl-[4.5rem]">
                  {std.criteria.length === 0 ? (
                    <div className="text-sm text-slate-500 py-3 italic">Chưa có tiêu chí nào trong thư mục này.</div>
                  ) : (
                    <div className="space-y-3">
                      {std.criteria.map((crit, idx) => (
                        <div key={crit.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-start group/crit">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="shrink-0 w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                              <h4 className="font-bold text-[var(--foreground)]">{crit.name}</h4>
                            </div>
                            {crit.description && <p className="text-sm text-slate-500 pl-8 mt-1">{crit.description}</p>}
                          </div>
                          <button onClick={() => handleDeleteCrit(crit.id, std.id)} className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover/crit:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Tiêu chuẩn */}
      {isStdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2"><Folder size={20} className="text-amber-500"/> Thêm Tiêu chuẩn</h3>
            </div>
            <form onSubmit={handleCreateStandard} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Tên Tiêu chuẩn</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none focus:border-[var(--primary)]" placeholder="Vd: Tiêu chuẩn 1: Tầm nhìn" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Mô tả chi tiết</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none min-h-[80px]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Năm áp dụng</label>
                <input required type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsStdModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium">Hủy</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium flex items-center justify-center">{loading ? <Loader2 size={16} className="animate-spin" /> : "Lưu"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tiêu chí */}
      {isCritModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2"><ListTodo size={20} className="text-indigo-500"/> Thêm Tiêu chí</h3>
            </div>
            <form onSubmit={handleCreateCriterion} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Chọn Tiêu chuẩn trực thuộc</label>
                <select required value={parentStdId} onChange={e => setParentStdId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm font-medium">
                  {standards.map(s => (
                    <option key={s.id} value={s.id}>Năm {s.year} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Tên Tiêu chí</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none focus:border-[var(--primary)]" placeholder="Vd: 1.1 Khảo sát tầm nhìn" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Yêu cầu minh chứng (Mô tả)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none min-h-[100px]" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsCritModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium">Hủy</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium flex items-center justify-center">{loading ? <Loader2 size={16} className="animate-spin" /> : "Lưu"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
