"use client"

import React, { useState, useMemo } from "react"
import { updateEvidenceStatus, deleteEvidenceAsAdmin } from "@/actions/supervisor"
import { Loader2, CheckCircle2, Clock, AlertCircle, FileText, UserCircle, XCircle, Edit2, Search, Filter, Calendar, Link2 } from "lucide-react"
import { EvidenceStatus } from "@prisma/client"
import { smartSearch } from "@/lib/utils"
import FileAttachments from "@/components/FileAttachments"

export default function ClientReviewList({ initialEvidences, programs = [], isAdmin = false }: { initialEvidences: any[], programs?: any[], isAdmin?: boolean }) {
  const [evidences, setEvidences] = useState(initialEvidences)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Rejection modal state
  const [rejectModalId, setRejectModalId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [viewingSharedEvidence, setViewingSharedEvidence] = useState<any>(null)

  // Filter & Pagination States
  const [searchUser, setSearchUser] = useState("")
  const [searchDepartment, setSearchDepartment] = useState("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  const [filterYear, setFilterYear] = useState("ALL")
  const [filterType, setFilterType] = useState("ALL")
  const [filterProgramId, setFilterProgramId] = useState("")
  const [searchProgramName, setSearchProgramName] = useState("")
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const handleStatusChange = async (id: string, newStatus: EvidenceStatus, reason?: string) => {
    if (newStatus === "REJECTED") {
      setRejectModalId(id)
      setRejectReason("")
      return
    }
    
    setLoadingId(id)
    try {
      await updateEvidenceStatus(id, newStatus)
      setEvidences(evidences.map(ev => ev.id === id ? { ...ev, status: newStatus, rejectReason: null } : ev))
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi duyệt minh chứng")
    } finally {
      setLoadingId(null)
    }
  }

  const confirmReject = async () => {
    if (!rejectModalId) return
    if (!rejectReason.trim()) return alert("Vui lòng nhập lý do không đạt!")

    setLoadingId(rejectModalId)
    setRejectModalId(null)
    try {
      await updateEvidenceStatus(rejectModalId, "REJECTED" as EvidenceStatus, rejectReason.trim())
      setEvidences(evidences.map(ev => ev.id === rejectModalId ? { ...ev, status: "REJECTED", rejectReason: rejectReason.trim() } : ev))
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi không đạt minh chứng")
    } finally {
      setLoadingId(null)
      setRejectReason("")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn XÓA BỎ HOÀN TOÀN minh chứng này? Thao tác này không thể hoàn tác!")) return
    
    setLoadingId(id)
    try {
      await deleteEvidenceAsAdmin(id)
      setEvidences(evidences.filter(ev => ev.id !== id))
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi xóa minh chứng")
    } finally {
      setLoadingId(null)
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
    APPROVED: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    PENDING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    REVIEWING: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
  }

  // --- FILTERING ---
  const filteredEvidences = evidences.map(ev => {
    let match = true
    if (searchDepartment !== "ALL") {
      match = match && ev.collaborator?.department?.name === searchDepartment
    }
    if (statusFilter !== "ALL") {
      match = match && ev.status === statusFilter
    }
    if (filterYear !== "ALL") {
      match = match && ev.criterion?.standard?.year?.toString() === filterYear
    }
    if (filterType !== "ALL") {
      match = match && ev.criterion?.standard?.type === filterType
    }
    if (filterType === "PROGRAM" && filterProgramId) {
      match = match && ev.criterion?.standard?.programId === filterProgramId
    }
    if (startDate) {
      match = match && new Date(ev.createdAt) >= new Date(startDate)
    }
    if (endDate) {
      const endD = new Date(endDate)
      endD.setHours(23, 59, 59, 999)
      match = match && new Date(ev.createdAt) <= endD
    }
    if (!match) return { ev, score: 0 }

    let score = 100
    if (searchUser) {
      score = Math.max(
        smartSearch(ev.collaborator?.name, searchUser),
        smartSearch(ev.collaborator?.email, searchUser),
        smartSearch(ev.criterion?.name, searchUser),
        smartSearch(ev.criterion?.standard?.name, searchUser),
        smartSearch(ev.evidenceItem?.name, searchUser)
      )
    }
    return { ev, score }
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.ev)

  // --- PAGINATION ---
  const totalPages = Math.max(1, Math.ceil(filteredEvidences.length / itemsPerPage))
  const paginatedEvidences = filteredEvidences.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const departments = Array.from(new Set(evidences.map(ev => ev.collaborator?.department?.name).filter(Boolean))) as string[]
  const listAvailableYears = Array.from(new Set(evidences.map(ev => ev.criterion?.standard?.year).filter(Boolean))).sort((a,b) => Number(b) - Number(a)) as number[]

  
  // Group evidences by Standard -> Criterion
  const groupedEvidences = useMemo(() => {
    const groups: Record<string, {
      standard: any,
      criteria: Record<string, {
        criterion: any,
        evidences: any[]
      }>
    }> = {}

    paginatedEvidences.forEach(ev => {
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
  }, [paginatedEvidences])

return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-[var(--foreground)]">
          <Filter size={18} /> Bộ lọc tìm kiếm nâng cao
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tìm kiếm</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchUser} 
                onChange={e => { setSearchUser(e.target.value); setCurrentPage(1); }} 
                placeholder="Tên NV, Email, Tên tiêu chuẩn, Tên minh chứng..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" 
              />
            </div>
          </div>
          <div className="w-[120px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Năm</label>
             <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Tất cả</option>
               {listAvailableYears.map(y => <option key={y} value={y.toString()}>{y}</option>)}
             </select>
          </div>
          <div className="w-[180px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Trạng thái</label>
             <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Tất cả trạng thái</option>
               <option value="PENDING">Chờ duyệt</option>
               <option value="REVIEWING">Đang xem xét</option>
               <option value="APPROVED">Đạt (Phê duyệt)</option>
               <option value="REJECTED">Không đạt</option>
             </select>
          </div>
          <div className="w-[180px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Loại kiểm định</label>
             <select value={filterType} onChange={e => { setFilterType(e.target.value); setFilterProgramId(""); setSearchProgramName(""); setCurrentPage(1); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Tất cả các loại</option>
               <option value="INSTITUTIONAL">Kiểm định Trường</option>
               <option value="PROGRAM">Kiểm định Ngành đào tạo</option>
             </select>
          </div>
          {filterType === "PROGRAM" && (
            <div className="w-[220px] relative">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ngành đào tạo</label>
              <input 
                type="text"
                value={searchProgramName}
                onChange={e => {
                  setSearchProgramName(e.target.value);
                  setFilterProgramId("");
                  setShowProgramDropdown(true);
                  setCurrentPage(1);
                }}
                onFocus={() => setShowProgramDropdown(true)}
                onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm"
                placeholder="Tra cứu ngành học..."
              />
              {showProgramDropdown && (
                <div className="absolute z-10 w-[300px] left-0 mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                  {programs.filter((p:any) => smartSearch(p.name, searchProgramName) > 0).length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy ngành</div>
                  ) : (
                    programs.filter((p:any) => smartSearch(p.name, searchProgramName) > 0)
                      .map(_item => ({ _item, _score: smartSearch(_item.name, searchProgramName) }))
  .sort((a, b) => b._score - a._score)
  .map(obj => obj._item)
                      .map((p:any) => (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setFilterProgramId(p.id);
                          setSearchProgramName(p.name);
                          setShowProgramDropdown(false);
                          setCurrentPage(1);
                        }}
                        className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${filterProgramId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                      >
                        {p.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {departments.length > 0 && (
             <div className="w-[200px]">
               <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Đơn vị / Phòng ban</label>
               <select value={searchDepartment} onChange={e => { setSearchDepartment(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
                 <option value="ALL">Tất cả đơn vị</option>
                 {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
               </select>
             </div>
          )}
          <div className="w-auto flex items-center gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Từ ngày</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }} className="w-[130px] px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" />
            </div>
            <div className="pt-6 text-slate-400">-</div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Đến ngày</label>
              <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }} className="w-[130px] px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" />
            </div>
          </div>
        </div>
      </div>

      

<div className="grid grid-cols-1 gap-4">
        {filteredEvidences.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Không tìm thấy minh chứng nào</h3>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Minh chứng</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Tệp đính kèm</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Thông tin & Đánh giá</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-right whitespace-nowrap">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedEvidences).map(([stdKey, stdGroup]) => (
                  <React.Fragment key={stdKey}>
                    {/* Standard Row */}
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <td colSpan={4} className="p-3 px-4 font-bold text-indigo-900 dark:text-indigo-300 text-sm">
                        {stdKey}
                      </td>
                    </tr>
                    {Object.entries(stdGroup.criteria).map(([critKey, critGroup]) => (
                      <React.Fragment key={critKey}>
                        {/* Criterion Row */}
                        <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-700/60">
                           <td colSpan={4} className="p-2 px-6 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                             {critKey}
                           </td>
                        </tr>
                        {/* Evidence Rows */}
                        {critGroup.evidences.map((ev: any, index: number) => {
                          const bgClass = index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-800/30";
                          const hasSuppInfo = ev.sharedFrom || (ev._count && ev._count.sharedTo > 0) || (ev.status === "REJECTED" && ev.rejectReason) || (ev.evaluations && ev.evaluations.filter((e: any) => !e.isApproved).length > 0);
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
                              <div className={`mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${statusColors[ev.status]}`}>
                                <StatusIcon status={ev.status} />
                                {ev.status === "PENDING" && "Chờ duyệt"}
                                {ev.status === "REVIEWING" && "Đang xem xét"}
                                {ev.status === "APPROVED" && "Đạt (Phê duyệt)"}
                                {ev.status === "REJECTED" && "Không đạt"}
                              </div>
                              <div className="flex flex-col gap-1.5 text-[10px] font-medium text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <UserCircle size={12} className="text-slate-400" />
                                  <span>Nộp bởi: <strong className="text-slate-700 dark:text-slate-300">{ev.collaborator.name}</strong> {ev.collaborator?.department?.name && `(${ev.collaborator.department.name})`}</span>
                                </div>
                                {ev.reviewer && ev.reviewedAt && (
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    <span>Duyệt bởi <strong className="text-slate-700 dark:text-slate-300">{ev.reviewer.name}</strong> ({(new Date(ev.reviewedAt)).toLocaleDateString("vi-VN")})</span>
                                  </div>
                                )}
                                {ev.lastUpdater && ev.updatedAt && (
                                  <div className="flex items-center gap-1.5">
                                    <Edit2 size={12} className="text-blue-500" />
                                    <span>Cập nhật bởi <strong className="text-slate-700 dark:text-slate-300">{ev.lastUpdater.name}</strong> ({(new Date(ev.updatedAt)).toLocaleDateString("vi-VN")})</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 align-top text-right min-w-[160px]">
                                <div className="w-full flex flex-col items-end gap-2">
                                  <div className="relative w-full">
                                    <select
                                      disabled={loadingId === ev.id}
                                      value={ev.status}
                                      onChange={(e) => handleStatusChange(ev.id, e.target.value as EvidenceStatus)}
                                      className={`w-full px-3 py-2 rounded-lg border outline-none font-bold text-xs cursor-pointer shadow-sm appearance-none pr-8 ${statusColors[ev.status]}`}
                                    >
                                      <option value="PENDING" className="bg-white text-slate-900">Chờ duyệt</option>
                                      <option value="REVIEWING" className="bg-white text-slate-900">Đang xem xét</option>
                                      <option value="APPROVED" className="bg-white text-slate-900">Phê duyệt</option>
                                      <option value="REJECTED" className="bg-white text-slate-900">Không đạt</option>
                                    </select>
                                    {loadingId === ev.id ? (
                                      <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-500" />
                                    ) : (
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                                    )}
                                  </div>
                                  
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDelete(ev.id)}
                                      disabled={loadingId === ev.id}
                                      className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 font-bold rounded-lg text-xs transition-colors shadow-sm"
                                    >
                                      Xóa
                                    </button>
                                  )}
                                </div>
                            </td>
                            </tr>
                            
                            {/* Supplementary info row */}
                            {hasSuppInfo && (
                              <tr className={`${bgClass} border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors`}>
                                <td colSpan={4} className="px-3 pb-3 pl-10 pt-1">
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
                                          <Search size={10} /> Xem gốc
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
                                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold text-[12px] mb-1">
                                          <AlertCircle size={14} /> Giám sát viên không đạt:
                                        </div>
                                        <p className="text-sm text-orange-700 dark:text-orange-300 ml-5">{ev.rejectReason}</p>
                                      </div>
                                    )}
                                    {ev.evaluations && ev.evaluations.filter((e: any) => !e.isApproved).length > 0 && (
                                      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 shadow-sm">
                                        <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold text-sm mb-1.5">
                                          <AlertCircle size={16} /> Điều tra viên đánh giá KHÔNG ĐẠT
                                        </div>
                                        {ev.evaluations.filter((e: any) => !e.isApproved).map((evaluation: any, idx: number) => (
                                           <div key={evaluation.id} className="mb-2 last:mb-0">
                                             <p className="text-[11px] opacity-80 text-red-600 dark:text-red-400">
                                               <strong>{evaluation.evaluator?.name || "Điều tra viên"}</strong> - {new Date(evaluation.createdAt).toLocaleString('vi-VN')}
                                             </p>
                                             <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                                               Lý do lần {idx + 1}: {evaluation.comments || "Không có phản hồi thêm"}
                                             </p>
                                           </div>
                                        ))}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--card)] px-4 py-3 sm:px-6 rounded-b-2xl mt-4">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Hiển thị <span className="font-medium text-[var(--foreground)]">{((currentPage - 1) * itemsPerPage) + 1}</span> đến <span className="font-medium text-[var(--foreground)]">{Math.min(currentPage * itemsPerPage, filteredEvidences.length)}</span> trong số <span className="font-medium text-[var(--foreground)]">{filteredEvidences.length}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Trang trước</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      aria-current={currentPage === pageNum ? "page" : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                        currentPage === pageNum
                          ? "z-10 bg-[var(--primary)] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                          : "text-slate-900 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Trang sau</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
          
          {/* Mobile Pagination View */}
          <div className="flex flex-1 justify-between sm:hidden mt-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Trang trước
            </button>
            <span className="text-sm self-center text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
{/* Rejection reason modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[800px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Không đạt Minh chứng</h3>
                <p className="text-xs text-slate-500">Nhập lý do để CTV biết cần sửa gì</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Lý do không đạt <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 min-h-[100px] text-sm"
                  placeholder="Ví dụ: Thiếu tài liệu chứng minh, cần bổ sung biên bản họp..."
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setRejectModalId(null); setRejectReason("") }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={16} /> Xác nhận Không đạt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Evidence View Modal */}
      {viewingSharedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[700px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Link2 size={20} className="text-indigo-500" />
                Thông tin Minh chứng Dùng chung
              </h3>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-4 text-sm text-slate-500">
                Từ tiêu chí: <strong className="text-indigo-600 dark:text-indigo-400">{viewingSharedEvidence.criterion?.standard?.name} ({viewingSharedEvidence.criterion?.standard?.year})</strong>
                <br />
                Tiêu chuẩn: <strong className="text-indigo-600 dark:text-indigo-400">{viewingSharedEvidence.criterion?.name}</strong>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Nội dung báo cáo:</label>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {viewingSharedEvidence.content || "Chưa có nội dung mô tả"}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Tài liệu đính kèm:</label>
                <FileAttachments fileStr={viewingSharedEvidence.fileUrl || null} />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
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
