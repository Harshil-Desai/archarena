import { prisma } from "./prisma"
import { LIMITS } from "./limits"

export async function checkAndIncrementDailyHints(
  userId: string,
  tier: "FREE" | "PRO" | "PREMIUM"
): Promise<{ allowed: boolean; remaining: number }> {
  const tierKey = tier === "PREMIUM" ? "pro" : tier.toLowerCase() as "free" | "pro"
  const dailyLimit = LIMITS[tierKey].aiHintsPerDay

  const now = new Date()
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Wrap reset + increment in a transaction to close the TOCTOU window
  // between concurrent requests (e.g. multiple browser tabs).
  return prisma.$transaction(async (tx) => {
    // Reset if window expired
    await tx.user.updateMany({
      where: { id: userId, dailyLimitResetAt: { lt: cutoff } },
      data: { dailyHintsUsed: 0, dailyScoresUsed: 0, dailyLimitResetAt: now },
    })

    // Atomic check+increment: only increments if under limit
    const result = await tx.user.updateMany({
      where: { id: userId, dailyHintsUsed: { lt: dailyLimit } },
      data: { dailyHintsUsed: { increment: 1 } },
    })

    if (result.count === 0) {
      return { allowed: false, remaining: 0 }
    }

    // Read back for remaining count
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { dailyHintsUsed: true },
    })

    return {
      allowed: true,
      remaining: dailyLimit - (user?.dailyHintsUsed ?? dailyLimit),
    }
  })
}

export async function checkAndIncrementDailyScores(
  userId: string,
  tier: "FREE" | "PRO" | "PREMIUM"
): Promise<{ allowed: boolean }> {
  const tierKey = tier === "PREMIUM" ? "pro" : tier.toLowerCase() as "free" | "pro"
  const dailyLimit = LIMITS[tierKey].scoresPerDay

  const now = new Date()
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Wrap reset + increment in a transaction to close the TOCTOU window
  // between concurrent requests (e.g. multiple browser tabs).
  return prisma.$transaction(async (tx) => {
    // Reset if window expired
    await tx.user.updateMany({
      where: { id: userId, dailyLimitResetAt: { lt: cutoff } },
      data: { dailyHintsUsed: 0, dailyScoresUsed: 0, dailyLimitResetAt: now },
    })

    // Atomic check+increment: only increments if under limit
    const result = await tx.user.updateMany({
      where: { id: userId, dailyScoresUsed: { lt: dailyLimit } },
      data: { dailyScoresUsed: { increment: 1 } },
    })

    return { allowed: result.count > 0 }
  })
}
