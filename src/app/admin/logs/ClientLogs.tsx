"use client"

import { useState, useMemo } from "react"
import { Clock, ShieldAlert, FileText, UserPlus, FileEdit, Trash2, CheckCircle2, Search, Download, ChevronLeft, ChevronRight, CalendarDays, Users, Filter } from "lucide-react"

type LogItem = {
  id: string
  action: string
  resource: string
  details: string | null
  createdAt: Date
  user: { name: string | null; email: string | null; role: string } | null
}

const PAGE_SIZE = 20

export default function ClientLogs({ logs }: { logs: LogItem[] }) {
  const [page, setPage] = useState(1)
  const [filterUser, setFilterUser] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>()
    logs.forEach(l => {
      if (l.user?.email) {
        map.set(l.user.email, l.user.name || l.user.email)
      }
    })
    return Array.from(map.entries()) // [email, name]
  }, [logs])

  // Filtered logs
  const filtered = useMemo(() => {
    let result = logs

    if (filterUser) {
      result = result.filter(l => l.user?.email === filterUser)
    }

    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0, 0, 0, 0)
      result = result.filter(l => new Date(l.createdAt) >= from)
    }

    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter(l => new Date(l.createdAt) <= to)
    }

    return result
  }, [logs, filterUser, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Reset page when filters change
  const resetPage = () => setPage(1)

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <UserPlus size={14} className="text-emerald-500" />
      case "UPDATE": return <FileEdit size={14} className="text-amber-500" />
      case "DELETE": return <Trash2 size={14} className="text-rose-500" />
      case "APPROVE": return <CheckCircle2 size={14} className="text-blue-500" />
      default: return <FileText size={14} className="text-slate-500" />
    }
  }

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      UPDATE: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
      DELETE: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
      APPROVE: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    }
    const labels: Record<string, string> = {
      CREATE: "Tạo mới", UPDATE: "Cập nhật", DELETE: "Xóa", APPROVE: "Kiểm duyệt"
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${colors[action] || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
        {getActionIcon(action)}
        {labels[action] || action}
      </span>
    )
  }

  // Export to Excel
  const exportToExcel = () => {
    const header = ["Thời gian", "Người thực hiện", "Email", "Vai trò", "Hành động", "Đối tượng", "Chi tiết"]
    const actionLabels: Record<string, string> = { CREATE: "Tạo mới", UPDATE: "Cập nhật", DELETE: "Xóa", APPROVE: "Kiểm duyệt" }
    const roleLabels: Record<string, string> = { ADMIN: "Quản trị viên", SUPERVISOR: "Giám sát viên", COLLABORATOR: "Cộng tác viên", INVESTIGATOR: "Điều tra viên" }

    const rows = filtered.map(l => [
      new Date(l.createdAt).toLocaleString("vi-VN"),
      l.user?.name || "Hệ thống",
      l.user?.email || "",
      roleLabels[l.user?.role || ""] || l.user?.role || "",
      actionLabels[l.action] || l.action,
      l.resource,
      l.details || ""
    ])

    // Build XML-based Excel (xlsx-compatible)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<?mso-application progid="Excel.Sheet"?>\n'
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n'
    xml += '<Styles><Style ss:ID="header"><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#4F46E5" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Bold="1"/></Style></Styles>\n'
    xml += '<Worksheet ss:Name="Nhật ký hệ thống"><Table>\n'

    // Column widths
    const widths = [150, 150, 200, 120, 100, 180, 400]
    widths.forEach(w => { xml += `<Column ss:Width="${w}"/>\n` })

    // Header row
    xml += '<Row>'
    header.forEach(h => { xml += `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>` })
    xml += '</Row>\n'

    // Data rows
    rows.forEach(row => {
      xml += '<Row>'
      row.forEach(cell => {
        const escaped = String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        xml += `<Cell><Data ss:Type="String">${escaped}</Data></Cell>`
      })
      xml += '</Row>\n'
    })

    xml += '</Table></Worksheet></Workbook>'

    const blob = new Blob([xml], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const now = new Date().toISOString().slice(0, 10)
    a.download = `nhat-ky-he-thong_${now}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="glass rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-end">
          <div className="flex-1 min-w-0">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Users size={12} /> Thành viên</label>
            <select
              value={filterUser}
              onChange={e => { setFilterUser(e.target.value); resetPage() }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="">-- Tất cả --</option>
              {uniqueUsers.map(([email, name]) => (
                <option key={email} value={email}>{name} ({email})</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-0">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CalendarDays size={12} /> Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); resetPage() }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex-1 min-w-0">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CalendarDays size={12} /> Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); resetPage() }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setFilterUser(""); setDateFrom(""); setDateTo(""); resetPage() }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Filter size={14} /> Xóa lọc
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} /> Xuất Excel
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-400">
          Hiển thị <strong className="text-slate-600 dark:text-slate-300">{filtered.length}</strong> kết quả
          {(filterUser || dateFrom || dateTo) && " (đã lọc)"}
          {" · "} Trang <strong>{currentPage}</strong>/<strong>{totalPages}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                <th className="p-4 font-bold whitespace-nowrap w-[160px]">Thời gian</th>
                <th className="p-4 font-bold whitespace-nowrap w-[180px]">Người thực hiện</th>
                <th className="p-4 font-bold whitespace-nowrap w-[110px]">Hành động</th>
                <th className="p-4 font-bold whitespace-nowrap w-[180px]">Đối tượng</th>
                <th className="p-4 font-bold">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <Search size={24} className="mx-auto mb-2 opacity-40" />
                    Không có nhật ký nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paged.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap text-xs">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400"/>
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {log.user.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{log.user.name}</div>
                            <div className="text-[11px] text-slate-400 truncate">{log.user.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Hệ thống</span>
                      )}
                    </td>
                    <td className="p-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-xs">
                      {log.resource}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                      {log.details || <span className="text-slate-400">-</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (currentPage <= 4) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = currentPage - 3 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === pageNum
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
