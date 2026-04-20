"use server"

import { prisma } from "@/lib/prisma"
import { checkAdmin } from "@/actions/user"
import { revalidatePath } from "next/cache"

export async function getUserPermissions(userId: string) {
  await checkAdmin()
  return await prisma.userPermission.findMany({ where: { userId } })
}

export async function updateMenuPermissions(userId: string, paths: string[]) {
  await checkAdmin()
  
  await prisma.userPermission.deleteMany({
    where: { userId, permissionType: "MENU" }
  })

  if (paths.length > 0) {
    await prisma.userPermission.createMany({
      data: paths.map(path => ({
        userId,
        permissionType: "MENU",
        resourceId: path,
        action: "VIEW"
      }))
    })
  }

  revalidatePath(`/admin/users/permissions/${userId}`)
}

export async function updateCriterionPermissions(userId: string, criterionIds: string[]) {
  await checkAdmin()
  
  await prisma.userPermission.deleteMany({
    where: { userId, permissionType: "CRITERION" }
  })

  if (criterionIds.length > 0) {
    await prisma.userPermission.createMany({
      data: criterionIds.map(id => ({
        userId,
        permissionType: "CRITERION",
        resourceId: id,
        action: "SUBMIT"
      }))
    })
  }
  
  revalidatePath(`/admin/users/permissions/${userId}`)
}
