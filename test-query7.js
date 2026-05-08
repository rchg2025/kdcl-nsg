const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const prisma = new PrismaClient()

async function main() {
  const deptMatch = {
    OR: [
      { departments: { none: {} } },
      { departments: { some: { name: { contains: "Tổ chức" } } } }
    ]
  }

  const items = await prisma.evidenceItem.findMany({
    where: {
      name: { contains: "1.1.18" },
      OR: [
        { sharedFromId: null, ...deptMatch },
        { sharedFrom: { sharedFromId: null, ...deptMatch } },
        { sharedFrom: { sharedFrom: { sharedFromId: null, ...deptMatch } } },
        { sharedFrom: { sharedFrom: { sharedFrom: { sharedFromId: null, ...deptMatch } } } },
        { sharedFrom: { sharedFrom: { sharedFrom: { sharedFrom: { ...deptMatch } } } } }
      ]
    },
    include: { departments: true, sharedFrom: { include: { departments: true } } }
  })
  
  fs.writeFileSync('output.json', JSON.stringify(items, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
