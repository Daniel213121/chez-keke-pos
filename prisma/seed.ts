import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const defaults = ['Supplies', 'Utilities', 'Wages', 'Maintenance', 'Other']

  for (const name of defaults) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name, isDefault: true },
    })
  }

  console.log('Seeded expense categories:', defaults.join(', '))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
