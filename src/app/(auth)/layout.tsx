import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { AuthShell } from "@/components/navigation/auth_shell";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthShell>
      <div className="w-full flex flex-col gap-6">
        {children}
      </div>
    </AuthShell>
  );
}
