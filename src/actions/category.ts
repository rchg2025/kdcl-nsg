"use server"

import { prisma } from "@/lib/prisma"
import { checkAdmin } from "./user" // Reusing checkAdmin assuming it exists there, but let's just write our own checkAdmin
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createLog } from "@/actions/log"

async function verifyAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
}

export async function getDepartments() {
  await verifyAdmin()
  return await prisma.department.findMany({ orderBy: { name: 'asc' } })
}

export async function getAllDepartmentsPublic() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  return await prisma.department.findMany({ orderBy: { name: 'asc' } })
}

export async function createDepartment(data: { name: string }) {
  await verifyAdmin()
  const val = await prisma.department.create({ data })
  await createLog("CREATE", "Đơn vị (Department)", `Tạo mới đơn vị: ${data.name}`)
  revalidatePath("/admin/categories")
  revalidatePath("/admin/users")
  return val
}

export async function updateDepartment(id: string, data: { name: string }) {
  await verifyAdmin()
  const val = await prisma.department.update({ where: { id }, data })
  await createLog("UPDATE", "Đơn vị (Department)", `Cập nhật đơn vị: ${data.name}`)
  revalidatePath("/admin/categories")
  revalidatePath("/admin/users")
  return val
}

export async function deleteDepartment(id: string) {
  await verifyAdmin()
  const target = await prisma.department.findUnique({ where: { id } })
  await prisma.department.delete({ where: { id } })
  await createLog("DELETE", "Đơn vị (Department)", `Đã xóa đơn vị: ${target?.name}`)
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
  await createLog("CREATE", "Chức vụ (Position)", `Tạo mới chức vụ: ${data.name}`)
  revalidatePath("/admin/categories")
  revalidatePath("/admin/users")
  return val
}

export async function updatePosition(id: string, data: { name: string }) {
  await verifyAdmin()
  const val = await prisma.position.update({ where: { id }, data })
  await createLog("UPDATE", "Chức vụ (Position)", `Cập nhật chức vụ: ${data.name}`)
  revalidatePath("/admin/categories")
  revalidatePath("/admin/users")
  return val
}

export async function deletePosition(id: string) {
  await verifyAdmin()
  const target = await prisma.position.findUnique({ where: { id } })
  await prisma.position.delete({ where: { id } })
  await createLog("DELETE", "Chức vụ (Position)", `Đã xóa chức vụ: ${target?.name}`)
  revalidatePath("/admin/categories")
  revalidatePath("/admin/users")
}

// -- PROGRAMS --
export async function getPrograms() {
  await verifyAdmin()
  return await prisma.program.findMany({ include: { department: true }, orderBy: { name: 'asc' } })
}

export async function createProgram(data: { name: string, departmentId: string }) {
  await verifyAdmin()
  const val = await prisma.program.create({ data, include: { department: true } })
  await createLog("CREATE", "Đào tạo (Program)", `Tạo mới ngành: ${data.name}`)
  revalidatePath("/admin/categories")
  return val
}

export async function updateProgram(id: string, data: { name: string, departmentId: string }) {
  await verifyAdmin()
  const val = await prisma.program.update({ where: { id }, data, include: { department: true } })
  await createLog("UPDATE", "Đào tạo (Program)", `Cập nhật ngành: ${data.name}`)
  revalidatePath("/admin/categories")
  return val
}

export async function deleteProgram(id: string) {
  await verifyAdmin()
  const target = await prisma.program.findUnique({ where: { id } })
  await prisma.program.delete({ where: { id } })
  await createLog("DELETE", "Đào tạo (Program)", `Đã xóa ngành: ${target?.name}`)
  revalidatePath("/admin/categories")
}
