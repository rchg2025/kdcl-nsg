"use client"

import { useState } from "react"
import { evaluateEvidence } from "@/actions/investigator"
import { Loader2, Search, CheckSquare, XSquare, FileText } from "lucide-react"

export default function ClientInvestigateList({ initialEvidences }: { initialEvidences: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [commentInput, setCommentInput] = useState<Record<string, string>>({})

  const handleEvaluate = async (id: string, isApproved: boolean) => {
    setLoadingId(id)
    try {
      await evaluateEvidence({ 
        evidenceId: id, 
        isApproved, 
        comments: commentInput[id] || "Không có phản hồi thêm" 
      })
      alert("Đã gửi phản hồi đánh giá thành công!")
      window.location.reload()
    } catch (err) {
      alert("Đã xảy ra lỗi khi gửi đánh giá")
      setLoadingId(null)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6">
        {initialEvidences.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Không tìm thấy minh chứng</h3>
            <p className="text-slate-500 mt-2">Chưa có minh chứng nào được duyệt bởi cấp giám sát.</p>
          </div>
        ) : (
          initialEvidences.map((ev) => {
            const hasEvaluated = ev.evaluations?.length > 0;
            const evalData = hasEvaluated ? ev.evaluations[0] : null;

            return (
              <div key={ev.id} className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col lg:flex-row gap-8">
                  
                  {/* Cột thông tin minh chứng */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-md uppercase mb-2 inline-block">
                        {ev.criterion.standard.year} - {ev.criterion.standard.name}
                      </span>
                      <h3 className="font-bold text-xl text-[var(--foreground)] mt-1">{ev.criterion.name}</h3>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Báo cáo của Cơ sở:</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {ev.content}
                      </p>
                      
                      {ev.fileUrl && (
                        <a href={ev.fileUrl} target="_blank" className="mt-4 inline-flex items-center gap-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-[var(--primary)] font-semibold hover:shadow-md transition-shadow">
                          <Search size={16} /> Kiểm tra Hồ sơ Gốc
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Cột đánh giá */}
                  <div className="w-full lg:w-96 bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="font-bold text-[var(--foreground)] flex items-center gap-2 mb-4">
                      <CheckSquare size={18} className="text-[var(--primary)]" /> Khung Đánh Giá
                    </h4>
                    
                    {hasEvaluated ? (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl border-2 ${evalData.isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300'}`}>
                          <p className="font-bold mb-1 flex items-center gap-2">
                            {evalData.isApproved ? <CheckSquare size={18} /> : <XSquare size={18} />}
                            {evalData.isApproved ? 'KẾT LUẬN: ĐẠT' : 'KẾT LUẬN: KHÔNG ĐẠT'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Nhận xét của Điều tra viên:</p>
                          <p className="text-sm p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">{evalData.comments}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <textarea
                          placeholder="Nhập nhận xét / phản hồi của đoàn kiểm tra..."
                          value={commentInput[ev.id] || ""}
                          onChange={(e) => setCommentInput({ ...commentInput, [ev.id]: e.target.value })}
                          className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-[var(--primary)] min-h-[100px]"
                        />
                        
                        <div className="flex gap-2">
                          <button 
                            disabled={loadingId === ev.id}
                            onClick={() => handleEvaluate(ev.id, false)}
                            className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 text-red-700 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            Không đạt
                          </button>
                          <button 
                            disabled={loadingId === ev.id}
                            onClick={() => handleEvaluate(ev.id, true)}
                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                          >
                            {loadingId === ev.id ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />} 
                            Đạt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}
