const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@localhost.com' },
    update: {},
    create: {
      email: 'admin@localhost.com',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log('Seed successful: Admin user created/updated.', admin.email)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
