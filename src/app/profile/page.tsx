import { getMyProfile } from "@/actions/profile"
import ClientProfile from "./ClientProfile"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ProfilePage() {
  const user = await getMyProfile()
  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-6">
         <Link href="/">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft size={20} />
            </button>
         </Link>
         <h1 className="text-2xl font-bold text-[var(--foreground)]">Thông tin Cá nhân</h1>
      </div>
      <ClientProfile user={user as any} />
    </div>
  )
}
