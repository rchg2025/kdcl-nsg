"use server"

import { prisma } from "@/lib/prisma"
import { checkAdmin } from "@/actions/user"
import { revalidatePath } from "next/cache"

export async function getSettings() {
  await checkAdmin()
  const settings = await prisma.systemSetting.findMany()
  const obj: Record<string, string> = {}
  settings.forEach(s => {
    obj[s.key] = s.value
  })
  return obj
}

export async function updateSettings(data: Record<string, string>) {
  await checkAdmin()
  
  const entries = Object.entries(data)
  for (const [key, value] of entries) {
    if (value) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    }
  }

  revalidatePath("/admin/settings")
  return true
}
