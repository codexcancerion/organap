import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth_card";
import { ResetPasswordForm } from "@/features/auth/components/reset_password_form";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Set a new password for your OrGanap account.",
};

export default function ResetPasswordPage() {
  return (
    <AuthCard
      description="Enter your new password below to update your account."
      title="Set New Password"
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
