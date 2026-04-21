"use client"

import { useState } from "react"
import { createEvidence, updateEvidence } from "@/actions/evidence"
import { Plus, FileText, Loader2, CheckCircle2, Clock, AlertCircle, Edit2, UserCircle } from "lucide-react"
import FileAttachments from "@/components/FileAttachments"

type EvidenceItem = {
  id: string
  name: string
}

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
  evidenceItem?: { name: string } | null
  collaborator?: { name: string | null } | null
  reviewer?: { name: string | null; email: string | null } | null
  lastUpdater?: { name: string | null; email: string | null } | null
  reviewedAt?: string | Date | null
  updatedAt?: string | Date | null
}

type FileLink = { name: string, url: string }

type CriterionDropdown = {
  id: string
  name: string
  standard: { name: string; year: number; type: string; programId: string | null; program?: { id: string; name: string } | null }
  items: EvidenceItem[]
}

export default function ClientEvidenceList({ initialEvidences, criteriaList, programs=[] }: { initialEvidences: any[], criteriaList: CriterionDropdown[], programs?: any[] }) {
  const [evidences, setEvidences] = useState<Evidence[]>(initialEvidences)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [criterionId, setCriterionId] = useState(criteriaList[0]?.id || "")
  const [evidenceItemId, setEvidenceItemId] = useState("")
  const [content, setContent] = useState("")
  const [existingFiles, setExistingFiles] = useState<FileLink[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [newLinkName, setNewLinkName] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  
  const [searchCriterion, setSearchCriterion] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  
  const [searchItem, setSearchItem] = useState("")
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  
  const [accreditationType, setAccreditationType] = useState("INSTITUTIONAL")
  const [selectedProgramId, setSelectedProgramId] = useState("")
  
  const filteredCriteria = criteriaList.filter(c => {
    let matchType = false
    if (accreditationType === "INSTITUTIONAL") {
      matchType = c.standard.type === "INSTITUTIONAL" || !c.standard.type // fallback for old records
    } else {
      matchType = c.standard.type === "PROGRAM" && c.standard.programId === selectedProgramId
    }
    return matchType && `${c.standard.year} - ${c.standard.name}: ${c.name}`.toLowerCase().includes(searchCriterion.toLowerCase())
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!criterionId) return alert("Vui lòng chọn tiêu chuẩn!")
    setLoading(true)
    try {
      const finalFiles = [...existingFiles]
      if (newLinkUrl.trim() !== "") {
        finalFiles.push({ name: newLinkName.trim() || "Xem liên kết", url: newLinkUrl.trim() })
      }
      let finalFileUrl = JSON.stringify(finalFiles)

      if (selectedFiles.length > 0) {
        const uploadedUrls: FileLink[] = []

        for (const file of selectedFiles) {
          // 1. Khởi tạo luồng tải lên
          const initRes = await fetch("/api/upload-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: file.name, mimeType: file.type || "application/octet-stream" })
          })
          
          if (!initRes.ok) throw new Error(`Không tạo được luồng tải lên cho ${file.name}`)
          const { uploadUrl } = await initRes.json()

          // 2. Upload file trực tiếp lên Drive qua uploadUrl
          const putRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream"
            },
            body: file
          })

          if (!putRes.ok) throw new Error(`Lỗi khi đẩy tệp ${file.name} lên Google Drive`)

          const fileData = await putRes.json()

          // 3. Xin quyền public & lấy link webView
          const permRes = await fetch("/api/drive-permissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId: fileData.id })
          })

          if (!permRes.ok) throw new Error(`Không lấy được link cho tệp ${file.name}`)
          
          const { url } = await permRes.json()
          if (url) uploadedUrls.push({ name: file.name, url })
        }
        
        finalFileUrl = JSON.stringify([...finalFiles, ...uploadedUrls])
      }
      
      if (editingId) {
        await updateEvidence(editingId, { content, fileUrl: finalFileUrl, evidenceItemId: evidenceItemId || undefined })
      } else {
        await createEvidence({ criterionId, content, fileUrl: finalFileUrl, evidenceItemId: evidenceItemId || undefined })
      }
      window.location.reload()
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi Submit minh chứng")
      setLoading(false)
    }
  }



  const parseFilesForForm = (fileStr: string | null): FileLink[] => {
    if (!fileStr) return []
    try {
      const parsed = JSON.parse(fileStr)
      if (Array.isArray(parsed)) return parsed
      return []
    } catch {
      return fileStr.split(", ").filter(url => url.trim().length > 0).map((url, i) => ({ name: `Tài liệu đính kèm ${i + 1}`, url }))
    }
  }

  const openEditModal = (ev: Evidence) => {
    setEditingId(ev.id)
    setCriterionId(ev.criterion.name) // Not editable, just display
    setEvidenceItemId("") // Prevent selection change on edit for simplicity
    setSearchCriterion(ev.criterion.name)
    setSearchItem("")
    setContent(ev.content || "")
    setExistingFiles(parseFilesForForm(ev.fileUrl))
    setSelectedFiles([])
    setNewLinkName("")
    setNewLinkUrl("")
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingId(null)
    setCriterionId("")
    setEvidenceItemId("")
    setSearchCriterion("")
    setSearchItem("")
    setContent("")
    setExistingFiles([])
    setSelectedFiles([])
    setNewLinkName("")
    setNewLinkUrl("")
    setAccreditationType("INSTITUTIONAL")
    setSelectedProgramId("")
    setIsModalOpen(true)
  }
  
  const selectedCriterionData = criteriaList.find(c => c.id === criterionId)
  const availableItems = selectedCriterionData?.items || []
  const filteredItems = availableItems.filter(i => i.name.toLowerCase().includes(searchItem.toLowerCase()))

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
    REJECTED: "Không đạt",
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
            <div key={ev.id} id={`ev-${ev.id}`} className="glass rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ev.criterion.standard.name} ({ev.criterion.standard.year})</span>
                  </div>
                  <h3 className="font-bold text-lg text-[var(--foreground)]">{ev.criterion.name}</h3>
                  {ev.evidenceItem && (
                    <div className="inline-block mt-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded text-xs font-semibold">
                      Phân loại: {ev.evidenceItem.name}
                    </div>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    {ev.content || "Không có nội dung mô tả"}
                  </p>
                  <FileAttachments fileStr={ev.fileUrl} />
                  {ev.status === "REJECTED" && ev.rejectReason && (
                    <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs mb-1">
                        <AlertCircle size={14} /> Lý do không đạt:
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">{ev.rejectReason}</p>
                    </div>
                  )}
                  
                  {/* Tracking Info */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center gap-1.5">
                      <UserCircle size={13} className="text-slate-400" />
                      <span>Thực hiện bởi: <strong className="text-[var(--foreground)]">{ev.collaborator?.name}</strong></span>
                    </div>
                    {ev.reviewer && ev.reviewedAt && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span>Duyệt bởi <strong>{ev.reviewer.name}</strong> lúc {new Date(ev.reviewedAt).toLocaleString("vi-VN")}</span>
                      </div>
                    )}
                    {ev.lastUpdater && ev.updatedAt && (
                      <div className="flex items-center gap-1.5">
                        <Edit2 size={13} className="text-blue-500" />
                        <span>Cập nhật bởi <strong>{ev.lastUpdater.name}</strong> lúc {new Date(ev.updatedAt).toLocaleString("vi-VN")}</span>
                      </div>
                    )}
                  </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Loại Kiểm định</label>
                  <select disabled={!!editingId} value={accreditationType} onChange={e => {
                    setAccreditationType(e.target.value)
                    setCriterionId("")
                    setSearchCriterion("")
                  }} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm focus:border-[var(--primary)]">
                    <option value="INSTITUTIONAL">Cấp Trường</option>
                    <option value="PROGRAM">Cấp Ngành</option>
                  </select>
                </div>
                {accreditationType === "PROGRAM" && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Chọn Ngành học</label>
                    <select disabled={!!editingId} value={selectedProgramId} onChange={e => {
                      setSelectedProgramId(e.target.value)
                      setCriterionId("")
                      setSearchCriterion("")
                    }} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm focus:border-[var(--primary)]">
                      <option value="">-- Chọn ngành --</option>
                      {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Chọn Tiêu chuẩn</label>
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
                      placeholder="Gõ từ khóa để tra cứu tiêu chuẩn..."
                      required={!criterionId}
                    />
                    {showDropdown && (
                      <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                        {filteredCriteria.length === 0 ? (
                          <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy tiêu chuẩn phù hợp</div>
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

              {availableItems.length > 0 && !editingId && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Phân loại (Danh mục Minh chứng)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={searchItem}
                      onChange={e => {
                        setSearchItem(e.target.value)
                        setShowItemDropdown(true)
                      }}
                      onFocus={() => setShowItemDropdown(true)}
                      onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                      placeholder="Gõ từ khóa để tìm phân loại/danh mục..."
                      required={!evidenceItemId}
                    />
                    {showItemDropdown && (
                      <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                        {filteredItems.length === 0 ? (
                          <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy danh mục phù hợp</div>
                        ) : (
                          filteredItems.map(item => (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                setEvidenceItemId(item.id)
                                setSearchItem(item.name)
                                setShowItemDropdown(false)
                              }}
                              className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${evidenceItemId === item.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                            >
                              {item.name}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 pl-1 italic">Vui lòng chọn minh chứng bạn đang muốn nộp theo yêu cầu của tiêu chuẩn.</p>
                </div>
              )}

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
                    <hr className="flex-1 border-slate-200 dark:border-slate-700" /> HOẶC DÁN LINK MỚI <hr className="flex-1 border-slate-200 dark:border-slate-700" />
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Tên liên kết (tùy chọn)" 
                      value={newLinkName} 
                      onChange={e => setNewLinkName(e.target.value)} 
                      className="w-1/3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] text-sm" 
                    />
                    <input 
                      type="url" 
                      placeholder="https://..." 
                      value={newLinkUrl} 
                      onChange={e => setNewLinkUrl(e.target.value)} 
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] text-sm" 
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        if (newLinkUrl) {
                          setExistingFiles(prev => [...prev, { name: newLinkName || "Xem liên kết", url: newLinkUrl }])
                          setNewLinkName("")
                          setNewLinkUrl("")
                        }
                      }}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-xl font-medium text-sm hover:bg-indigo-200 transition-colors shrink-0"
                    >
                      Thêm Link
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-2">
                    <hr className="flex-1 border-slate-200 dark:border-slate-700" /> DANH SÁCH ĐÃ ĐÍNH KÈM <hr className="flex-1 border-slate-200 dark:border-slate-700" />
                  </div>
                  
                  {existingFiles.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {existingFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl">
                          <a href={file.url} target="_blank" className="text-sm font-medium text-[var(--primary)] hover:underline truncate mr-4 flex-1">
                            {file.name}
                          </a>
                          <button
                            type="button"
                            onClick={() => setExistingFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Xóa tệp"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-700">
                      Chưa có tệp nào
                    </div>
                  )}
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
