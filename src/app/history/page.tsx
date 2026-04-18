import { redirect } from "next/navigation"

// D-03: /history consolidated into /dashboard
// Existing bookmarks to /history continue to work via this redirect.
export default function HistoryPage() {
  redirect("/dashboard")
}
