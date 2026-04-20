"use client"

import { useState } from "react"
import { createStandard, updateStandard, deleteStandard } from "@/actions/standard"
import { createCriterion, updateCriterion, deleteCriterion } from "@/actions/criterion"
import { Plus, Folder, Trash2, Edit, ChevronDown, ChevronRight, Loader2, ListTodo } from "lucide-react"

type EvidenceItem = {
  id: string
  name: string
  description: string | null
  criterionId: string
}

type Criterion = {
  id: string
  name: string
  description: string | null
  standardId: string
  items: EvidenceItem[]
}

type Standard = {
  id: string
  name: string
  description: string | null
  year: number
  criteria: Criterion[]
  _count: { criteria: number }
}

function CriterionRow({ crit, idx, openEditCrit, handleDeleteCrit }: any) {
  const [items, setItems] = useState<EvidenceItem[]>(crit.items || [])
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [newItemDesc, setNewItemDesc] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName) return
    setLoading(true)
    try {
      const parentModule = await import("@/actions/criterion")
      const added = await parentModule.createEvidenceItem({ name: newItemName, description: newItemDesc, criterionId: crit.id })
      setItems([...items, added])
      setNewItemName("")
      setNewItemDesc("")
      setShowAddForm(false)
    } catch (err) {
      alert("Lỗi khi thêm danh mục minh chứng")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm("Xóa danh mục minh chứng này? Các hồ sơ đã nộp sẽ mất liên kết!")) return
    try {
      const parentModule = await import("@/actions/criterion")
      await parentModule.deleteEvidenceItem(itemId)
      setItems(items.filter(i => i.id !== itemId))
    } catch (err) {
      alert("Lỗi khi xóa danh mục minh chứng")
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group/crit">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="shrink-0 w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] flex items-center justify-center text-xs font-bold">{idx + 1}</span>
            <h4 className="font-bold text-[var(--foreground)]">{crit.name}</h4>
          </div>
          {crit.description && <p className="text-sm text-slate-500 pl-8 mt-1">{crit.description}</p>}
        </div>
        
        <div className="flex gap-2 opacity-0 group-hover/crit:opacity-100 transition-opacity ml-4">
          <button onClick={() => openEditCrit(crit)} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded hover:bg-slate-100 transition-colors">
            <Edit size={16} />
          </button>
          <button onClick={() => handleDeleteCrit(crit.id, crit.standardId)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="pl-8 flex flex-col mt-3">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 self-start text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
        >
          {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
          Danh mục Minh chứng yêu cầu ({items.length})
        </button>

        {isExpanded && (
          <div className="mt-2 pl-3 border-l-2 border-indigo-100 dark:border-indigo-900/50 space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg group/item">
                <div className="flex flex-col flex-1 pl-1 border-l-2 border-amber-400">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-2">{item.name}</div>
                  {item.description && <div className="text-xs text-slate-500 ml-2 mt-0.5">{item.description}</div>}
                </div>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="text-xs font-medium text-slate-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity self-end sm:self-auto min-w-max px-2 py-1 rounded hover:bg-red-50"
                >
                  Xóa
                </button>
              </div>
            ))}

            {showAddForm ? (
              <form onSubmit={handleCreate} className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900 mt-2 flex flex-col gap-2">
                <input 
                  type="text" 
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="Tên danh mục minh chứng (vd: Quyết định, Báo cáo...)"
                  className="w-full px-3 py-2 text-sm rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                  required
                />
                <input 
                  type="text" 
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  placeholder="Ghi chú thêm (Không bắt buộc)"
                  className="w-full px-3 py-2 text-sm rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end gap-2 mt-1">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium">Hủy</button>
                  <button type="submit" disabled={loading} className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded font-medium disabled:opacity-70 flex items-center gap-1 hover:bg-indigo-700">
                    {loading && <Loader2 size={12} className="animate-spin" />} Lưu
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 mt-2 pt-1 pb-1 px-2 rounded-md hover:bg-indigo-50 transition-colors w-fit"
              >
                <Plus size={16} /> Thêm Danh mục Minh chứng
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClientCriteriaList({ initialStandards }: { initialStandards: Standard[] }) {
  const [standards, setStandards] = useState(initialStandards)
  const [expandedStds, setExpandedStds] = useState<Record<string, boolean>>({})
  
  // Modals state
  const [isStdModalOpen, setIsStdModalOpen] = useState(false)
  const [isCritModalOpen, setIsCritModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Edit state
  const [editingStdId, setEditingStdId] = useState<string | null>(null)
  const [editingCritId, setEditingCritId] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())
  const [parentStdId, setParentStdId] = useState("")

  const toggleExpand = (id: string) => {
    setExpandedStds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // --- STANDARD HANDLERS ---
  const openCreateStd = () => {
    setEditingStdId(null)
    setName("")
    setDescription("")
    setIsStdModalOpen(true)
  }

  const openEditStd = (std: Standard, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingStdId(std.id)
    setName(std.name)
    setDescription(std.description || "")
    setYear(std.year)
    setIsStdModalOpen(true)
  }

  const handleSubmitStandard = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingStdId) {
        await updateStandard(editingStdId, { name, description, year })
        setStandards(standards.map(s => s.id === editingStdId ? { ...s, name, description, year } : s))
      } else {
        const newStd = await createStandard({ name, description, year })
        setStandards([{...newStd, criteria: [], _count: { criteria: 0 }}, ...standards])
      }
      setIsStdModalOpen(false)
    } catch (err) {
      alert("Đã xảy ra lỗi khi tạo/sửa tiêu chuẩn")
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

  // --- CRITERION HANDLERS ---
  const openCreateCrit = () => {
    setEditingCritId(null)
    setName("")
    setDescription("")
    setParentStdId(standards[0]?.id || "")
    setIsCritModalOpen(true)
  }

  const openEditCrit = (crit: Criterion) => {
    setEditingCritId(crit.id)
    setName(crit.name)
    setDescription(crit.description || "")
    setParentStdId(crit.standardId)
    setIsCritModalOpen(true)
  }

  const handleSubmitCriterion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parentStdId) return alert("Vui lòng chọn tiêu chuẩn cha!")
    setLoading(true)
    try {
      if (editingCritId) {
        await updateCriterion(editingCritId, { name, description })
        setStandards(standards.map(std => {
          if (std.id === parentStdId) {
            return {
              ...std,
              criteria: std.criteria.map(c => c.id === editingCritId ? { ...c, name, description } : c)
            }
          }
          return std
        }))
      } else {
        const newCrit = await createCriterion({ name, description, standardId: parentStdId })
        setStandards(standards.map(std => {
          if (std.id === parentStdId) {
            return { 
              ...std, 
              criteria: [...std.criteria, { ...newCrit, items: [] } as Criterion],
              _count: { criteria: std._count.criteria + 1 }
            }
          }
          return std
        }))
        setExpandedStds(prev => ({ ...prev, [parentStdId]: true }))
      }
      setIsCritModalOpen(false)
    } catch (err) {
      alert("Đã xảy ra lỗi khi tạo/sửa tiêu chí")
    } finally {
      setLoading(false)
    }
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
          onClick={openCreateStd}
          className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Folder size={18} className="text-amber-500" />
          Thêm Tiêu chuẩn
        </button>
        <button 
          onClick={openCreateCrit}
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
                  <button onClick={(e) => openEditStd(std, e)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Edit size={18} />
                  </button>
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
                        <CriterionRow 
                           key={crit.id} 
                           crit={crit} 
                           idx={idx} 
                           openEditCrit={openEditCrit} 
                           handleDeleteCrit={handleDeleteCrit} 
                        />
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
              <h3 className="text-lg font-bold flex items-center gap-2"><Folder size={20} className="text-amber-500"/> {editingStdId ? "Cập nhật Tiêu chuẩn" : "Thêm Tiêu chuẩn"}</h3>
            </div>
            <form onSubmit={handleSubmitStandard} className="p-6 space-y-4">
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
              <h3 className="text-lg font-bold flex items-center gap-2"><ListTodo size={20} className="text-indigo-500"/> {editingCritId ? "Cập nhật Tiêu chí" : "Thêm Tiêu chí"}</h3>
            </div>
            <form onSubmit={handleSubmitCriterion} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Tiêu chuẩn trực thuộc</label>
                <select required disabled={!!editingCritId} value={parentStdId} onChange={e => setParentStdId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm font-medium disabled:opacity-50">
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
