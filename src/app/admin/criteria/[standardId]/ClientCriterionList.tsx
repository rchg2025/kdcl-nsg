"use client"

import { useState } from "react"
import { createCriterion, deleteCriterion, createEvidenceItem, deleteEvidenceItem } from "@/actions/criterion"
import { Plus, ListTodo, Trash2, Edit, Loader2, ChevronDown, ChevronRight, FileCheck } from "lucide-react"

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
  items?: EvidenceItem[]
}

function CriterionCard({ crit, index, total, handleDelete }: { crit: Criterion, index: number, total: number, handleDelete: (id: string) => void }) {
  const [items, setItems] = useState<EvidenceItem[]>(crit.items || [])
  const [isExpanded, setIsExpanded] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [newItemDesc, setNewItemDesc] = useState("")
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return
    setIsAddingItem(true)
    try {
      const added = await createEvidenceItem({ name: newItemName, description: newItemDesc, criterionId: crit.id })
      setItems([...items, added])
      setNewItemName("")
      setNewItemDesc("")
      setShowAddForm(false)
    } catch(err) {
      alert("Lỗi tạo danh mục minh chứng")
    } finally {
      setIsAddingItem(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Xóa danh mục minh chứng này? Các hồ sơ đã nộp dưới danh mục này sẽ mất phân loại.")) return
    try {
      await deleteEvidenceItem(id)
      setItems(items.filter((i: any) => i.id !== id))
    } catch(err) {
      alert("Lỗi khi xóa danh mục minh chứng")
    }
  }

  return (
    <div className="glass rounded-xl p-5 border border-slate-200 dark:border-slate-800 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="min-w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-bold mt-1 shadow-sm border border-slate-200 dark:border-slate-700">
            {total - index}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-[var(--foreground)]">{crit.name}</h3>
            {crit.description && <p className="text-sm text-slate-500 mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">{crit.description}</p>}
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
              >
                {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                Danh mục Minh chứng yêu cầu ({items.length})
              </button>
              
              {isExpanded && (
                <div className="mt-4 pl-4 ml-2 border-l-2 border-slate-100 dark:border-slate-800 space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group/item hover:border-indigo-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <FileCheck size={16} className="text-emerald-500 mt-0.5 min-w-max" />
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                          {item.description && <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-xs text-slate-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap self-end sm:self-auto"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}

                  {showAddForm ? (
                    <form onSubmit={handleCreateItem} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 mt-2">
                       <input 
                         type="text" 
                         value={newItemName}
                         onChange={e => setNewItemName(e.target.value)}
                         placeholder="Tên danh mục minh chứng (vd: Quyết định thành lập)"
                         className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mb-2 outline-none focus:border-indigo-500"
                         required
                       />
                       <input 
                         type="text" 
                         value={newItemDesc}
                         onChange={e => setNewItemDesc(e.target.value)}
                         placeholder="Ghi chú (Không bắt buộc)"
                         className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mb-2 outline-none focus:border-indigo-500"
                       />
                       <div className="flex items-center gap-2 justify-end">
                         <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">Hủy</button>
                         <button type="submit" disabled={isAddingItem} className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1 disabled:opacity-70">
                           {isAddingItem && <Loader2 size={12} className="animate-spin"/>} Thêm
                         </button>
                       </div>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-800 mt-2 p-2"
                    >
                      <Plus size={16} /> Thêm Danh mục
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2 min-w-max ml-4">
          <button className="p-2 text-slate-400 hover:text-[var(--primary)] hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(crit.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientCriterionList({ initialCriteria, standardId }: { initialCriteria: Criterion[], standardId: string }) {
  const [criteria, setCriteria] = useState(initialCriteria)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newCrit = await createCriterion({ name, description, standardId })
      setCriteria([{...newCrit, items: []}, ...criteria])
      setIsModalOpen(false)
      setName("")
      setDescription("")
    } catch (err) {
      alert("Đã xảy ra lỗi khi tạo tiêu chuẩn")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tiêu chuẩn này? Toàn bộ minh chứng sẽ mất!")) return
    try {
      await deleteCriterion(id, standardId)
      setCriteria(criteria.filter(c => c.id !== id))
    } catch (err) {
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
        {criteria.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <ListTodo size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Chưa có Tiêu chuẩn nào</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">Hãy thêm nội dung các tiêu chuẩn cần đánh giá vào đây.</p>
          </div>
        ) : (
          criteria.map((crit, index) => (
            <CriterionCard 
              key={crit.id} 
              crit={crit} 
              index={index} 
              total={criteria.length} 
              handleDelete={handleDelete} 
            />
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold">Thêm Tiêu chuẩn mới</h3>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Tên Tiêu chuẩn</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                  placeholder="Vd: 1.1 Khảo sát tầm nhìn"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Thông tin chung (Mô tả)</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] min-h-[120px]"
                  placeholder="Diễn giải chung cho tiêu chuẩn này..."
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
