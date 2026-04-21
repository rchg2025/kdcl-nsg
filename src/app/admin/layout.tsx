import { ReactNode } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar, { adminMenu } from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <div className="z-50 shrink-0">
        <Sidebar menuItems={adminMenu} role="Quản trị viên" />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
