import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  bestScore: number;
  totalRounds: number;
  isYou?: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  yourEntry: LeaderboardEntry | null;
  totalPlayers: number;
}

export async function GET() {
  const session = await auth();
  const meId = session?.user?.id ?? null;

  // Pull every user's best scoreResult.overall via a raw query — Prisma can't
  // index into JSON fields via the standard query builder.
  const rows = await prisma.$queryRaw<
    { userId: string; name: string | null; email: string | null; bestScore: number; totalRounds: bigint }[]
  >`
    SELECT
      u.id AS "userId",
      u.name,
      u.email,
      COALESCE(MAX(((s."scoreResult"->>'overall')::int)), 0) AS "bestScore",
      COUNT(s.id)::bigint AS "totalRounds"
    FROM "User" u
    LEFT JOIN "InterviewSession" s ON s."userId" = u.id AND s."scoreResult" IS NOT NULL
    GROUP BY u.id, u.name, u.email
    HAVING COALESCE(MAX(((s."scoreResult"->>'overall')::int)), 0) > 0
    ORDER BY "bestScore" DESC, "totalRounds" DESC
    LIMIT 100;
  `;

  const totalPlayers = await prisma.user.count();

  const entries: LeaderboardEntry[] = rows.map((row, idx) => ({
    rank: idx + 1,
    userId: row.userId,
    name: row.name ?? row.email?.split("@")[0] ?? "Player",
    bestScore: row.bestScore,
    totalRounds: Number(row.totalRounds),
    isYou: row.userId === meId,
  }));

  let yourEntry: LeaderboardEntry | null = null;
  if (meId) {
    yourEntry = entries.find((e) => e.userId === meId) ?? null;
    if (!yourEntry) {
      // User isn't on the leaderboard yet (no scored sessions). Fetch their stats anyway.
      const me = await prisma.user.findUnique({
        where: { id: meId },
        select: { name: true, email: true },
      });
      const myRoundCount = await prisma.interviewSession.count({ where: { userId: meId } });
      if (me) {
        yourEntry = {
          rank: 0,
          userId: meId,
          name: me.name ?? me.email?.split("@")[0] ?? "You",
          bestScore: 0,
          totalRounds: myRoundCount,
          isYou: true,
        };
      }
    }
  }

  return NextResponse.json<LeaderboardResponse>({
    entries: entries.slice(0, 10),
    yourEntry,
    totalPlayers,
  });
}
