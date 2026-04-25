import { auth } from "@/auth";
import { getUserMeta } from "@/lib/user-meta";
import { NavBar } from "./NavBar";

/**
 * Server component that fetches the current user's tier, streak, and
 * initials, then renders NavBar with real data. Use this on every
 * authenticated page instead of <NavBar /> directly.
 */
export async function UserNavBar() {
  const session = await auth();
  if (!session?.user?.id) {
    return <NavBar />;
  }
  const meta = await getUserMeta(session.user.id);
  return <NavBar tier={meta.tier} streak={meta.streak} userName={meta.initials} />;
}
