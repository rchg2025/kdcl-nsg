"use client"

import { useState } from "react"
import { Search, Download, Filter } from "lucide-react"
import * as XLSX from "xlsx"

export default function DetailedSupervisorStats({ detailedStats }: { detailedStats: any[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL") // "ALL", "APPROVED", "REJECTED", "PENDING"

  // Advanced Filtering
  const filteredStats = detailedStats.filter(stat => {
    const matchSearch = stat.criterionName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        stat.standardName.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchStatus = true
    if (statusFilter === "APPROVED") matchStatus = stat.approved > 0
    if (statusFilter === "PENDING") matchStatus = stat.pending > 0
    if (statusFilter === "REJECTED") matchStatus = stat.rejected > 0 || stat.investigatorRejected > 0

    return matchSearch && matchStatus
  })

  // Export to Excel
  const handleExportExcel = () => {
    // Transform data for excel
    const excelData: Record<string, any>[] = []
    
    // Summary
    filteredStats.forEach(stat => {
      // Add summary row for the criterion
      excelData.push({
        "Tiêu chí": stat.standardName,
        "Tiêu/Tên minh chứng": `[Tổng hợp] ${stat.criterionName}`,
        "Tình trạng (Khái quát)": `Tổng: ${stat.total} | Chờ GSV: ${stat.pending} | GSV Không đạt: ${stat.rejected} | GSV Duyệt: ${stat.approved} | ĐTV Đạt: ${stat.investigatorApproved} | ĐTV Không đạt: ${stat.investigatorRejected}`
      })
      
      // Add individual evidence rows
      if (stat.rawEvidences && Array.isArray(stat.rawEvidences)) {
        stat.rawEvidences.forEach((ev: any, idx: number) => {
           let statusText = "Chờ duyệt"
           if (ev.status === "APPROVED") statusText = "GSV Đã duyệt"
           if (ev.status === "REJECTED") statusText = "GSV Không đạt"
           if (ev.status === "REVIEWING") statusText = "GSV Đang xem xét"
           
           excelData.push({
             "Tiêu chí": "",
             "Tiêu/Tên minh chứng": `   ${idx + 1}. ${ev.itemName}`,
             "Tình trạng (Khái quát)": `${statusText} - Điều tra viên: ${ev.invEval}`
           })
        })
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Thong_Ke_Minh_Chung")
    XLSX.writeFile(workbook, `ThongKeMC_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header and Controls */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Chi tiết Báo cáo & Đánh giá</h3>
          <p className="text-sm text-slate-500 mt-1">Sơ lược tình hình nộp và kiểm tra chéo theo tiêu chuẩn</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-[250px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo tên tiêu chí/tiêu chuẩn..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-sm"
            />
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium"
            >
              <option value="ALL">Tất cả tình trạng</option>
              <option value="APPROVED">Có hồ sơ đã duyệt</option>
              <option value="PENDING">Đang chờ xử lý</option>
              <option value="REJECTED">Có báo cáo bị không đạt</option>
            </select>
          </div>

          <button 
            onClick={handleExportExcel}
            className="w-full sm:w-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <Download size={16} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-5 py-4 w-[250px] max-w-[250px]">Tiêu chí</th>
              <th className="px-5 py-4 w-[300px] max-w-[300px]">Tiêu chuẩn</th>
              <th className="px-5 py-4 text-center">Tổng HS</th>
              <th className="px-5 py-4 text-center">GSV Chờ Duyệt (Mới / Sửa)</th>
              <th className="px-5 py-4 text-center">GSV Không đạt</th>
              <th className="px-5 py-4 text-center">GSV Duyệt<br/><span className="text-[9px] font-medium text-slate-400">(Chờ ĐTV)</span></th>
              <th className="px-5 py-4 text-center text-emerald-600">ĐTV Đạt</th>
              <th className="px-5 py-4 text-center text-red-500">ĐTV<br/>K. Đạt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-slate-500">Không tìm thấy dữ liệu thống kê nào</td>
              </tr>
            ) : (
              filteredStats.map((stat, idx) => (
                <tr key={stat.criterionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4" title={stat.standardName}>
                    <div className="font-semibold text-xs whitespace-normal line-clamp-2">{stat.standardName}</div>
                  </td>
                  <td className="px-5 py-4" title={stat.criterionName}>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-xs whitespace-normal line-clamp-2">{stat.criterionName}</div>
                  </td>
                  
                  <td className="px-5 py-4 text-center font-bold">{stat.total}</td>
                  <td className="px-5 py-4 text-center text-amber-500 font-bold">{stat.pending > 0 ? stat.pending : "-"}</td>
                  <td className="px-5 py-4 text-center text-orange-500 font-bold">{stat.rejected > 0 ? stat.rejected : "-"}</td>
                  <td className="px-5 py-4 text-center text-blue-500 font-bold">{stat.approved > 0 ? stat.approved : "-"}</td>
                  
                  <td className="px-5 py-4 text-center text-emerald-600 bg-emerald-50/30 dark:bg-emerald-900/10 font-bold">
                    {stat.investigatorApproved > 0 ? stat.investigatorApproved : "-"}
                  </td>
                  <td className="px-5 py-4 text-center text-red-500 bg-red-50/30 dark:bg-red-900/10 font-bold">
                    {stat.investigatorRejected > 0 ? stat.investigatorRejected : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
