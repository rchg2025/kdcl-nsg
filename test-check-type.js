const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const u = await p.user.findUnique({
    where: { email: 'phamminh@nsg.edu.vn' },
    select: { id: true, departmentId: true, department: { select: { name: true } } }
  })
  console.log('User dept:', u.department?.name, '| ID:', u.departmentId)

  const deptId = u.departmentId

  // Count all standards by type
  const allStandards = await p.standard.findMany({
    select: { id: true, name: true, type: true, year: true, _count: { select: { criteria: true } } }
  })
  console.log('\n=== ALL STANDARDS IN DB ===')
  allStandards.forEach(s => {
    console.log(`  [${s.year}][${s.type}] ${s.name} (${s._count.criteria} criteria)`)
  })

  // Check INSTITUTIONAL items with NO department (these match getNoDeptCondition)
  const instItemsNoDept = await p.evidenceItem.findMany({
    where: {
      departments: { none: {} },
      criterion: { standard: { type: 'INSTITUTIONAL' } }
    },
    select: {
      id: true, name: true, sharedFromId: true,
      criterion: { select: { name: true, standard: { select: { name: true, year: true, type: true } } } },
      sharedFrom: { select: { name: true, departments: { select: { name: true } } } }
    }
  })
  console.log('\n=== INSTITUTIONAL ITEMS WITH NO DEPARTMENT ===')
  console.log('Count:', instItemsNoDept.length)
  instItemsNoDept.forEach(i => {
    const sf = i.sharedFrom ? `sharedFrom: ${i.sharedFrom.name} (depts: ${i.sharedFrom.departments.map(d => d.name).join(', ') || 'none'})` : 'ROOT'
    console.log(`  - ${i.name} | ${sf}`)
    console.log(`    Standard: [${i.criterion.standard.year}] ${i.criterion.standard.name}`)
  })

  // Check INSTITUTIONAL items assigned to this department
  const instItemsDept = await p.evidenceItem.findMany({
    where: {
      departments: { some: { id: deptId } },
      criterion: { standard: { type: 'INSTITUTIONAL' } }
    },
    select: { id: true, name: true }
  })
  console.log('\n=== INSTITUTIONAL ITEMS ASSIGNED TO THIS DEPT ===')
  console.log('Count:', instItemsDept.length)
  instItemsDept.forEach(i => console.log(`  - ${i.name}`))

  // Check INSTITUTIONAL items via sharedFrom chain to this department
  const instItemsShared = await p.evidenceItem.findMany({
    where: {
      criterion: { standard: { type: 'INSTITUTIONAL' } },
      OR: [
        { sharedFrom: { departments: { some: { id: deptId } } } },
        { sharedFrom: { sharedFrom: { departments: { some: { id: deptId } } } } },
      ]
    },
    select: {
      id: true, name: true,
      criterion: { select: { name: true, standard: { select: { name: true } } } },
      sharedFrom: { select: { name: true, departments: { select: { name: true } } } }
    }
  })
  console.log('\n=== INSTITUTIONAL ITEMS VIA SHAREDFROM TO THIS DEPT ===')
  console.log('Count:', instItemsShared.length)
  instItemsShared.forEach(i => {
    console.log(`  - ${i.name} | sharedFrom: ${i.sharedFrom?.name} (${i.sharedFrom?.departments.map(d => d.name).join(', ')})`)
  })

  // Now simulate EXACTLY what the API does for "all types" (no type filter)
  const hasDept = {
    OR: [
      { departments: { some: { id: deptId } } },
      { sharedFrom: { departments: { some: { id: deptId } } } },
      { sharedFrom: { sharedFrom: { departments: { some: { id: deptId } } } } },
      { sharedFrom: { sharedFrom: { sharedFrom: { departments: { some: { id: deptId } } } } } },
      { sharedFrom: { sharedFrom: { sharedFrom: { sharedFrom: { departments: { some: { id: deptId } } } } } } }
    ]
  }

  const getNoDeptCondition = (levels) => {
    if (levels === 0) return { departments: { none: {} } }
    return {
      departments: { none: {} },
      OR: [
        { sharedFromId: null },
        { sharedFrom: getNoDeptCondition(levels - 1) }
      ]
    }
  }

  const itemsWhere = { OR: [hasDept, getNoDeptCondition(5)] }

  // Count how many items match itemsWhere for each type
  const matchingItemsAll = await p.evidenceItem.count({ where: itemsWhere })
  const matchingItemsInst = await p.evidenceItem.count({ 
    where: { ...itemsWhere, criterion: { standard: { type: 'INSTITUTIONAL' } } } 
  })
  const matchingItemsProg = await p.evidenceItem.count({ 
    where: { ...itemsWhere, criterion: { standard: { type: 'PROGRAM' } } } 
  })
  
  console.log('\n=== ITEMS MATCHING itemsWhere (what API returns) ===')
  console.log('ALL types:', matchingItemsAll)
  console.log('INSTITUTIONAL:', matchingItemsInst)
  console.log('PROGRAM:', matchingItemsProg)

  // List the INSTITUTIONAL ones
  if (matchingItemsInst > 0) {
    const instMatches = await p.evidenceItem.findMany({
      where: { ...itemsWhere, criterion: { standard: { type: 'INSTITUTIONAL' } } },
      select: { 
        id: true, name: true,
        departments: { select: { name: true } },
        sharedFromId: true,
        criterion: { select: { name: true, standard: { select: { name: true, year: true } } } }
      }
    })
    console.log('\nINSTITUTIONAL items details:')
    instMatches.forEach(i => {
      const depts = i.departments.map(d => d.name).join(', ') || 'NONE'
      console.log(`  - ${i.name} | depts: ${depts} | shared: ${i.sharedFromId ? 'yes' : 'no'}`)
      console.log(`    Standard: [${i.criterion.standard.year}] ${i.criterion.standard.name}`)
    })
  }
}

main().catch(console.error).finally(() => p.$disconnect())
