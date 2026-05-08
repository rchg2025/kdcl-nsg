const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({ where: { departmentId: { not: null } } })
  console.log("User department:", user.departmentId)

  const itemsFilter = {
    where: {
      OR: [
        {
          sharedFromId: null,
          OR: [
            { departments: { none: {} } },
            { departments: { some: { id: user.departmentId } } }
          ]
        },
        {
          sharedFrom: {
            OR: [
              { departments: { none: {} } },
              { departments: { some: { id: user.departmentId } } }
            ]
          }
        }
      ]
    }
  }

  const items = await prisma.evidenceItem.findMany({
    where: itemsFilter.where,
    select: { id: true, name: true, sharedFromId: true, departments: { select: { name: true } } }
  })
  
  console.log(items.length, "items found")
  const badItem = items.find(i => i.name.includes("1.1.18"))
  if (badItem) {
    console.log("Found bad item:", JSON.stringify(badItem, null, 2))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
