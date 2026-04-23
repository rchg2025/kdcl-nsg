import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import StatisticsDashboard from "@/components/statistics/StatisticsDashboard"

export default async function CollaboratorStatisticsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "COLLABORATOR"].includes(session.user.role as string)) {
    // Note: Admin can access collaborator dashboard via menu
    redirect("/login")
  }

  const programs = await prisma.program.findMany({ 
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  return <StatisticsDashboard role="COLLABORATOR" programs={programs} />
}
