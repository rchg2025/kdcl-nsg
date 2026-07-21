import { Suspense } from "react"
import { getStandards } from "@/actions/standard"
import { getPrograms } from "@/actions/category"
import { getAllEvidenceItemsForSharing } from "@/actions/criterion"
import ClientCriteriaList from "./ClientCriteriaList"

export default function CriteriaPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Tiêu chí, Tiêu chuẩn và Minh chứng</h1>
          <p className="text-slate-500 mt-1">Quản lý danh mục kiểm định chất lượng theo năm</p>
        </div>
      </div>
      <Suspense fallback={<div className="w-full flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
        <CriteriaDataWrapper />
      </Suspense>
    </div>
  )
}

async function CriteriaDataWrapper() {
  const [standards, programs, allEvidenceItems] = await Promise.all([
    getStandards(),
    getPrograms(),
    getAllEvidenceItemsForSharing()
  ])
  return <ClientCriteriaList initialStandards={standards} initialPrograms={programs} allEvidenceItems={allEvidenceItems} />
}
