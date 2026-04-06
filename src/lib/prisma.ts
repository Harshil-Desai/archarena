import { PrismaClient } from '@prisma/client'

// ← Add this import for your DB
import { PrismaPg } from '@prisma/adapter-pg'   // change to PrismaMySql / PrismaSQLite if needed

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString })   // change adapter name if needed

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,                    // ← THIS IS THE FIX
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma