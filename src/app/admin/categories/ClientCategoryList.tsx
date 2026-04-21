"use client"

import { useState } from "react"
import { createDepartment, updateDepartment, deleteDepartment, createPosition, updatePosition, deletePosition, createProgram, updateProgram, deleteProgram } from "@/actions/category"
import { Plus, Trash2, Building2, Briefcase, Loader2, Edit2, X, Check, BookOpen } from "lucide-react"

type Department = { id: string; name: string }
type Position = { id: string; name: string }
type Program = { id: string; name: string; departmentId: string; department?: Department }

export default function ClientCategoryList({ initialDepartments, initialPositions, initialPrograms }: { initialDepartments: Department[], initialPositions: Position[], initialPrograms: Program[] }) {
  const [departments, setDepartments] = useState(initialDepartments)
  const [positions, setPositions] = useState(initialPositions)
  const [programs, setPrograms] = useState(initialPrograms)

  const [loading, setLoading] = useState(false)
  const [deptName, setDeptName] = useState("")
  const [posName, setPosName] = useState("")
  const [progName, setProgName] = useState("")
  const [progDeptId, setProgDeptId] = useState("")
  
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null)
  const [editDeptName, setEditDeptName] = useState("")
  const [editingPosId, setEditingPosId] = useState<string | null>(null)
  const [editPosName, setEditPosName] = useState("")
  const [editingProgId, setEditingProgId] = useState<string | null>(null)
  const [editProgName, setEditProgName] = useState("")
  const [editProgDeptId, setEditProgDeptId] = useState("")

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newD = await createDepartment({ name: deptName })
      setDepartments([...departments, newD])
      setDeptName("")
    } catch { alert("Lỗi khi thêm Đơn vị") }
    finally { setLoading(false) }
  }

  const handleUpdateDept = async (id: string) => {
    if (!editDeptName.trim()) return
    setLoading(true)
    try {
      const updatedD = await updateDepartment(id, { name: editDeptName })
      setDepartments(departments.map(d => d.id === id ? updatedD : d))
      setEditingDeptId(null)
    } catch { alert("Lỗi khi cập nhật Đơn vị") }
    finally { setLoading(false) }
  }

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Chắc chắn xóa Đơn vị này chứ? Toàn bộ thành viên sẽ trống tên đơn vị.")) return
    try {
      await deleteDepartment(id)
      setDepartments(departments.filter(d => d.id !== id))
    } catch {}
  }

  const handleAddPos = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newP = await createPosition({ name: posName })
      setPositions([...positions, newP])
      setPosName("")
    } catch { alert("Lỗi khi thêm Chức vụ") }
    finally { setLoading(false) }
  }

  const handleUpdatePos = async (id: string) => {
    if (!editPosName.trim()) return
    setLoading(true)
    try {
      const updatedP = await updatePosition(id, { name: editPosName })
      setPositions(positions.map(p => p.id === id ? updatedP : p))
      setEditingPosId(null)
    } catch { alert("Lỗi khi cập nhật Chức vụ") }
    finally { setLoading(false) }
  }

  const handleDeletePos = async (id: string) => {
    if (!confirm("Chắc chắn xóa Chức vụ này chứ?")) return
    try {
      await deletePosition(id)
      setPositions(positions.filter(p => p.id !== id))
    } catch {}
  }

  const handleAddProg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!progDeptId) return alert("Vui lòng chọn Khoa/Đơn vị quản lý ngành")
    setLoading(true)
    try {
      const newPr = await createProgram({ name: progName, departmentId: progDeptId })
      setPrograms([...programs, newPr])
      setProgName("")
    } catch { alert("Lỗi khi thêm Ngành") }
    finally { setLoading(false) }
  }

  const handleUpdateProg = async (id: string) => {
    if (!editProgName.trim() || !editProgDeptId) return
    setLoading(true)
    try {
      const updatedPr = await updateProgram(id, { name: editProgName, departmentId: editProgDeptId })
      setPrograms(programs.map(p => p.id === id ? updatedPr : p))
      setEditingProgId(null)
    } catch { alert("Lỗi khi cập nhật Ngành") }
    finally { setLoading(false) }
  }

  const handleDeleteProg = async (id: string) => {
    if (!confirm("Chắc chắn xóa Ngành này chứ?")) return
    try {
      await deleteProgram(id)
      setPrograms(programs.filter(p => p.id !== id))
    } catch {}
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* CỘT ĐƠN VỊ */}
      <div className="glass rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Building2 className="text-blue-500" size={20} />
          Danh mục Đơn vị
        </h3>
        
        <form onSubmit={handleAddDept} className="flex gap-2 mb-6">
          <input required type="text" value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="Nhập tên Khoa / Phòng ban..." className="flex-1 px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-blue-500 text-sm" />
          <button disabled={loading} type="submit" className="bg-blue-500 text-white p-2.5 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50">
            {loading && deptName ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          </button>
        </form>

        <div className="space-y-2">
          {departments.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-4">Chưa có đơn vị nào.</p>
          ) : (
            departments.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:border-blue-200 border border-slate-100 dark:border-slate-800 transition-colors">
                {editingDeptId === d.id ? (
                  <div className="flex-1 flex gap-2 mr-2">
                     <input autoFocus type="text" value={editDeptName} onChange={e => setEditDeptName(e.target.value)} className="flex-1 px-3 py-1.5 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded outline-none focus:border-blue-500 text-sm" />
                     <button disabled={loading} onClick={() => handleUpdateDept(d.id)} className="bg-blue-500 text-white p-1.5 rounded hover:bg-blue-600">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                     </button>
                     <button onClick={() => setEditingDeptId(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded hover:bg-slate-300">
                        <X size={16} />
                     </button>
                  </div>
                ) : (
                  <>
                     <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{d.name}</span>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingDeptId(d.id); setEditDeptName(d.name) }} className="text-slate-400 hover:text-blue-500 p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteDept(d.id)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* CỘT CHỨC VỤ */}
      <div className="glass rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Briefcase className="text-amber-500" size={20} />
          Danh mục Chức vụ
        </h3>
        
        <form onSubmit={handleAddPos} className="flex gap-2 mb-6">
          <input required type="text" value={posName} onChange={e => setPosName(e.target.value)} placeholder="Nhập tên chức danh..." className="flex-1 px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-amber-500 text-sm" />
          <button disabled={loading} type="submit" className="bg-amber-500 text-white p-2.5 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50">
            {loading && posName ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          </button>
        </form>

        <div className="space-y-2">
          {positions.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-4">Chưa có chức vụ nào.</p>
          ) : (
            positions.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:border-amber-200 border border-slate-100 dark:border-slate-800 transition-colors">
                {editingPosId === p.id ? (
                  <div className="flex-1 flex gap-2 mr-2">
                     <input autoFocus type="text" value={editPosName} onChange={e => setEditPosName(e.target.value)} className="flex-1 px-3 py-1.5 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded outline-none focus:border-amber-500 text-sm" />
                     <button disabled={loading} onClick={() => handleUpdatePos(p.id)} className="bg-amber-500 text-white p-1.5 rounded hover:bg-amber-600">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                     </button>
                     <button onClick={() => setEditingPosId(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded hover:bg-slate-300">
                        <X size={16} />
                     </button>
                  </div>
                ) : (
                  <>
                     <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{p.name}</span>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingPosId(p.id); setEditPosName(p.name) }} className="text-slate-400 hover:text-amber-500 p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeletePos(p.id)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {/* CỘT NGÀNH */}
      <div className="glass rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <BookOpen className="text-emerald-500" size={20} />
          Danh mục Ngành
        </h3>
        
        <form onSubmit={handleAddProg} className="flex flex-col gap-2 mb-6">
          <div className="flex gap-2">
            <select required value={progDeptId} onChange={e => setProgDeptId(e.target.value)} className="w-1/3 min-w-[100px] px-3 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-emerald-500 text-sm">
              <option value="">-- Khoa/Đơn vị --</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input required type="text" value={progName} onChange={e => setProgName(e.target.value)} placeholder="Nhập tên ngành..." className="flex-1 px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-emerald-500 text-sm" />
            <button disabled={loading} type="submit" className="bg-emerald-500 text-white p-2.5 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {loading && progName ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {programs.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-4">Chưa có ngành nào.</p>
          ) : (
            programs.map(p => (
              <div key={p.id} className="flex flex-col items-start p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:border-emerald-200 border border-slate-100 dark:border-slate-800 transition-colors gap-2">
                {editingProgId === p.id ? (
                  <div className="w-full flex gap-2">
                     <select required value={editProgDeptId} onChange={e => setEditProgDeptId(e.target.value)} className="w-1/3 min-w-[80px] px-2 py-1.5 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded outline-none focus:border-emerald-500 text-xs">
                        <option value="">-- Đơn vị --</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                     </select>
                     <input autoFocus type="text" value={editProgName} onChange={e => setEditProgName(e.target.value)} className="flex-1 px-3 py-1.5 border dark:border-slate-700 bg-white dark:bg-slate-900 rounded outline-none focus:border-emerald-500 text-sm w-full" />
                     <button disabled={loading} onClick={() => handleUpdateProg(p.id)} className="bg-emerald-500 text-white p-1.5 rounded hover:bg-emerald-600 shrink-0">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                     </button>
                     <button onClick={() => setEditingProgId(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded hover:bg-slate-300 shrink-0">
                        <X size={16} />
                     </button>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{p.name}</span>
                        <span className="text-xs text-slate-400 mt-0.5">{p.department?.name || 'Vô danh'}</span>
                     </div>
                     <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingProgId(p.id); setEditProgName(p.name); setEditProgDeptId(p.departmentId) }} className="text-slate-400 hover:text-emerald-500 p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteProg(p.id)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
