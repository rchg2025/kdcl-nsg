"use client"

import { useState } from "react"
import { FileText, Download, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"

export default function FileAttachments({ fileStr }: { fileStr: string | null }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  if (!fileStr) return null

  let files: { name: string, url: string }[] = []
  try {
    const parsed = JSON.parse(fileStr)
    if (Array.isArray(parsed)) {
      files = parsed
    } else {
      files = []
    }
  } catch {
    files = fileStr.split(", ").filter(url => url.trim().length > 0).map((url, i) => ({ name: `Tài liệu đính kèm ${i + 1}`, url }))
  }

  if (files.length === 0) return null

  const totalPages = Math.ceil(files.length / itemsPerPage)
  const paginatedFiles = files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {paginatedFiles.map((f, idx) => (
          <a
            key={idx}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg shrink-0 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={f.name}>{f.name}</h5>
              </div>
              <ExternalLink size={16} className="text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-500 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
            Trang {currentPage} / {totalPages} (Tổng {files.length})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-700 disabled:opacity-50 transition-colors"
            >
              Trang trước
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-700 disabled:opacity-50 transition-colors"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
