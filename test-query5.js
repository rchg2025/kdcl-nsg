const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const items = await prisma.evidenceItem.findMany({
    where: {
      name: { contains: "1.1.18" },
      OR: [
        {
          sharedFromId: null,
          OR: [
            { departments: { none: {} } },
            { departments: { some: { name: { contains: "Tổ chức" } } } }
          ]
        },
        {
          sharedFrom: {
            OR: [
              { departments: { none: {} } },
              { departments: { some: { name: { contains: "Tổ chức" } } } }
            ]
          }
        }
      ]
    },
    include: { departments: true, sharedFrom: { include: { departments: true } } }
  })
  
  console.log("Items matched:", items.length)
  if (items.length > 0) console.log(JSON.stringify(items[0], null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
