"use client";

import * as React from "react";
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
import { Mail } from "lucide-react";

import { useAuth } from "@/contexts/auth_context";

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [pending, setPending] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    const err = await requestPasswordReset({ email });

    setPending(false);

    if (err) {
      toast.danger("Reset request failed", {
        description: err.message,
      });

      return;
    }

    setSubmitted(true);
    toast.success("Reset link sent!", {
      description: "If an account exists for this email, you will receive password reset instructions.",
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-3 text-center py-4">
        <p className="text-foreground font-semibold">Check your inbox</p>
        <p className="text-muted text-sm leading-relaxed">
          We&apos;ve sent a password reset link to your email address. Please follow the link in that message to set a new password.
        </p>
      </div>
    );
  }

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

      <Button
        className="w-full mt-2 font-semibold"
        isDisabled={pending}
        type="submit"
        variant="primary"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            Sending link…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Mail size={18} />
            Send Password Reset Link
          </span>
        )}
      </Button>
    </Form>
  );
}
