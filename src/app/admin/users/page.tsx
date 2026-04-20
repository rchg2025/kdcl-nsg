import { getUsers } from "@/actions/user"
import ClientUserList from "./ClientUserList"

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Quản lý Thành viên</h1>
          <p className="text-slate-500 mt-1">Phân quyền, giám sát các thành viên trong hệ thống</p>
        </div>
      </div>
      
      <ClientUserList initialUsers={users} />
    </div>
  )
}
