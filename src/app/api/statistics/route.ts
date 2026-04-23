import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const yearStr = searchParams.get("year")
    const typeStr = searchParams.get("type")
    const programId = searchParams.get("programId")

    const role = session.user.role as string
    const userId = session.user.id
    const user = await prisma.user.findUnique({ where: { id: userId } })

    let standardsWhere: any = {}
    if (yearStr) standardsWhere.year = parseInt(yearStr)
    if (typeStr) standardsWhere.type = typeStr
    if (typeStr === "PROGRAM" && programId) {
      standardsWhere.programId = programId
    }

    let criteriaWhere: any = undefined
    let itemsWhere: any = undefined
    let evidenceWhere: any = {}

    if (role === "COLLABORATOR") {
      const permissions = await prisma.userPermission.findMany({
        where: { userId, permissionType: "CRITERION" }
      })
      const allowedCriterionIds = permissions.map(p => p.resourceId)

      criteriaWhere = {
        OR: [
          { id: { in: allowedCriterionIds } },
          ...(user?.departmentId ? [{
            items: {
              some: {
                departments: {
                  some: { id: user.departmentId }
                }
              }
            }
          }] : [])
        ]
      }

      if (user?.departmentId) {
        itemsWhere = {
          OR: [
            { departments: { none: {} } },
            { departments: { some: { id: user.departmentId } } }
          ]
        }
        evidenceWhere = {
          collaborator: { departmentId: user.departmentId }
        }
      } else {
        evidenceWhere = {
          collaboratorId: userId
        }
      }
    }

    const standards = await prisma.standard.findMany({
      where: standardsWhere,
      orderBy: [{ year: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        year: true,
        type: true,
        program: { select: { name: true } },
        criteria: {
          where: criteriaWhere,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            items: {
              where: itemsWhere,
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                name: true,
                evidences: {
                  where: evidenceWhere,
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    collaborator: { select: { name: true } },
                    reviewer: { select: { name: true } }
                  }
                }
              }
            }
          }
        }
      }
    })

    let result = standards
    if (role === "COLLABORATOR") {
      result = standards.map(s => ({
        ...s,
        criteria: s.criteria.map(c => ({
          ...c,
          items: c.items || []
        })).filter(c => c.items.length > 0)
      })).filter(s => s.criteria.length > 0)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Statistics API Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
