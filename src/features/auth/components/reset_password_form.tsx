"use client";

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
import { KeyRound } from "lucide-react";

import { useAuth } from "@/contexts/auth_context";

export function ResetPasswordForm() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [pending, setPending] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setPending(false);
      toast.danger("Passwords do not match", {
        description: "Please make sure both passwords match.",
      });

      return;
    }

    const err = await updatePassword(newPassword);

    setPending(false);

    if (err) {
      toast.danger("Password update failed", {
        description: err.message,
      });

      return;
    }

    toast.success("Password updated!", {
      description: "Your password has been changed. You can now use your new password.",
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
        minLength={6}
        name="newPassword"
        type="password"
        validate={(value) => {
          if (!value || value.length < 6) {
            return "Password must be at least 6 characters";
          }

          return null;
        }}
      >
        <Label>New Password</Label>
        <Input placeholder="••••••••" />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        minLength={6}
        name="confirmPassword"
        type="password"
        validate={(value) => {
          if (!value || value.length < 6) {
            return "Please confirm your password";
          }

          return null;
        }}
      >
        <Label>Confirm New Password</Label>
        <Input placeholder="••••••••" />
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
            Updating password…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <KeyRound size={18} />
            Update Password
          </span>
        )}
      </Button>
    </Form>
  );
}
