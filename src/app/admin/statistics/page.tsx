import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import StatisticsDashboard from "@/components/statistics/StatisticsDashboard"

export default async function AdminStatisticsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const programs = await prisma.program.findMany({ 
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  return <StatisticsDashboard role="ADMIN" programs={programs} />
}
