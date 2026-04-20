import { ReactNode } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar, { supervisorMenu, adminMenu } from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"

export default async function SupervisorLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session) redirect("/login")
  
  let allowed = ["ADMIN", "SUPERVISOR"].includes(session.user.role as string)
  if (!allowed) {
    const { prisma } = await import("@/lib/prisma")
    const perm = await prisma.userPermission.findFirst({
      where: { userId: session.user.id, permissionType: "MENU", resourceId: "/supervisor/review" }
    })
    if (perm) allowed = true
  }

  if (!allowed) {
    redirect("/login")
  }

  const menu = session.user.role === "ADMIN" ? adminMenu : supervisorMenu
  const roleName = session.user.role === "ADMIN" ? "Quản trị viên" : "Giám sát viên"

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <div className="hidden md:block">
        <Sidebar menuItems={menu} role={roleName} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
