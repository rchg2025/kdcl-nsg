import { getDepartments, getPositions, getPrograms } from "@/actions/category"
import ClientCategoryList from "@/app/admin/categories/ClientCategoryList"

export default async function SupervisorCategoriesPage() {
  const [departments, positions, programs] = await Promise.all([
    getDepartments(),
    getPositions(),
    getPrograms()
  ])
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Quản lý Danh mục Từ điển</h1>
        <p className="text-slate-500 mt-1">Quản lý cơ cấu Tổ chức, Chức vụ và Ngành học trong trường.</p>
      </div>
      <ClientCategoryList initialDepartments={departments} initialPositions={positions} initialPrograms={programs} />
    </div>
  )
}
