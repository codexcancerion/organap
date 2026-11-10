import type { Metadata } from "next";

import NextLink from "next/link";

import { AuthCard } from "@/features/auth/components/auth_card";
import { RegisterForm } from "@/features/auth/components/register_form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Register for an OrGanap account with your school credentials.",
};

export default function RegisterPage() {
  return (
    <AuthCard
      description="Create your OrGanap account to submit event proposals or register for campus events."
      footer={
        <div className="flex w-full flex-col gap-2 pt-1 text-sm text-center">
          <span className="text-xs text-muted">
            Already have an account?{" "}
            <NextLink
              className="text-accent hover:underline font-semibold"
              href="/login"
            >
              Sign in
            </NextLink>
          </span>
        </div>
      }
      title="Create Account"
    >
      <RegisterForm />
    </AuthCard>
  );
}
