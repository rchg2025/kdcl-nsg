import { getDepartments, getPositions } from "@/actions/category"
import ClientCategoryList from "./ClientCategoryList"

export default async function CategoriesPage() {
  const [departments, positions] = await Promise.all([
    getDepartments(),
    getPositions()
  ])
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Quản lý Danh mục Từ điển</h1>
        <p className="text-slate-500 mt-1">Quản lý cơ cấu Tổ chức và Chức vụ trong trường.</p>
      </div>
      <ClientCategoryList initialDepartments={departments} initialPositions={positions} />
    </div>
  )
}
