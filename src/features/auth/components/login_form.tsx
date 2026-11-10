"use client";

// Email + password sign-in form for OrGanap.
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { useAuth } from "@/contexts/auth_context";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [pending, setPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    const err = await signIn({ email, password });

    setPending(false);

    if (err) {
      let description = err.message;

      if (description.toLowerCase().includes("invalid login credentials")) {
        description = "Invalid email or password. Please check your credentials and try again.";
      }

      toast.danger("Sign-in failed", { description });

      return;
    }

    toast.success("Welcome to OrGanap!", {
      description: "Signed in successfully. Redirecting to your dashboard.",
    });

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <Form
      className="flex w-full flex-col gap-4"
      validationBehavior="native"
      onSubmit={onSubmit}
    >
      <TextField
        isRequired
        name="email"
        type="email"
        validate={(value) => {
          if (!value || value.trim().length === 0) {
            return "Please enter your school email";
          }
          if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim())) {
            return "Please enter a valid email address";
          }

          return null;
        }}
      >
        <Label>School Email</Label>
        <Input
          autoComplete="email"
          inputMode="email"
          placeholder="student@school.edu"
        />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        minLength={6}
        name="password"
        type={showPassword ? "text" : "password"}
        validate={(value) => {
          if (!value || value.length < 6) {
            return "Password must be at least 6 characters";
          }

          return null;
        }}
      >
        <div className="flex items-center justify-between">
          <Label>Password</Label>
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
            tabIndex={-1}
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <Input
          autoComplete="current-password"
          placeholder="••••••••"
        />
        <FieldError />
      </TextField>

      <Button
        className="w-full mt-2 font-semibold"
        isDisabled={pending}
        type="submit"
        variant="primary"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            Signing in…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <LogIn size={18} />
            Sign In
          </span>
        )}
      </Button>
    </Form>
  );
}
