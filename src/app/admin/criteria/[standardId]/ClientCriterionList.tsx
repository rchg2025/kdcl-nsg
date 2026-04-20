"use client"

import { useState } from "react"
import { createCriterion, deleteCriterion } from "@/actions/criterion"
import { Plus, ListTodo, Trash2, Edit, Loader2 } from "lucide-react"

type Criterion = {
  id: string
  name: string
  description: string | null
  standardId: string
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
      setCriteria([newCrit, ...criteria])
      setIsModalOpen(false)
      setName("")
      setDescription("")
    } catch (err) {
      alert("Đã xảy ra lỗi khi tạo tiêu chí")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tiêu chí này? Toàn bộ minh chứng sẽ mất!")) return
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
          Thêm Tiêu chí
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {criteria.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <ListTodo size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Chưa có Tiêu chí nào</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">Hãy thêm nội dung các tiêu chí cần đánh giá vào đây.</p>
          </div>
        ) : (
          criteria.map((crit, index) => (
            <div key={crit.id} className="glass rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="min-w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-bold mt-1 shadow-sm border border-slate-200 dark:border-slate-700">
                    {criteria.length - index}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[var(--foreground)]">{crit.name}</h3>
                    {crit.description && <p className="text-sm text-slate-500 mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">{crit.description}</p>}
                  </div>
                </div>
                
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2 min-w-max">
                  <button className="p-2 text-slate-400 hover:text-[var(--primary)] hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(crit.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors">
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold">Thêm Tiêu chí mới</h3>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Tên Tiêu chí</label>
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
                <label className="block text-sm font-semibold mb-2">Yêu cầu minh chứng (Mô tả)</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] min-h-[120px]"
                  placeholder="Diễn giải tiêu chí này yêu cầu những minh chứng gì..."
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
                  Lưu Tiêu chí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
