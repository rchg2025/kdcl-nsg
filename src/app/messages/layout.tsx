import Sidebar, { adminMenu, supervisorMenu, collaboratorMenu, investigatorMenu } from "@/components/layout/Sidebar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  const role = session.user.role as string
  let menu = collaboratorMenu
  if (role === "ADMIN") menu = adminMenu
  if (role === "SUPERVISOR") menu = supervisorMenu
  if (role === "INVESTIGATOR") menu = investigatorMenu

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar menuItems={menu} role={role} />
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  )
}

