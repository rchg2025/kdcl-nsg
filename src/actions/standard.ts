"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createLog } from "@/actions/log"
import { AccreditationType } from "@prisma/client"

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }
}

export async function getStandards() {
  await checkAdmin()
  return await prisma.standard.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      year: true,
      type: true,
      programId: true,
      program: { select: { id: true, name: true } },
      criteria: {
        select: {
          id: true,
          name: true,
          description: true,
          standardId: true,
          items: {
            select: {
              id: true,
              name: true,
              description: true,
              criterionId: true,
              sharedFromId: true,
              sharedFrom: {
                select: {
                  name: true,
                  criterion: {
                    select: { name: true, standard: { select: { name: true, year: true } } }
                  }
                }
              },
              departments: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      _count: {
        select: { criteria: true }
      }
    },
    orderBy: { year: 'desc' }
  })
}

export async function createStandard(data: { name: string; description?: string; year: number, type?: any, programId?: string|null }) {
  await checkAdmin()
  const newStandard = await prisma.standard.create({ data })
  await createLog("CREATE", "Tiêu chí (Standard)", `Tạo tiêu chí: ${data.name} (${data.year})`)
  revalidatePath("/admin/criteria")
  return newStandard
}

export async function updateStandard(id: string, data: { name: string; description?: string; year: number, type?: any, programId?: string|null }) {
  await checkAdmin()
  const updatedStandard = await prisma.standard.update({
    where: { id },
    data
  })
  await createLog("UPDATE", "Tiêu chí (Standard)", `Cập nhật tiêu chí: ${data.name}`)
  revalidatePath("/admin/criteria")
  return updatedStandard
}

export async function deleteStandard(id: string) {
  await checkAdmin()
  const target = await prisma.standard.findUnique({ where: { id } })
  await prisma.standard.delete({ where: { id } })
  await createLog("DELETE", "Tiêu chí (Standard)", `Xóa tiêu chí: ${target?.name}`)
  revalidatePath("/admin/criteria")
  revalidatePath("/supervisor/criteria")
}

export async function cloneStandard(sourceId: string, data: { year: number, type: AccreditationType, programId?: string }) {
  await checkAdmin()
  
  const sourceStandard = await prisma.standard.findUnique({
    where: { id: sourceId },
    include: {
      criteria: {
        include: {
          items: true
        }
      }
    }
  })
  
  if (!sourceStandard) throw new Error("Không tìm thấy Tiêu chí nguồn!")

  const newStandard = await prisma.standard.create({
    data: {
      name: sourceStandard.name,
      description: sourceStandard.description,
      year: data.year,
      type: data.type,
      programId: data.type === 'PROGRAM' ? data.programId : null,
      criteria: {
        create: sourceStandard.criteria.map(crit => ({
          name: crit.name,
          description: crit.description,
          items: {
            create: crit.items.map(item => ({
              name: item.name,
              description: item.description
            }))
          }
        }))
      }
    }
  })

  await createLog("CREATE", "Tiêu chí (Standard)", `Nhân bản Tiêu chí: ${newStandard.name}`)
  revalidatePath("/admin/criteria")
  revalidatePath("/supervisor/criteria")
  
  return newStandard
}
