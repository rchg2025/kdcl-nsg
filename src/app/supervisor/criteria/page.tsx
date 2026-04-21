import { getStandards } from "@/actions/standard"
import { getPrograms } from "@/actions/category"
import ClientCriteriaList from "@/app/admin/criteria/ClientCriteriaList"

export default async function SupervisorCriteriaPage() {
  const [standards, programs] = await Promise.all([
    getStandards(),
    getPrograms()
  ])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Cập nhật Tiêu chí & Tiêu chuẩn</h1>
          <p className="text-slate-500 mt-1">Giám sát viên cập nhật sửa đổi danh mục kiểm định</p>
        </div>
      </div>
      <ClientCriteriaList initialStandards={standards} initialPrograms={programs} />
    </div>
  )
}
