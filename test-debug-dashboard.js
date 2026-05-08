const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'phamminh@nsg.edu.vn' },
    select: { id: true, name: true, departmentId: true, department: { select: { name: true } } }
  })
  console.log('=== USER ===')
  console.log(JSON.stringify(user, null, 2))

  const deptId = user.departmentId
  
  // 1. Check user permissions
  const permissions = await prisma.userPermission.findMany({
    where: { userId: user.id, permissionType: 'CRITERION' }
  })
  console.log('\n=== USER PERMISSIONS (CRITERION) ===')
  console.log('Count:', permissions.length)
  if (permissions.length > 0) {
    console.log(JSON.stringify(permissions, null, 2))
  }

  // 2. Items directly assigned to department
  const directItems = await prisma.evidenceItem.findMany({
    where: { departments: { some: { id: deptId } } },
    select: { 
      id: true, name: true, sharedFromId: true,
      criterion: { select: { name: true, standard: { select: { name: true, year: true } } } },
      departments: { select: { name: true } }
    }
  })
  console.log('\n=== ITEMS DIRECTLY ASSIGNED TO DEPARTMENT ===')
  console.log('Count:', directItems.length)
  directItems.forEach(item => {
    console.log(`  - [${item.criterion.standard.year}] ${item.criterion.standard.name} > ${item.criterion.name} > ${item.name}`)
    console.log(`    Depts: ${item.departments.map(d => d.name).join(', ')} | sharedFromId: ${item.sharedFromId}`)
  })

  // 3. Items where sharedFrom is assigned to department (1 level deep)
  const sharedLevel1 = await prisma.evidenceItem.findMany({
    where: { sharedFrom: { departments: { some: { id: deptId } } } },
    select: { 
      id: true, name: true, sharedFromId: true,
      criterion: { select: { name: true, standard: { select: { name: true, year: true } } } },
      departments: { select: { name: true } },
      sharedFrom: { select: { name: true, departments: { select: { name: true } } } }
    }
  })
  console.log('\n=== ITEMS VIA sharedFrom (1 level) ===')
  console.log('Count:', sharedLevel1.length)
  sharedLevel1.forEach(item => {
    console.log(`  - [${item.criterion.standard.year}] ${item.criterion.name} > ${item.name}`)
    console.log(`    Own depts: ${item.departments.map(d => d.name).join(', ') || 'none'} | sharedFrom: ${item.sharedFrom?.name} (depts: ${item.sharedFrom?.departments.map(d => d.name).join(', ')})`)
  })

  // 4. Items with NO department (available to everyone)
  const noDeptItems = await prisma.evidenceItem.findMany({
    where: { 
      departments: { none: {} },
      sharedFromId: null  // root items with no dept
    },
    select: { 
      id: true, name: true,
      criterion: { select: { name: true, standard: { select: { name: true, year: true } } } }
    },
    take: 10
  })
  console.log('\n=== ROOT ITEMS WITH NO DEPARTMENT (sample) ===')
  console.log('Count:', noDeptItems.length)
  noDeptItems.forEach(item => {
    console.log(`  - [${item.criterion.standard.year}] ${item.criterion.name} > ${item.name}`)
  })

  // 5. Simulate the statistics page query
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

  const itemsWhere = {
    OR: [hasDept, getNoDeptCondition(5)]
  }

  const allowedCriterionIds = permissions.map(p => p.resourceId)
  
  const criteriaWhere = {
    OR: [
      { id: { in: allowedCriterionIds } },
      { items: { some: itemsWhere } }
    ]
  }

  const standards = await prisma.standard.findMany({
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
    select: {
      id: true, name: true, year: true, type: true,
      criteria: {
        where: criteriaWhere,
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true,
          items: {
            where: itemsWhere,
            orderBy: { createdAt: 'asc' },
            select: {
              id: true, name: true,
              departments: { select: { id: true, name: true } },
              evidences: {
                where: { collaborator: { departmentId: deptId } },
                take: 1,
                select: { id: true, status: true }
              }
            }
          }
        }
      }
    }
  })

  // Filter like the statistics API does
  const result = standards.map(s => ({
    ...s,
    criteria: s.criteria.map(c => ({
      ...c,
      items: c.items || []
    })).filter(c => c.items.length > 0)
  })).filter(s => s.criteria.length > 0)

  console.log('\n=== SIMULATED STATISTICS PAGE RESULT ===')
  let totalItems = 0
  result.forEach(std => {
    console.log(`\n[${std.year}] ${std.name} (${std.type})`)
    std.criteria.forEach(c => {
      console.log(`  Criterion: ${c.name} (${c.items.length} items)`)
      c.items.forEach(item => {
        totalItems++
        const depts = item.departments.map(d => d.name).join(', ') || 'Không có đơn vị'
        const hasEvidence = item.evidences.length > 0 ? `✓ ${item.evidences[0].status}` : '✗ Chưa nộp'
        console.log(`    - ${item.name} | Đơn vị: ${depts} | ${hasEvidence}`)
      })
    })
  })
  console.log(`\nTOTAL ITEMS shown on statistics page: ${totalItems}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
