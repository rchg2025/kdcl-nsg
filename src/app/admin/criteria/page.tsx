import { getStandards } from "@/actions/standard"
import ClientCriteriaList from "./ClientCriteriaList"

export default async function CriteriaPage() {
  const standards = await getStandards()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Tiêu chuẩn & Tiêu chí</h1>
          <p className="text-slate-500 mt-1">Quản lý danh mục kiểm định chất lượng theo năm</p>
        </div>
      </div>
      
      <ClientCriteriaList initialStandards={standards} />
    </div>
  )
}
