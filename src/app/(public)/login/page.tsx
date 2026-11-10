import type { Metadata } from "next";

import { Suspense } from "react";
import NextLink from "next/link";
import { Spinner } from "@heroui/react";

import { AuthCard } from "@/features/auth/components/auth_card";
import { LoginForm } from "@/features/auth/components/login_form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to OrGanap using your school credentials.",
};

export default function LoginPage() {
  return (
    <AuthCard
      description="Enter your school account to access organization proposals and event registrations."
      footer={
        <div className="flex w-full flex-col gap-2 pt-1 text-sm text-center">
          <NextLink
            className="text-xs text-accent hover:underline font-medium"
            href="/forgotpassword"
          >
            Forgot your password?
          </NextLink>
          <span className="text-xs text-muted">
            Don&apos;t have an account yet?{" "}
            <NextLink
              className="text-accent hover:underline font-semibold"
              href="/register"
            >
              Register here
            </NextLink>
          </span>
        </div>
      }
      title="Welcome Back"
    >
      <Suspense fallback={<div className="flex justify-center py-6"><Spinner size="sm" /></div>}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
