"use client"

import { useState, useEffect, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FileDown, Filter, Loader2, ArrowRight, FolderTree, FileText, FileCheck } from "lucide-react"
import * as XLSX from "xlsx"
import Link from "next/link"

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "#10b981", // emerald-500
  REVIEWING: "#3b82f6", // blue-500
  REJECTED: "#ef4444", // red-500
  PENDING: "#f59e0b", // amber-500
  UNSUBMITTED: "#94a3b8", // slate-400
}

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Đạt",
  REVIEWING: "Chờ duyệt",
  REJECTED: "Không đạt",
  PENDING: "Đã nộp",
  UNSUBMITTED: "Chưa nộp"
}

export default function StatisticsDashboard({ role, programs = [] }: { role: string, programs?: any[] }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState<string>("")
  const [type, setType] = useState<string>("INSTITUTIONAL")
  const [programId, setProgramId] = useState<string>("")
  const [searchProgramName, setSearchProgramName] = useState("Tất cả CTĐT")
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (year) params.append("year", year)
      if (type) params.append("type", type)
      if (type === "PROGRAM" && programId) params.append("programId", programId)

      const res = await fetch(`/api/statistics?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    setCurrentPage(1)
  }, [year, type, programId])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus])

  // Aggregations
  const stats = useMemo(() => {
    let totalStandards = 0
    let totalCriteria = 0
    let totalItems = 0
    let submittedCount = 0
    let unsubmittedCount = 0
    let statusCounts: Record<string, number> = {
      APPROVED: 0,
      REVIEWING: 0,
      REJECTED: 0,
      PENDING: 0,
      UNSUBMITTED: 0
    }

    data.forEach(standard => {
      totalStandards++
      standard.criteria.forEach((criterion: any) => {
        totalCriteria++
        criterion.items.forEach((item: any) => {
          totalItems++
          const evidence = item.evidences?.[0]
          if (evidence) {
            submittedCount++
            statusCounts[evidence.status] = (statusCounts[evidence.status] || 0) + 1
          } else {
            unsubmittedCount++
            statusCounts["UNSUBMITTED"]++
          }
        })
      })
    })

    return { totalStandards, totalCriteria, totalItems, submittedCount, unsubmittedCount, statusCounts }
  }, [data])

  const pieData = Object.entries(stats.statusCounts)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value,
      color: STATUS_COLORS[key] || "#000"
    }))

  const barData = data.map(standard => {
    let submitted = 0
    let unsubmitted = 0
    standard.criteria.forEach((c: any) => {
      c.items.forEach((i: any) => {
        if (i.evidences?.[0]) submitted++
        else unsubmitted++
      })
    })
    return {
      name: standard.name.length > 20 ? standard.name.substring(0, 20) + "..." : standard.name,
      fullName: standard.name,
      "Đã nộp": submitted,
      "Chưa nộp": unsubmitted
    }
  })

  const flattenedItems = useMemo(() => {
    const items: any[] = []
    const seenCriteria = new Set<string>()
    data.forEach(standard => {
      standard.criteria.forEach((criterion: any) => {
        criterion.items.forEach((item: any) => {
          const evidence = item.evidences?.[0]
          const statusKey = evidence ? evidence.status : "UNSUBMITTED"

          if (filterStatus === "ALL" || filterStatus === statusKey) {
            items.push({
              standard,
              criterion,
              item,
              isFirstInCriterion: !seenCriteria.has(criterion.id)
            })
            seenCriteria.add(criterion.id)
          }
        })
      })
    })
    return items
  }, [data, filterStatus])

  const totalPages = Math.ceil(flattenedItems.length / itemsPerPage)
  const currentItems = flattenedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportExcel = () => {
    const excelData: any[] = []
    
    data.forEach(standard => {
      standard.criteria.forEach((criterion: any) => {
        criterion.items.forEach((item: any) => {
          const evidence = item.evidences?.[0]
          excelData.push({
            "Năm": standard.year,
            "Loại kiểm định": standard.type === "INSTITUTIONAL" ? "Cơ sở giáo dục" : "Chương trình đào tạo",
            "CTĐT": standard.program?.name || "",
            "Tiêu chuẩn": standard.name,
            "Tiêu chí": criterion.name,
            "Minh chứng": item.name,
            "Trạng thái": evidence ? STATUS_LABELS[evidence.status] : "Chưa nộp",
            "Người nộp": evidence?.collaborator?.name || "",
            "Ngày nộp": evidence?.createdAt ? new Date(evidence.createdAt).toLocaleDateString("vi-VN") : "",
            "Người duyệt": evidence?.reviewer?.name || ""
          })
        })
      })
    })

    const ws = XLSX.utils.json_to_sheet(excelData)
    
    // Auto-size columns
    const colWidths = [
      { wch: 8 }, // Năm
      { wch: 20 }, // Loại
      { wch: 25 }, // CTĐT
      { wch: 30 }, // Tiêu chuẩn
      { wch: 30 }, // Tiêu chí
      { wch: 40 }, // Minh chứng
      { wch: 15 }, // Trạng thái
      { wch: 20 }, // Người nộp
      { wch: 15 }, // Ngày nộp
      { wch: 20 }, // Người duyệt
    ]
    ws["!cols"] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "ThongKe_MinhChung")
    XLSX.writeFile(wb, `Thong_Ke_Minh_Chung_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Thống kê & Báo cáo</h1>
          <p className="text-slate-500 mt-1">Tổng quan về tiến độ và trạng thái kiểm định chất lượng</p>
        </div>
        {(role === "ADMIN" || role === "SUPERVISOR") && (
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-[var(--primary)] hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/20"
          >
            <FileDown size={18} />
            <span>Xuất Excel</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter size={18} />
          <span className="font-medium">Lọc:</span>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
        >
          <option value="">Tất cả các năm</option>
          {Array.from({ length: 10 }).map((_, i) => {
            const y = new Date().getFullYear() - 5 + i;
            return <option key={y} value={y}>{y}</option>
          })}
        </select>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            if (e.target.value !== "PROGRAM") {
              setProgramId("")
              setSearchProgramName("Tất cả CTĐT")
            }
          }}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
        >
          <option value="">Tất cả loại kiểm định</option>
          <option value="INSTITUTIONAL">Cơ sở giáo dục</option>
          <option value="PROGRAM">Chương trình đào tạo</option>
        </select>
        {type === "PROGRAM" && (
          <div className="relative min-w-[250px]">
            <input
              type="text"
              value={searchProgramName}
              onChange={(e) => {
                setSearchProgramName(e.target.value)
                setProgramId("")
                setShowProgramDropdown(true)
              }}
              onFocus={() => setShowProgramDropdown(true)}
              onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
              placeholder="Tra cứu tên CTĐT..."
            />
            {showProgramDropdown && (
              <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                {programs.filter(p => p.name.toLowerCase().includes(searchProgramName.toLowerCase()) || searchProgramName === "Tất cả CTĐT").length === 0 ? (
                  <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy</div>
                ) : (
                  <>
                    <div 
                      onClick={() => {
                        setProgramId("");
                        setSearchProgramName("Tất cả CTĐT");
                        setShowProgramDropdown(false);
                      }}
                      className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${!programId ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                    >
                      Tất cả CTĐT
                    </div>
                    {programs.filter(p => searchProgramName === "Tất cả CTĐT" || p.name.toLowerCase().includes(searchProgramName.toLowerCase())).map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setProgramId(p.id);
                          setSearchProgramName(p.name);
                          setShowProgramDropdown(false);
                        }}
                        className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${programId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                      >
                        {p.name}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FolderTree size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Tiêu chuẩn</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalStandards}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Tiêu chí</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalCriteria}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <FileCheck size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Tổng Minh chứng</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalItems}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowRight size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Tiến độ nộp</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.submittedCount}</h3>
                  <span className="text-sm text-slate-400">/ {stats.totalItems}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Tiến độ theo Tiêu chuẩn</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Đã nộp" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Chưa nộp" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Trạng thái Minh chứng</h3>
              <div className="h-80 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-800 dark:text-white">Chi tiết trạng thái minh chứng</h3>
              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="UNSUBMITTED">Chưa nộp</option>
                <option value="PENDING">Đã nộp</option>
                <option value="REVIEWING">Chờ duyệt</option>
                <option value="APPROVED">Đạt</option>
                <option value="REJECTED">Không đạt</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3">Tiêu chuẩn / Tiêu chí</th>
                    <th className="px-4 py-3">Tên minh chứng</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Người nộp</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentItems.map(({ standard, criterion, item, isFirstInCriterion }, index) => {
                    const evidence = item.evidences?.[0]
                    const statusKey = evidence ? evidence.status : "UNSUBMITTED"
                    const showNames = isFirstInCriterion || index === 0;
                    
                    const baseUrl = role === "SUPERVISOR" ? "/supervisor/evidence" : "/collaborator/evidence";
                    const evidenceLink = `${baseUrl}?action=create&standardId=${standard.id}&criterionId=${criterion.id}&itemId=${item.id}&type=${standard.type || 'INSTITUTIONAL'}&programId=${standard.programId || ''}&year=${standard.year || ''}`;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          {showNames ? (
                            <div>
                              <div className="font-semibold text-slate-700 dark:text-slate-300">{standard.name}</div>
                              <div className="text-slate-500">{criterion.name}</div>
                            </div>
                          ) : (
                            <div className="text-slate-500">{criterion.name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span 
                            className="px-2.5 py-1 text-xs font-semibold rounded-full"
                            style={{ 
                              backgroundColor: `${STATUS_COLORS[statusKey]}20`, 
                              color: STATUS_COLORS[statusKey] 
                            }}
                          >
                            {STATUS_LABELS[statusKey]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{evidence?.collaborator?.name || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          {statusKey === "UNSUBMITTED" || statusKey === "REJECTED" ? (
                            <Link 
                              href={evidenceLink}
                              className="inline-flex text-xs items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap"
                            >
                              Nộp ngay
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400 whitespace-nowrap">Đã nộp</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {flattenedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Không có dữ liệu phù hợp</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, flattenedItems.length)} trong số {flattenedItems.length} minh chứng
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    Trước
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
