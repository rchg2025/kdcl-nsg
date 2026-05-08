const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const deptMatch = {
    OR: [
      { departments: { none: {} } },
      { departments: { some: { name: { contains: "Tổ chức" } } } }
    ]
  }

  const itemsFilter = {
    where: {
      OR: [
        { sharedFromId: null, ...deptMatch },
        { sharedFrom: { sharedFromId: null, ...deptMatch } },
        { sharedFrom: { sharedFrom: { sharedFromId: null, ...deptMatch } } },
        { sharedFrom: { sharedFrom: { sharedFrom: { sharedFromId: null, ...deptMatch } } } },
        { sharedFrom: { sharedFrom: { sharedFrom: { sharedFrom: { ...deptMatch } } } } }
      ]
    }
  }

  const items = await prisma.evidenceItem.findMany({
    where: {
      name: { contains: "1.1.18" },
      ...itemsFilter.where
    },
    include: { departments: true }
  })
  
  console.log("Items matched:", items.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
