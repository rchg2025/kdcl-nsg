const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.evidenceItem.findMany({
    where: { name: { contains: '4.3.01' } },
    select: {
      id: true,
      name: true,
      sharedFromId: true,
      criterion: { select: { name: true } }
    }
  });
  console.log(JSON.stringify(items, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
