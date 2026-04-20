import { prisma } from "@/lib/prisma"
import { getUserPermissions } from "@/actions/permission"
import { getStandards } from "@/actions/standard"
import ClientPermissionMatrix from "./ClientPermissionMatrix"
import { checkAdmin } from "@/actions/user"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function PermissionMatrixPage({ params }: { params: { userId: string } }) {
  await checkAdmin()
  const user = await prisma.user.findUnique({ where: { id: params.userId } })
  if (!user) return <div>Không tìm thấy User</div>

  const permissions = await getUserPermissions(user.id)
  const standards = await getStandards()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex items-center gap-4">
         <Link href="/admin/users">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft size={20} />
            </button>
         </Link>
         <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Ma trận Phân quyền Cá nhân</h1>
            <p className="text-slate-500 mt-1">Cán bộ: <span className="font-bold text-indigo-500">{user.name}</span></p>
         </div>
       </div>

       <ClientPermissionMatrix userId={user.id} userRole={user.role} initialPermissions={permissions} standards={standards as any} />
    </div>
  )
}
