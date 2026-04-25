import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserNavBar } from "@/components/ui/UserNavBar";
import { PromptsClient } from "./PromptsClient";

export default async function PromptsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/prompts");

  return (
    <div style={{ minHeight: "100vh" }}>
      <UserNavBar />
      <PromptsClient />
    </div>
  );
}
