"use client";

// Dynamic user registration form for OrGanap (Django-style RBAC).
import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Eye, EyeOff, UserPlus } from "lucide-react";

import { useAuth } from "@/contexts/auth_context";

export function RegisterForm() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [pending, setPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("displayName") ?? "").trim();
    const schoolId = String(formData.get("schoolId") ?? "").trim();

    const res = await signUp({
      email,
      password,
      displayName,
      schoolId: schoolId || undefined,
    });

    setPending(false);

    if (res.status === "error") {
      toast.danger("Registration failed", {
        description: res.error.message,
      });

      return;
    }

    if (res.status === "awaiting_confirmation") {
      toast.info("Check your email", {
        description:
          "We sent a confirmation link to your school email address. Please confirm your account to sign in.",
      });
      router.push("/login");

      return;
    }

    toast.success("Account created!", {
      description: "Welcome to OrGanap. Redirecting to your dashboard…",
    });

    router.push("/dashboard");
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
        name="displayName"
        type="text"
        validate={(value) => {
          if (!value || value.trim().length < 2) {
            return "Please enter your full name";
          }

          return null;
        }}
      >
        <Label>Full Name</Label>
        <Input
          autoComplete="name"
          placeholder="Juan Dela Cruz"
        />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        name="schoolId"
        type="text"
        validate={(value) => {
          if (!value || value.trim().length < 3) {
            return "Please enter your School / Student ID";
          }

          return null;
        }}
      >
        <Label>School / Student ID</Label>
        <Input
          placeholder="e.g. 2026-10492"
        />
        <FieldError />
      </TextField>

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
          placeholder="juan.delacruz@school.edu"
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
          autoComplete="new-password"
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
            Creating account…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <UserPlus size={18} />
            Create Account
          </span>
        )}
      </Button>
    </Form>
  );
}
