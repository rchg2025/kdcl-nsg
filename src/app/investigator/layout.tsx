import { ReactNode } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar, { investigatorMenu } from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"

export default async function InvestigatorLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session || !["ADMIN", "INVESTIGATOR"].includes(session.user.role as string)) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <div className="hidden md:block">
        <Sidebar menuItems={investigatorMenu} role="Điều tra viên" />
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
