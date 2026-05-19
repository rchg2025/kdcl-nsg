const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const u = await p.user.findUnique({
    where: { email: 'phamminh@nsg.edu.vn' },
    select: { id: true, departmentId: true }
  })
  const deptId = u.departmentId

  // Check permissions
  const perms = await p.userPermission.findMany({
    where: { userId: u.id, permissionType: 'CRITERION' }
  })
  console.log('User permissions:', perms.length)

  // Build same query as statistics API
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
  const allowedIds = perms.map(pr => pr.resourceId)
  const criteriaWhere = {
    OR: [
      { id: { in: allowedIds } },
      { items: { some: itemsWhere } }
    ]
  }

  // Query WITHOUT type filter (all types)
  const stds = await p.standard.findMany({
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
    select: {
      id: true, name: true, year: true, type: true,
      criteria: {
        where: criteriaWhere,
        select: {
          id: true, name: true,
          items: {
            where: itemsWhere,
            select: { id: true, name: true }
          }
        }
      }
    }
  })

  // Apply same filter as API
  const result = stds.map(s => ({
    ...s,
    criteria: s.criteria.filter(c => c.items.length > 0)
  })).filter(s => s.criteria.length > 0)

  let totalItems = 0
  console.log('\n=== ALL TYPES (no filter) ===')
  result.forEach(s => {
    const itemCount = s.criteria.reduce((sum, c) => sum + c.items.length, 0)
    totalItems += itemCount
    console.log(`  [${s.year}][${s.type}] ${s.name} → ${s.criteria.length} criteria, ${itemCount} items`)
  })
  console.log('TOTAL items (all types):', totalItems)

  // Query WITH INSTITUTIONAL filter  
  const stdsInst = await p.standard.findMany({
    where: { type: 'INSTITUTIONAL' },
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
    select: {
      id: true, name: true, year: true, type: true,
      criteria: {
        where: criteriaWhere,
        select: {
          id: true, name: true,
          items: {
            where: itemsWhere,
            select: { id: true, name: true }
          }
        }
      }
    }
  })

  const resultInst = stdsInst.map(s => ({
    ...s,
    criteria: s.criteria.filter(c => c.items.length > 0)
  })).filter(s => s.criteria.length > 0)

  let totalInst = 0
  console.log('\n=== INSTITUTIONAL ONLY ===')
  resultInst.forEach(s => {
    const itemCount = s.criteria.reduce((sum, c) => sum + c.items.length, 0)
    totalInst += itemCount
    console.log(`  [${s.year}][${s.type}] ${s.name} → ${s.criteria.length} criteria, ${itemCount} items`)
    s.criteria.forEach(c => {
      c.items.forEach(i => {
        console.log(`    - ${i.name}`)
      })
    })
  })
  console.log('TOTAL items (INSTITUTIONAL):', totalInst)

  // Query WITH PROGRAM filter  
  const stdsProg = await p.standard.findMany({
    where: { type: 'PROGRAM' },
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
    select: {
      id: true, name: true, year: true, type: true,
      criteria: {
        where: criteriaWhere,
        select: {
          id: true, name: true,
          items: {
            where: itemsWhere,
            select: { id: true, name: true }
          }
        }
      }
    }
  })

  const resultProg = stdsProg.map(s => ({
    ...s,
    criteria: s.criteria.filter(c => c.items.length > 0)
  })).filter(s => s.criteria.length > 0)

  let totalProg = 0
  console.log('\n=== PROGRAM ONLY ===')
  resultProg.forEach(s => {
    const itemCount = s.criteria.reduce((sum, c) => sum + c.items.length, 0)
    totalProg += itemCount
    console.log(`  [${s.year}][${s.type}] ${s.name} → ${s.criteria.length} criteria, ${itemCount} items`)
  })
  console.log('TOTAL items (PROGRAM):', totalProg)
}

main().catch(console.error).finally(() => p.$disconnect())
