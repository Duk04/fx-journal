import { PrismaClient } from '@prisma/client'
import { scryptSync, randomBytes } from 'crypto'

const prisma = new PrismaClient()

function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex')
  return salt + ':' + scryptSync(pw, salt, 64).toString('hex')
}

async function main() {
  const count = await prisma.user.count()
  if (count > 0) {
    console.log('Users already exist, skipping seed.')
    return
  }

  const users = [
    { username: process.env.USER1_NAME ?? 'trader1', password: process.env.USER1_PASS ?? 'pass1' },
    { username: process.env.USER2_NAME ?? 'trader2', password: process.env.USER2_PASS ?? 'pass2' },
  ]

  for (const u of users) {
    await prisma.user.create({
      data: { username: u.username, passwordHash: hashPassword(u.password) },
    })
    console.log(`Created user: ${u.username}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
