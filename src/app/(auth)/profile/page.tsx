import type { Metadata } from "next";

import { redirect } from "next/navigation";

import {
  getCurrentUser,
  getProfileOverview,
} from "@/features/auth/services/auth_queries";
import { ProfileView } from "@/features/auth/components/profile_view";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your personal profile, avatar, credentials, and campus memberships.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const overview = await getProfileOverview(user);

  return <ProfileView overview={overview} />;
}
