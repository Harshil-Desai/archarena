import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Prisma cascades: deleting User wipes Account, Session (next-auth),
  // and InterviewSession via onDelete: Cascade in the schema.
  try {
    await prisma.user.delete({ where: { id: session.user.id } });
  } catch (err) {
    console.error("[account/delete] failed:", err);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
