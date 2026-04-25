import { prisma } from "./prisma";
import type { Tier } from "@prisma/client";

export interface UserMeta {
  tier: Tier;
  streak: number;
  name: string;
  initials: string;
  email: string | null;
}

/**
 * Compute a user's day streak — the number of consecutive UTC days
 * (counting backwards from their most recent session) on which they
 * had at least one session. Returns 0 if the user has no sessions.
 */
export async function computeStreak(userId: string): Promise<number> {
  const sessions = await prisma.interviewSession.findMany({
    where: { userId },
    select: { updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 365,
  });
  if (sessions.length === 0) return 0;

  const dayKeys = new Set(
    sessions.map((s) => s.updatedAt.toISOString().slice(0, 10))
  );

  let streak = 0;
  const cursor = new Date(sessions[0].updatedAt);
  cursor.setUTCHours(0, 0, 0, 0);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dayKeys.has(key)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/**
 * Fetch tier + streak + display info for a user. Used by every
 * authenticated page to populate the NavBar.
 */
export async function getUserMeta(userId: string): Promise<UserMeta> {
  const [user, streak] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, name: true, email: true },
    }),
    computeStreak(userId),
  ]);

  const name = user?.name ?? user?.email?.split("@")[0] ?? "Player";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "P";

  return {
    tier: user?.tier ?? "FREE",
    streak,
    name,
    initials,
    email: user?.email ?? null,
  };
}
