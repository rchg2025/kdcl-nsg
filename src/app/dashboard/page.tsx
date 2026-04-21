import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }
  
  const role = session.user.role?.toLowerCase() || "collaborator"
  redirect(`/${role}`)
}
