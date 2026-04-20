"use client"

import { useState } from "react"
import { createEvidence, updateEvidence, uploadFileAction } from "@/actions/evidence"
import { Plus, FileText, Loader2, CheckCircle2, Clock, AlertCircle, Edit2 } from "lucide-react"

type Evidence = {
  id: string
  content: string | null
  fileUrl: string | null
  status: string
  rejectReason: string | null
  createdAt: Date
  criterion: {
    name: string
    standard: { name: string; year: number }
  }
}

type CriterionDropdown = {
  id: string
  name: string
  standard: { name: string; year: number }
}

export default function ClientEvidenceList({ initialEvidences, criteriaList }: { initialEvidences: any[], criteriaList: CriterionDropdown[] }) {
  const [evidences, setEvidences] = useState<Evidence[]>(initialEvidences)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [criterionId, setCriterionId] = useState(criteriaList[0]?.id || "")
  const [content, setContent] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  const [searchCriterion, setSearchCriterion] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  
  const filteredCriteria = criteriaList.filter(c => 
    `${c.standard.year} - ${c.standard.name}: ${c.name}`.toLowerCase().includes(searchCriterion.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!criterionId) return alert("Vui lòng chọn tiêu chí!")
    setLoading(true)
    try {
      let finalFileUrl = fileUrl

      if (selectedFiles.length > 0) {
        const uploadedUrls: string[] = []

        for (const file of selectedFiles) {
          const formData = new FormData()
          formData.append("file", file)

          const { url, error } = await uploadFileAction(formData)

          if (error) {
            throw new Error(`Lỗi tải tệp ${file.name}: ${error}`)
          }
          if (url) {
             uploadedUrls.push(url)
          }
        }
        
        if (finalFileUrl && finalFileUrl.trim() !== '') {
          finalFileUrl = finalFileUrl + (uploadedUrls.length > 0 ? ", " + uploadedUrls.join(", ") : "")
        } else {
          finalFileUrl = uploadedUrls.join(", ")
        }
      }
      
      if (editingId) {
        await updateEvidence(editingId, { content, fileUrl: finalFileUrl })
      } else {
        await createEvidence({ criterionId, content, fileUrl: finalFileUrl })
      }
      window.location.reload()
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi Submit minh chứng")
      setLoading(false)
    }
  }

  const openEditModal = (ev: Evidence) => {
    setEditingId(ev.id)
    setCriterionId(ev.criterion.name) // Not editable, just display
    setSearchCriterion(ev.criterion.name)
    setContent(ev.content || "")
    setFileUrl(ev.fileUrl || "")
    setSelectedFiles([])
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingId(null)
    setCriterionId("")
    setSearchCriterion("")
    setContent("")
    setFileUrl("")
    setSelectedFiles([])
    setIsModalOpen(true)
  }

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "APPROVED": return <CheckCircle2 size={16} className="text-emerald-500" />
      case "REJECTED": return <AlertCircle size={16} className="text-red-500" />
      default: return <Clock size={16} className="text-amber-500" />
    }
  }

  const statusColors: Record<string, string> = {
    APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    REVIEWING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  }

  const statusLabels: Record<string, string> = {
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    PENDING: "Chờ duyệt",
    REVIEWING: "Đang xem xét"
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button 
          onClick={openCreateModal}
          className="bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-colors shadow-md shadow-indigo-500/20"
        >
          <Plus size={18} />
          Báo cáo Minh chứng
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {evidences.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Chưa có Minh chứng</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">Bạn chưa tải lên hay báo cáo minh chứng nào.</p>
          </div>
        ) : (
          evidences.map((ev) => (
            <div key={ev.id} className="glass rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ev.criterion.standard.name} ({ev.criterion.standard.year})</span>
                  </div>
                  <h3 className="font-bold text-lg text-[var(--foreground)]">{ev.criterion.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    {ev.content || "Không có nội dung mô tả"}
                  </p>
                  {ev.fileUrl && (
                    <div className="mt-3 flex flex-col gap-1">
                      {ev.fileUrl.split(", ").map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" className="inline-flex w-fit items-center gap-2 text-sm text-[var(--primary)] font-medium hover:underline">
                          <FileText size={16} /> Xem tệp đính kèm {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  {ev.status === "REJECTED" && ev.rejectReason && (
                    <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs mb-1">
                        <AlertCircle size={14} /> Lý do từ chối:
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">{ev.rejectReason}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusColors[ev.status]}`}>
                    <StatusIcon status={ev.status} />
                    {statusLabels[ev.status] || ev.status}
                  </div>
                  {["PENDING", "REJECTED"].includes(ev.status) && (
                    <button onClick={() => openEditModal(ev)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors mt-2">
                      <Edit2 size={14} /> Sửa báo cáo
                    </button>
                  )}
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
              <h3 className="text-lg font-bold">{editingId ? 'Cập nhật Minh chứng' : 'Thêm Minh chứng mới'}</h3>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Chọn Tiêu chí</label>
                {editingId ? (
                   <input type="text" readOnly disabled value={criterionId} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-xl text-slate-500 line-clamp-1 truncate" />
                ) : (
                  <div className="relative">
                    <input 
                      type="text"
                      value={searchCriterion}
                      onChange={e => {
                        setSearchCriterion(e.target.value)
                        setShowDropdown(true)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                      placeholder="Gõ từ khóa để tra cứu tiêu chí..."
                      required={!criterionId}
                    />
                    {showDropdown && (
                      <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                        {filteredCriteria.length === 0 ? (
                          <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy tiêu chí phù hợp</div>
                        ) : (
                          filteredCriteria.map(c => (
                            <div 
                              key={c.id} 
                              onClick={() => {
                                setCriterionId(c.id)
                                setSearchCriterion(`${c.standard.year} - ${c.standard.name}: ${c.name}`)
                                setShowDropdown(false)
                              }}
                              className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${criterionId === c.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                            >
                              {c.standard.year} - {c.standard.name}: {c.name}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Nội dung giải trình / báo cáo</label>
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] min-h-[100px]"
                  placeholder="Nhập nội dung báo cáo minh chứng..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Đính kèm Thêm Tệp tin</label>
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="file" 
                      multiple
                      onChange={e => {
                        const files = Array.from(e.target.files || [])
                        setSelectedFiles(files) // Hoặc [...prev, ...files] nếu muốn cộng dồn từng lần chọn
                      }}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                    />
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Đã chọn {selectedFiles.length} tệp mới để tải lên.
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <hr className="flex-1 border-slate-200 dark:border-slate-700" /> DANH SÁCH FILE ĐÃ CÓ / DÁN LINK MỚI <hr className="flex-1 border-slate-200 dark:border-slate-700" />
                  </div>
                  
                  <textarea 
                    value={fileUrl}
                    onChange={e => setFileUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm leading-relaxed"
                    placeholder="https://drive.google.com/..."
                    rows={3}
                  />
                  <div className="text-xs text-slate-500">
                    * Các link cách nhau bởi dấu phẩy (,). Bạn có thể xóa link cũ hoặc dán thêm link mới.
                  </div>
                </div>
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
                  Nộp Minh chứng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
