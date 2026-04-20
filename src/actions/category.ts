"use server"

import { prisma } from "@/lib/prisma"
import { checkAdmin } from "./user" // Reusing checkAdmin assuming it exists there, but let's just write our own checkAdmin
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function verifyAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
}

// -- DEPARTMENTS --
export async function getDepartments() {
  await verifyAdmin()
  return await prisma.department.findMany({ orderBy: { name: 'asc' } })
}

export async function createDepartment(data: { name: string }) {
  await verifyAdmin()
  const val = await prisma.department.create({ data })
  revalidatePath("/admin/categories")
  revalidatePath("/admin/users")
  return val
}

export async function deleteDepartment(id: string) {
  await verifyAdmin()
  await prisma.department.delete({ where: { id } })
  revalidatePath("/admin/categories")
  revalidatePath("/admin/users")
}

// -- POSITIONS --
export async function getPositions() {
  await verifyAdmin()
  return await prisma.position.findMany({ orderBy: { name: 'asc' } })
}

export async function createPosition(data: { name: string }) {
  await verifyAdmin()
  const val = await prisma.position.create({ data })
  revalidatePath("/admin/categories")
  revalidatePath("/admin/users")
  return val
}

export async function deletePosition(id: string) {
  await verifyAdmin()
  await prisma.position.delete({ where: { id } })
  revalidatePath("/admin/categories")
  revalidatePath("/admin/users")
}
