import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { ProfileForm } from "@/features/auth/components/profile_form";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your personal profile and account credentials.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Account Profile
        </h1>
        <p className="text-muted text-sm">
          Update your public display name and student identification details.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
