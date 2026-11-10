import type { Metadata } from "next";

import NextLink from "next/link";

import { AuthCard } from "@/features/auth/components/auth_card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot_password_form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Recover your OrGanap account password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      description="Enter your registered school email to receive password recovery instructions."
      footer={
        <div className="flex w-full justify-center pt-1 text-xs text-center">
          <NextLink
            className="text-accent hover:underline font-medium"
            href="/login"
          >
            ← Back to Sign In
          </NextLink>
        </div>
      }
      title="Reset Password"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
