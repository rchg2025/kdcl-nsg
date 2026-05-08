const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const dept = await prisma.department.findFirst({ where: { name: { contains: "Tổ chức - hành chính" } } })
  console.log("Dept:", dept.id)

  const itemsFilter = {
    where: {
      OR: [
        {
          sharedFromId: null,
          OR: [
            { departments: { none: {} } },
            { departments: { some: { id: dept.id } } }
          ]
        },
        {
          sharedFrom: {
            OR: [
              { departments: { none: {} } },
              { departments: { some: { id: dept.id } } }
            ]
          }
        }
      ]
    }
  }

  const items = await prisma.evidenceItem.findMany({
    where: {
      name: { contains: "1.1.18" },
      ...itemsFilter.where
    },
    include: { departments: true, sharedFrom: { include: { departments: true } } }
  })
  
  console.log("Items matched:", items.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
