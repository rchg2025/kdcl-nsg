"use client"

import { useState, useEffect } from "react"
import { getDashboardStats } from "@/actions/dashboard"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, ListTodo } from "lucide-react"
import DetailedSupervisorStats from "./DetailedSupervisorStats"

export default function StatCharts() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [yearList, setYearList] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("ALL")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const stats = await getDashboardStats(selectedYear === "all" ? undefined : parseInt(selectedYear), selectedType)
        setData(stats)
        if (selectedYear === "all" && selectedType === "ALL") {
           setYearList(stats.availableYears)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedYear, selectedType])

  if (loading && !data) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
        <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <TrendingUp className="text-indigo-500 shrink-0" />
          Thống kê Báo cáo Minh chứng
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
             <button onClick={() => setSelectedType("ALL")} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${selectedType === "ALL" ? "bg-white dark:bg-slate-700 shadow text-[var(--primary)]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Tất cả</button>
             <button onClick={() => setSelectedType("INSTITUTIONAL")} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${selectedType === "INSTITUTIONAL" ? "bg-white dark:bg-slate-700 shadow text-[var(--primary)]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Kiểm định Trường</button>
             <button onClick={() => setSelectedType("PROGRAM")} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${selectedType === "PROGRAM" ? "bg-white dark:bg-slate-700 shadow text-[var(--primary)]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Kiểm định Ngành</button>
          </div>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-medium text-sm"
          >
            <option value="all">Tất cả các năm học</option>
            {yearList.map(y => (
              <option key={y} value={y.toString()}>Năm học {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
         <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center"><ListTodo size={24} /></div>
            <div><p className="text-sm font-medium text-slate-500">Tổng số minh chứng</p><p className="text-2xl font-bold text-slate-800 dark:text-white">{data.summary.total}</p></div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-4 -mt-4 blur-xl"></div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center relative shrink-0"><CheckCircle2 size={24} /></div>
            <div className="relative"><p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 leading-tight">{data.userRole === "INVESTIGATOR" ? "ĐTV Đã đánh giá Đạt" : "Đã phê duyệt"}</p><p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{data.userRole === "INVESTIGATOR" ? data.summary.invApprovedCount : data.summary.approved}</p></div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-4 -mt-4 blur-xl"></div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center relative shrink-0"><Loader2 size={24} /></div>
            <div className="relative"><p className="text-sm font-medium text-amber-600 dark:text-amber-400 leading-tight">{data.userRole === "INVESTIGATOR" ? "Đang chờ ĐTV" : "Đang chờ duyệt"}</p><p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{data.userRole === "INVESTIGATOR" ? data.summary.invPendingCount : data.summary.pending}</p></div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-red-200 dark:border-red-800/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-4 -mt-4 blur-xl"></div>
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center relative shrink-0"><AlertTriangle size={24} /></div>
            <div className="relative"><p className="text-sm font-medium text-red-600 dark:text-red-400 leading-tight">{data.userRole === "INVESTIGATOR" ? "ĐTV Đã phân Không đạt" : "Bị không đạt"}</p><p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{data.userRole === "INVESTIGATOR" ? data.summary.invRejectedCount : data.summary.rejected}</p></div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6 text-center">Tỷ lệ Trạng thái Minh chứng</h3>
          <div className="h-[300px]">
             {data.statusData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={data.statusData}
                     cx="50%"
                     cy="50%"
                     innerRadius={80}
                     outerRadius={110}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {data.statusData.map((entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} />
                     ))}
                   </Pie>
                   <RechartsTooltip formatter={(value) => [`${value} hồ sơ`, 'Số lượng']} />
                   <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="flex h-full items-center justify-center text-slate-400">Trống</div>
             )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6 text-center">Phân bố & Tỉ lệ duyệt theo Tiêu chí</h3>
          <div className="h-[300px]">
             {data.standardData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.standardData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                   <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                   <YAxis tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                   <RechartsTooltip cursor={{fill: '#f1f5f9', opacity: 0.5}} />
                   <Legend />
                   <Bar dataKey="approved" name="Đã duyệt" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                   <Bar dataKey="pending" name="Chưa duyệt/Không đạt" stackId="a" fill="#fbd38d" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="flex h-full items-center justify-center text-slate-400">Trống</div>
             )}
          </div>
        </div>
      </div>

      <DetailedSupervisorStats detailedStats={data.detailedStats} />
    </div>
  )
}
