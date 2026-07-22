"use client"
import { smartSearch } from "@/lib/utils";

import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { createEvidence, updateEvidence, getApprovedEvidenceForSync, getAllCriteriaForDropdown } from "@/actions/evidence"
import { Plus, FileText, Loader2, CheckCircle2, Clock, AlertCircle, Edit2, UserCircle, Search, Filter, Link2 } from "lucide-react"
import FileAttachments from "@/components/FileAttachments"

type EvidenceItem = {
  id: string
  name: string
  sharedFromId?: string | null
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
    standard: { name: string; year: number; type?: string; programId?: string | null; program?: { name: string } | null }
  }
  evidenceItem?: { id: string; name: string; sharedFromId: string | null } | null
  collaborator?: { name: string | null } | null
  reviewer?: { name: string | null; email: string | null } | null
  lastUpdater?: { name: string | null; email: string | null } | null
  reviewedAt?: string | Date | null
  updatedAt?: string | Date | null
  sharedFrom?: {
    id: string
    content: string | null
    fileUrl: string | null
    criterion: { name: string, standard: { name: string, year: number } }
  } | null
  _count?: { sharedTo: number }
}

type FileLink = { name: string, url: string }

type CriterionDropdown = {
  id: string
  name: string
  standard: { name: string; year: number; type: string; programId: string | null; program?: { id: string; name: string } | null }
  items: EvidenceItem[]
}

export default function ClientEvidenceList({ initialEvidences, programs=[] }: { initialEvidences: any[], programs?: any[] }) {
  const [evidences, setEvidences] = useState<Evidence[]>(initialEvidences)
  const [criteriaList, setCriteriaList] = useState<CriterionDropdown[]>([])
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [criterionId, setCriterionId] = useState("")
  const [evidenceItemId, setEvidenceItemId] = useState("")
  const [content, setContent] = useState("")
  const [existingFiles, setExistingFiles] = useState<FileLink[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [newLinkName, setNewLinkName] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  
  const [syncedParentEvidenceId, setSyncedParentEvidenceId] = useState<string | null>(null)
  const [editingSharedFromId, setEditingSharedFromId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [viewingSharedEvidence, setViewingSharedEvidence] = useState<Evidence["sharedFrom"] | null>(null)
  
  
  
  const [selectedYear, setSelectedYear] = useState<number | "">("")
  const availableYears = Array.from(new Set(criteriaList.map(c => c.standard.year))).sort((a, b) => b - a)

  const loadCriteriaIfNeeded = async () => {
    if (criteriaList.length > 0) return criteriaList;
    setIsLoadingCriteria(true);
    try {
      const data = await getAllCriteriaForDropdown();
      setCriteriaList(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setIsLoadingCriteria(false);
    }
  };

  const [selectedStandardKey, setSelectedStandardKey] = useState("")
  const [searchStandardName, setSearchStandardName] = useState("")
  const [showStandardDropdown, setShowStandardDropdown] = useState(false)

  const [searchCriterionName, setSearchCriterionName] = useState("")
  const [showCriterionDropdown, setShowCriterionDropdown] = useState(false)
  
  const [searchItem, setSearchItem] = useState("")
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  
  const [accreditationType, setAccreditationType] = useState("INSTITUTIONAL")
  const [selectedProgramId, setSelectedProgramId] = useState("")
  
  const [searchProgramName, setSearchProgramName] = useState("")
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)
  
  // List filtering state
  const [searchEv, setSearchEv] = useState("")
  const [filterEvYear, setFilterEvYear] = useState("ALL")
  const [filterEvStatus, setFilterEvStatus] = useState("ALL")
  const [filterEvType, setFilterEvType] = useState("ALL")
  const [filterEvProgramId, setFilterEvProgramId] = useState("")
  const [searchEvProgramName, setSearchEvProgramName] = useState("")
  const [showEvProgramDropdown, setShowEvProgramDropdown] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const listAvailableYears = Array.from(new Set(evidences.map(ev => ev.criterion?.standard?.year).filter(Boolean))).sort((a,b) => Number(b) - Number(a)) as number[]

  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAction = async () => {
      if (searchParams.get('action') === 'create') {
        const sType = searchParams.get('type') || 'INSTITUTIONAL'
        const sProgramId = searchParams.get('programId') || ''
        const sYear = searchParams.get('year') || ''
        const sStandardId = searchParams.get('standardId')
        const sCriterionId = searchParams.get('criterionId')
        const sItemId = searchParams.get('itemId')

        setAccreditationType(sType)
        setSelectedProgramId(sProgramId)
        if (sYear) setSelectedYear(Number(sYear))

        const loadedCriteria = await loadCriteriaIfNeeded()

        const targetCriterion = loadedCriteria.find(c => c.id === sCriterionId)
        if (targetCriterion) {
          setSelectedStandardKey(`${targetCriterion.standard.year}-${targetCriterion.standard.name}`)
          setSearchStandardName(`${targetCriterion.standard.year} - ${targetCriterion.standard.name}`)
          setCriterionId(targetCriterion.id)
          setSearchCriterionName(targetCriterion.name)

          if (sItemId) {
            const targetItem = targetCriterion.items.find(i => i.id === sItemId)
            if (targetItem) {
              setEvidenceItemId(targetItem.id)
              setSearchItem(targetItem.name)
            }
          }
        }
        
        if (sType === 'PROGRAM' && sProgramId && programs) {
          const prog = programs.find((p: any) => p.id === sProgramId)
          if (prog) {
            setSearchProgramName(prog.name)
          }
        }

        setIsModalOpen(true)
        
        const url = new URL(window.location.href)
        url.searchParams.delete('action')
        url.searchParams.delete('standardId')
        url.searchParams.delete('criterionId')
        url.searchParams.delete('itemId')
        url.searchParams.delete('type')
        url.searchParams.delete('programId')
        url.searchParams.delete('year')
        window.history.replaceState({}, '', url.toString())
      }
    };
    handleAction();
  }, [searchParams, programs])

  const filteredEvidencesList = useMemo(() => {
    let result = evidences.map(ev => {
      let match = true;
      if (filterEvYear !== "ALL") {
        match = match && ev.criterion?.standard?.year?.toString() === filterEvYear;
      }
      if (filterEvStatus !== "ALL") {
        match = match && ev.status === filterEvStatus;
      }
      if (filterEvType !== "ALL") {
        match = match && ev.criterion?.standard?.type === filterEvType;
      }
      if (filterEvType === "PROGRAM" && filterEvProgramId) {
        match = match && ev.criterion?.standard?.programId === filterEvProgramId;
      }
      if (!match) return { ev, score: 0 };

      let score = 100;
      if (searchEv) {
        score = Math.max(
          smartSearch(ev.criterion?.name, searchEv),
          smartSearch(ev.criterion?.standard?.name, searchEv),
          smartSearch(ev.content, searchEv),
          smartSearch(ev.evidenceItem?.name, searchEv)
        );
      }
      return { ev, score };
    }).filter(item => item.score > 0);

    result.sort((a, b) => b.score - a.score);
    return result.map(item => item.ev);
  }, [evidences, searchEv, filterEvYear, filterEvStatus, filterEvType, filterEvProgramId]);

  useEffect(() => {
    setCurrentPage(1)
  }, [searchEv, filterEvYear, filterEvStatus, filterEvType, filterEvProgramId])

  // Group evidences by Standard -> Criterion
  const groupedEvidences = useMemo(() => {
    const groups: Record<string, {
      standard: { name: string, year: number },
      criteria: Record<string, {
        criterion: { name: string },
        evidences: Evidence[]
      }>
    }> = {}

    filteredEvidencesList.forEach(ev => {
      const stdKey = `${ev.criterion.standard.name} (${ev.criterion.standard.year})`
      const critKey = ev.criterion.name
      
      if (!groups[stdKey]) {
        groups[stdKey] = {
          standard: ev.criterion.standard,
          criteria: {}
        }
      }
      
      if (!groups[stdKey].criteria[critKey]) {
        groups[stdKey].criteria[critKey] = {
          criterion: ev.criterion,
          evidences: []
        }
      }
      
      groups[stdKey].criteria[critKey].evidences.push(ev)
    })
    
    return groups
  }, [filteredEvidencesList])

  const baseFilteredCriteria = criteriaList.filter(c => {
    if (selectedYear !== "" && c.standard.year !== selectedYear) return false
    let matchType = false
    if (accreditationType === "INSTITUTIONAL") {
      matchType = c.standard.type === "INSTITUTIONAL" || !c.standard.type
    } else {
      matchType = c.standard.type === "PROGRAM" && c.standard.programId === selectedProgramId
    }
    return matchType
  })

  // Unique standards for the 1st dropdown
  const availableStandards = Array.from(
    new Map(
      baseFilteredCriteria.map(c => [
        `${c.standard.year}-${c.standard.name}`, 
        { key: `${c.standard.year}-${c.standard.name}`, name: c.standard.name, year: c.standard.year }
      ])
    ).values()
  )

  const filteredStandards = availableStandards.filter(s => 
    smartSearch(`${s.year} - ${s.name}`, searchStandardName) > 0
  ).map(_item => ({ _item, _score: smartSearch(`${_item.year} - ${_item.name}`, searchStandardName) }))
  .sort((a, b) => b._score - a._score)
  .map(obj => obj._item)

  // Filtered criteria based on selected standard for the 2nd dropdown
  const availableCriteriaForStandard = baseFilteredCriteria.filter(c => 
    selectedStandardKey ? `${c.standard.year}-${c.standard.name}` === selectedStandardKey : true
  )

  const filteredCriteria = availableCriteriaForStandard.filter(c => 
    smartSearch(c.name, searchCriterionName) > 0
  ).map(_item => ({ _item, _score: smartSearch(_item.name, searchCriterionName) }))
  .sort((a, b) => b._score - a._score)
  .map(obj => obj._item)

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
        await updateEvidence(editingId, { content: content || undefined, fileUrl: finalFileUrl, evidenceItemId: evidenceItemId || undefined, sharedFromId: syncedParentEvidenceId || undefined })
      } else {
        await createEvidence({ criterionId, content: content || undefined, fileUrl: finalFileUrl, evidenceItemId: evidenceItemId || undefined, sharedFromId: syncedParentEvidenceId || undefined })
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

  const openEditModal = async (ev: Evidence) => {
    await loadCriteriaIfNeeded()
    setEditingId(ev.id)
    setCriterionId(ev.criterion.name) // Not editable, just display
    setEvidenceItemId(ev.evidenceItem?.id || "") 
    setEditingSharedFromId(ev.evidenceItem?.sharedFromId || null)
    setSelectedYear(ev.criterion.standard.year || "")
    setSelectedStandardKey(`${ev.criterion.standard.year}-${ev.criterion.standard.name}`)
    setSearchStandardName(`${ev.criterion.standard.year} - ${ev.criterion.standard.name}`)
    setSearchCriterionName(ev.criterion.name)
    setSearchItem("")
    setSearchProgramName(ev.criterion.standard.program?.name || "")
    setAccreditationType(ev.criterion.standard.type || "INSTITUTIONAL")
    setSelectedProgramId(ev.criterion.standard.programId || "")
    setContent(ev.content || "")
    setExistingFiles(parseFilesForForm(ev.fileUrl))
    setSyncedParentEvidenceId(ev.sharedFrom?.id || null)
    setSelectedFiles([])
    setNewLinkName("")
    setNewLinkUrl("")
    setIsModalOpen(true)
  }

  const openCreateModal = async () => {
    await loadCriteriaIfNeeded()
    setEditingId(null)
    setCriterionId("")
    setEvidenceItemId("")
    setEditingSharedFromId(null)
    setSelectedYear("")
    setSelectedStandardKey("")
    setSearchStandardName("")
    setSearchCriterionName("")
    setSearchItem("")
    setContent("")
    setExistingFiles([])
    setSyncedParentEvidenceId(null)
    setSelectedFiles([])
    setNewLinkName("")
    setNewLinkUrl("")
    setAccreditationType("INSTITUTIONAL")
    setSelectedProgramId("")
    setSearchProgramName("")
    setIsModalOpen(true)
  }
  
  
  const selectedCriterionData = criteriaList.find(c => c.id === criterionId)
  const availableItems = selectedCriterionData?.items || []
  const filteredItems = availableItems.filter(i => smartSearch(i.name, searchItem) > 0)
    .map(_item => ({ _item, _score: smartSearch(_item.name, searchItem) }))
  .sort((a, b) => b._score - a._score)
  .map(obj => obj._item)
  
  const selectedEvidenceItemData = availableItems.find(i => i.id === evidenceItemId)
  const effectiveSharedFromId = editingId ? editingSharedFromId : selectedEvidenceItemData?.sharedFromId

  const handleSyncSharedEvidence = async () => {
    if (!effectiveSharedFromId && !selectedEvidenceItemData) return;
    setIsSyncing(true)
    try {
      const data = await getApprovedEvidenceForSync(effectiveSharedFromId, selectedEvidenceItemData?.name)
      if (data) {
        setSyncedParentEvidenceId(data.id)
        if (data.content) {
          setContent(prev => prev ? `${prev}\n\n[ĐỒNG BỘ TỪ DÙNG CHUNG]:\n${data.content}` : (data.content || ""))
        }
        if (data.fileUrl) {
          const syncedFiles = parseFilesForForm(data.fileUrl)
          setExistingFiles(prev => {
            const newFiles = [...prev]
            syncedFiles.forEach(f => {
               if (!newFiles.some(existing => existing.url === f.url)) {
                 newFiles.push(f)
               }
            })
            return newFiles
          })
        }
        alert("Đã đồng bộ dữ liệu thành công! Bạn có thể xem lại nội dung và file đính kèm bên dưới, sau đó bấm Submit để lưu.")
      } else {
        alert("Không tìm thấy minh chứng nào đã được duyệt từ danh mục gốc để đồng bộ.")
      }
    } catch (err: any) {
      alert("Lỗi đồng bộ: " + err.message)
    } finally {
      setIsSyncing(false)
    }
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
    REJECTED: "Không đạt",
    PENDING: "Chờ duyệt",
    REVIEWING: "Đang xem xét"
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button 
          onClick={openCreateModal}
          disabled={isLoadingCriteria}
          className="bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoadingCriteria ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {isLoadingCriteria ? "Đang tải dữ liệu..." : "Nộp minh chứng"}
        </button>
      </div>

      <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-[var(--foreground)]">
          <Filter size={18} /> Bộ lọc tra cứu minh chứng
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tìm kiếm</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchEv} 
                onChange={e => setSearchEv(e.target.value)} 
                placeholder="Nội dung, Tên tiêu chuẩn, Tiêu chí..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" 
              />
            </div>
          </div>
          <div className="w-[120px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Năm</label>
             <select value={filterEvYear} onChange={e => setFilterEvYear(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Tất cả</option>
               {listAvailableYears.map(y => <option key={y} value={y.toString()}>{y}</option>)}
             </select>
          </div>
          <div className="w-[180px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Trạng thái</label>
             <select value={filterEvStatus} onChange={e => setFilterEvStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Tất cả trạng thái</option>
               <option value="PENDING">Chờ duyệt</option>
               <option value="REVIEWING">Đang xem xét</option>
               <option value="APPROVED">Đã duyệt</option>
               <option value="REJECTED">Không đạt</option>
             </select>
          </div>
          <div className="w-[180px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Loại kiểm định</label>
             <select value={filterEvType} onChange={e => { setFilterEvType(e.target.value); setFilterEvProgramId(""); setSearchEvProgramName(""); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Tất cả các loại</option>
               <option value="INSTITUTIONAL">Kiểm định Trường</option>
               <option value="PROGRAM">Kiểm định Ngành đào tạo</option>
             </select>
          </div>
          {filterEvType === "PROGRAM" && (
            <div className="w-[220px] relative">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ngành đào tạo</label>
              <input 
                type="text"
                value={searchEvProgramName}
                onChange={e => {
                  setSearchEvProgramName(e.target.value);
                  setFilterEvProgramId("");
                  setShowEvProgramDropdown(true);
                }}
                onFocus={() => setShowEvProgramDropdown(true)}
                onBlur={() => setTimeout(() => setShowEvProgramDropdown(false), 200)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm"
                placeholder="Tra cứu ngành học..."
              />
              {showEvProgramDropdown && (
                <div className="absolute z-10 w-[300px] right-0 mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                  {programs.filter((p:any) => p?.name?.toLowerCase().includes(searchEvProgramName.toLowerCase())).length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy ngành</div>
                  ) : (
                    programs.filter((p:any) => p?.name?.toLowerCase().includes(searchEvProgramName.toLowerCase())).map((p:any) => (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setFilterEvProgramId(p.id);
                          setSearchEvProgramName(p.name);
                          setShowEvProgramDropdown(false);
                        }}
                        className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${filterEvProgramId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                      >
                        {p.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredEvidencesList.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Chưa có Minh chứng</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">Bạn chưa tải lên hay báo cáo minh chứng nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Minh chứng</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Tệp đính kèm</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Trạng thái</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Người xử lý</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-right whitespace-nowrap">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedEvidences).map(([stdKey, stdGroup]) => (
                  <React.Fragment key={stdKey}>
                    {/* Standard Row */}
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <td colSpan={5} className="p-3 px-4 font-bold text-indigo-900 dark:text-indigo-300 text-sm">
                        {stdKey}
                      </td>
                    </tr>
                    {Object.entries(stdGroup.criteria).map(([critKey, critGroup]) => (
                      <React.Fragment key={critKey}>
                        {/* Criterion Row */}
                        <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-700/60">
                           <td colSpan={5} className="p-2 px-6 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                             {critKey}
                           </td>
                        </tr>
                        {/* Evidence Rows */}
                        {critGroup.evidences.map((ev, index) => {
                          const bgClass = index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-800/30";
                          const hasSuppInfo = ev.sharedFrom || (ev._count && ev._count.sharedTo > 0) || (ev.status === "REJECTED" && ev.rejectReason);
                          return (
                          <React.Fragment key={ev.id}>
                            <tr id={`ev-${ev.id}`} className={`${bgClass} ${hasSuppInfo ? '' : 'border-b border-slate-200 dark:border-slate-700/50'} hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors`}>
                              <td className="p-3 pl-10 align-top min-w-[300px] max-w-[400px]">
                                {ev.evidenceItem && (
                                  <div className="mb-2 inline-block px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded text-[11px] font-semibold break-words whitespace-normal">
                                    Minh chứng: {ev.evidenceItem.name}
                                  </div>
                                )}
                                <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                  {ev.content || ev.sharedFrom?.content || "Không có nội dung mô tả"}
                                </div>
                              </td>
                            <td className="p-3 align-top min-w-[200px]">
                               <FileAttachments fileStr={ev.fileUrl || ev.sharedFrom?.fileUrl || null} />
                            </td>
                            <td className="p-3 align-top">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${statusColors[ev.status]}`}>
                                <StatusIcon status={ev.status} />
                                {statusLabels[ev.status] || ev.status}
                              </div>
                            </td>
                            <td className="p-3 align-top text-xs text-slate-500">
                               <div className="flex items-center gap-1 mb-1">
                                 <UserCircle size={12} className="text-slate-400" />
                                 <strong className="text-[var(--foreground)]">{ev.collaborator?.name}</strong>
                               </div>
                               {ev.reviewer && (
                                 <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                                   <CheckCircle2 size={10} />
                                   Duyệt: {ev.reviewer.name}
                                 </div>
                               )}
                               {ev.lastUpdater && (
                                 <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                                   <Edit2 size={10} />
                                   Cập nhật: {ev.lastUpdater.name}
                                 </div>
                               )}
                            </td>
                            <td className="p-3 align-top text-right">
                              {["PENDING", "REJECTED"].includes(ev.status) && (
                                <button onClick={() => openEditModal(ev)} className="inline-flex items-center justify-center p-1.5 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-md transition-colors" title="Sửa báo cáo">
                                  <Edit2 size={14} /> <span className="ml-1 text-xs font-semibold">Sửa</span>
                                </button>
                              )}
                            </td>
                            </tr>
                            
                            {/* Supplementary info row */}
                            {hasSuppInfo && (
                              <tr className={`${bgClass} border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors`}>
                                <td colSpan={5} className="px-3 pb-3 pl-10 pt-1">
                                  <div className="flex flex-col gap-2">
                                    {ev.sharedFrom && (
                                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-lg py-2 px-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-[12px]">
                                          <Link2 size={14} /> 
                                          <span>Dùng chung từ tiêu chí: <strong className="font-bold text-indigo-700 dark:text-indigo-300">{ev.sharedFrom.criterion.name}</strong></span>
                                        </div>
                                        <button 
                                          onClick={() => setViewingSharedEvidence(ev.sharedFrom)}
                                          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 rounded-md text-[11px] font-bold transition-colors"
                                        >
                                          Xem bản gốc
                                        </button>
                                      </div>
                                    )}
                                    {ev._count && ev._count.sharedTo > 0 && (
                                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg py-2 px-3">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-[12px]">
                                          <Link2 size={14} /> 
                                          <span>Đang được dùng chung cho <strong className="font-bold text-emerald-700 dark:text-emerald-300">{ev._count.sharedTo}</strong> tiêu chuẩn khác</span>
                                        </div>
                                      </div>
                                    )}
                                    {ev.status === "REJECTED" && ev.rejectReason && (
                                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-[12px] mb-1">
                                          <AlertCircle size={14} /> Lý do không đạt:
                                        </div>
                                        <p className="text-sm text-red-700 dark:text-red-300 ml-5">{ev.rejectReason}</p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )})}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[800px] max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-bold">{editingId ? 'Cập nhật Minh chứng' : 'Thêm Minh chứng mới'}</h3>
            </div>
            
            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Chọn Năm</label>
                <select disabled={!!editingId} value={selectedYear} onChange={e => {
                  setSelectedYear(e.target.value ? Number(e.target.value) : "")
                  setSelectedStandardKey("")
                  setSearchStandardName("")
                  setCriterionId("")
                  setSearchCriterionName("")
                }} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 border rounded-xl outline-none text-sm focus:border-[var(--primary)]">
                  <option value="">-- Tất cả --</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Loại Kiểm định</label>
                  <select disabled={!!editingId} value={accreditationType} onChange={e => {
                    setAccreditationType(e.target.value)
                    setSelectedStandardKey("")
                    setSearchStandardName("")
                    setCriterionId("")
                    setSearchCriterionName("")
                  }} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm focus:border-[var(--primary)]">
                    <option value="INSTITUTIONAL">Kiểm định Trường</option>
                    <option value="PROGRAM">Kiểm định Ngành đào tạo</option>
                  </select>
                </div>
                {accreditationType === "PROGRAM" && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Chọn Ngành học</label>
                    <div className="relative">
                      <input 
                        type="text"
                        disabled={!!editingId}
                        value={searchProgramName}
                        onChange={e => {
                          setSearchProgramName(e.target.value);
                          setSelectedProgramId("");
                          setSelectedStandardKey("");
                          setSearchStandardName("");
                          setCriterionId("");
                          setSearchCriterionName("");
                          setShowProgramDropdown(true);
                        }}
                        onFocus={() => setShowProgramDropdown(true)}
                        onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                        placeholder="Gõ tên ngành học để tìm kiếm..."
                        required={!selectedProgramId}
                      />
                      {showProgramDropdown && !editingId && (
                        <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                          {programs.filter((p:any) => p.name.toLowerCase().includes(searchProgramName.toLowerCase())).length === 0 ? (
                            <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy ngành học phù hợp</div>
                          ) : (
                            programs.filter((p:any) => p.name.toLowerCase().includes(searchProgramName.toLowerCase())).map((p:any) => (
                              <div 
                                key={p.id} 
                                onClick={() => {
                                  setSelectedProgramId(p.id);
                                  setSearchProgramName(p.name);
                                  setSelectedStandardKey("");
                                  setSearchStandardName("");
                                  setCriterionId("");
                                  setSearchCriterionName("");
                                  setShowProgramDropdown(false);
                                }}
                                className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${selectedProgramId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                              >
                                {p.name}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">1. Chọn tiêu chí</label>
                  {editingId ? (
                     <input type="text" readOnly disabled value={searchStandardName} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-xl text-slate-500 line-clamp-1 truncate" />
                  ) : (
                    <div className="relative">
                      <input 
                        type="text"
                        value={searchStandardName}
                        onChange={e => {
                          setSearchStandardName(e.target.value)
                          setSelectedStandardKey("")
                          setCriterionId("")
                          setSearchCriterionName("")
                          setShowStandardDropdown(true)
                        }}
                        onFocus={() => setShowStandardDropdown(true)}
                        onBlur={() => setTimeout(() => setShowStandardDropdown(false), 200)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        placeholder="Gõ từ khóa để tìm tiêu chuẩn..."
                        required={!selectedStandardKey}
                      />
                      {showStandardDropdown && (
                        <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                          {filteredStandards.length === 0 ? (
                            <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy tiêu chuẩn</div>
                          ) : (
                            filteredStandards.map(s => (
                              <div 
                                key={s.key} 
                                onClick={() => {
                                  setSelectedStandardKey(s.key)
                                  setSearchStandardName(`${s.year} - ${s.name}`)
                                  setCriterionId("")
                                  setSearchCriterionName("")
                                  setShowStandardDropdown(false)
                                }}
                                className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${selectedStandardKey === s.key ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                              >
                                {s.year} - {s.name}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">2. Chọn Tiêu chuẩn</label>
                  {editingId ? (
                     <input type="text" readOnly disabled value={criterionId} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-xl text-slate-500 line-clamp-1 truncate" />
                  ) : (
                    <div className="relative">
                      <input 
                        type="text"
                        value={searchCriterionName}
                        onChange={e => {
                          setSearchCriterionName(e.target.value)
                          setShowCriterionDropdown(true)
                        }}
                        onFocus={() => setShowCriterionDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCriterionDropdown(false), 200)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                        placeholder={selectedStandardKey ? "Gõ từ khóa để tìm tiêu chí..." : "Vui lòng chọn tiêu chuẩn trước"}
                        required={!criterionId}
                        disabled={!selectedStandardKey}
                      />
                      {showCriterionDropdown && selectedStandardKey && (
                        <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                          {filteredCriteria.length === 0 ? (
                            <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy tiêu chí</div>
                          ) : (
                            filteredCriteria.map(c => (
                              <div 
                                key={c.id} 
                                onClick={() => {
                                  setCriterionId(c.id)
                                  setSearchCriterionName(c.name)
                                  setShowCriterionDropdown(false)
                                }}
                                className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${criterionId === c.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                              >
                                {c.name}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {availableItems.length > 0 && !editingId && (
                <div>
                  <label className="block text-sm font-semibold mb-2">3. Chọn danh mục minh chứng</label>
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 mb-2 gap-2">
                <label className="block text-sm font-semibold">Nội dung giải trình / báo cáo</label>
                {(effectiveSharedFromId || selectedEvidenceItemData) && (
                  <button 
                    type="button"
                    onClick={handleSyncSharedEvidence}
                    disabled={isSyncing}
                    className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-200 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                    Đồng bộ Dữ liệu Dùng chung
                  </button>
                )}
              </div>

              <div>
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
              
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
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

      {viewingSharedEvidence && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[700px] max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--foreground)]">
                <Link2 size={20} className="text-indigo-500" />
                Thông tin Minh chứng Dùng chung
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4 text-sm text-slate-500">
                Từ tiêu chí: <strong className="text-indigo-600 dark:text-indigo-400">{viewingSharedEvidence.criterion?.standard?.name} ({viewingSharedEvidence.criterion?.standard?.year})</strong>
                <br />
                Tiêu chuẩn: <strong className="text-indigo-600 dark:text-indigo-400">{viewingSharedEvidence.criterion?.name}</strong>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Nội dung báo cáo:</label>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {viewingSharedEvidence.content || "Chưa có nội dung mô tả"}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Tài liệu đính kèm:</label>
                <FileAttachments fileStr={viewingSharedEvidence.fileUrl || null} />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0 bg-white dark:bg-slate-900">
              <button 
                onClick={() => setViewingSharedEvidence(null)} 
                className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
