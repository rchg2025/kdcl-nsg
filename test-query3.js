const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const items = await prisma.evidenceItem.findMany({
    where: { name: { contains: "1.1.18" } },
    include: { departments: true, sharedFrom: { include: { departments: true } } }
  })
  console.log(JSON.stringify(items, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
