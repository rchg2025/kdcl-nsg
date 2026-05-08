const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const items = await p.evidenceItem.findMany({
    where: { departments: { some: { name: { contains: 'Tổ chức' } } } },
    select: {
      name: true,
      criterion: { select: { standard: { select: { name: true, type: true, year: true } } } }
    }
  })
  
  const byType = {}
  items.forEach(i => {
    const t = i.criterion.standard.type
    byType[t] = (byType[t] || 0) + 1
  })
  console.log('Items directly assigned to dept by type:', byType)
  console.log('Total:', items.length)
  
  const inst = items.filter(i => i.criterion.standard.type === 'INSTITUTIONAL')
  console.log('\nINSTITUTIONAL items:', inst.length)
  inst.forEach(i => console.log('  -', i.name, `[${i.criterion.standard.year}] ${i.criterion.standard.name}`))
  
  const prog = items.filter(i => i.criterion.standard.type === 'PROGRAM')
  console.log('\nPROGRAM items:', prog.length)
  prog.forEach(i => console.log('  -', i.name, `[${i.criterion.standard.year}] ${i.criterion.standard.name}`))
}

main().catch(console.error).finally(() => p.$disconnect())
