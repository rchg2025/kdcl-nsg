const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const item = await prisma.evidenceItem.findUnique({
    where: { id: "cmo9ieotk00074o5k4cn1e51s" },
    include: { departments: true }
  })
  console.log("Original item departments:", item.departments.map(d => d.name))
}

main().catch(console.error).finally(() => prisma.$disconnect())
