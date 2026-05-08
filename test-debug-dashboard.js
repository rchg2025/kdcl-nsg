const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Find the collaborator user phamminh@nsg.edu.vn
  const user = await prisma.user.findUnique({
    where: { email: 'phamminh@nsg.edu.vn' },
    select: { id: true, name: true, email: true, role: true, departmentId: true, department: { select: { name: true } } }
  })
  console.log('=== USER ===')
  console.log(JSON.stringify(user, null, 2))

  if (!user) {
    console.log('User not found!')
    return
  }

  // Query 1: Dashboard approach - direct evidence query with collaborator.departmentId
  const dashboardEvidences = await prisma.evidence.findMany({
    where: user.departmentId
      ? { collaborator: { departmentId: user.departmentId } }
      : { collaboratorId: user.id },
    select: { id: true, status: true, collaborator: { select: { name: true } } }
  })
  console.log('\n=== DASHBOARD QUERY (collaborator.departmentId) ===')
  console.log('Total evidences found:', dashboardEvidences.length)
  if (dashboardEvidences.length > 0) {
    console.log('Sample:', JSON.stringify(dashboardEvidences.slice(0, 3), null, 2))
  }

  // Query 2: Statistics approach - through items/evidences
  const statsEvidences = await prisma.evidence.findMany({
    where: { collaborator: { departmentId: user.departmentId } },
    select: { id: true, status: true, collaboratorId: true, collaborator: { select: { name: true, departmentId: true } } }
  })
  console.log('\n=== STATS QUERY (same filter) ===')
  console.log('Total evidences found:', statsEvidences.length)

  // Query 3: All evidence for this user directly  
  const userEvidences = await prisma.evidence.findMany({
    where: { collaboratorId: user.id },
    select: { id: true, status: true }
  })
  console.log('\n=== USER DIRECT EVIDENCE ===')
  console.log('Evidences by this user:', userEvidences.length)
  
  // Query 4: All users in same department
  const deptUsers = await prisma.user.findMany({
    where: { departmentId: user.departmentId },
    select: { id: true, name: true, email: true, role: true }
  })
  console.log('\n=== USERS IN SAME DEPARTMENT ===')
  console.log(JSON.stringify(deptUsers, null, 2))

  // Query 5: All evidence from all users in same department
  const allDeptEvidence = await prisma.evidence.findMany({
    where: {
      collaborator: { departmentId: user.departmentId }
    },
    select: { id: true, status: true, collaboratorId: true }
  })
  console.log('\n=== ALL EVIDENCE IN DEPARTMENT ===')
  console.log('Total:', allDeptEvidence.length)
  const byStatus = {}
  allDeptEvidence.forEach(e => {
    byStatus[e.status] = (byStatus[e.status] || 0) + 1
  })
  console.log('By status:', byStatus)

  // Query 6: Check if there are evidence items assigned to this department
  const deptItems = await prisma.evidenceItem.findMany({
    where: { departments: { some: { id: user.departmentId } } },
    select: { id: true, name: true, evidences: { select: { id: true, status: true, collaboratorId: true }, take: 5 } }
  })
  console.log('\n=== EVIDENCE ITEMS ASSIGNED TO DEPARTMENT ===')
  console.log('Items count:', deptItems.length)
  let totalEvidencesFromItems = 0
  deptItems.forEach(item => {
    totalEvidencesFromItems += item.evidences.length
  })
  console.log('Total evidences from these items:', totalEvidencesFromItems)
  if (deptItems.length > 0) {
    console.log('Sample item:', JSON.stringify(deptItems[0], null, 2))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
