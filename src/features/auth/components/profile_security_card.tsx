"use client";

import * as React from "react";
import {
  Button,
  Card,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Separator,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";

import { useAuth } from "@/contexts/auth_context";

export function ProfileSecurityCard({ email }: { email: string }) {
  const { updatePassword, requestPasswordReset } = useAuth();
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [updatingPassword, setUpdatingPassword] = React.useState(false);
  const [sendingReset, setSendingReset] = React.useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.danger("Password too short", {
        description: "Password must be at least 6 characters long.",
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      toast.danger("Passwords do not match", {
        description: "Please make sure both new password fields match.",
      });

      return;
    }

    setUpdatingPassword(true);
    const err = await updatePassword(newPassword);

    setUpdatingPassword(false);

    if (err) {
      toast.danger("Failed to update password", {
        description: err.message,
      });

      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated", {
      description: "Your account credentials have been updated securely.",
    });
  };

  const handleSendResetEmail = async () => {
    if (!email) return;
    setSendingReset(true);
    const err = await requestPasswordReset({ email });

    setSendingReset(false);

    if (err) {
      toast.danger("Could not send recovery email", {
        description: err.message,
      });

      return;
    }

    toast.success("Recovery email sent", {
      description: `Check ${email} for a password reset link.`,
    });
  };

  return (
    <Card className="border border-border/40">
      <Card.Header className="flex flex-row items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <ShieldCheck size={18} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <Card.Title className="text-base font-semibold">Password & Security</Card.Title>
          <Card.Description>
            Update your sign-in password directly or request a recovery email link.
          </Card.Description>
        </div>
      </Card.Header>

      <Card.Content className="flex flex-col gap-5">
        <Form
          className="flex flex-col gap-4"
          validationBehavior="native"
          onSubmit={handlePasswordSubmit}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              isRequired
              minLength={6}
              name="newPassword"
              type="password"
              validate={(val) => {
                if (!val || val.length < 6) {
                  return "Password must be at least 6 characters.";
                }

                return null;
              }}
              value={newPassword}
              onChange={setNewPassword}
            >
              <Label>New Password</Label>
              <Input placeholder="At least 6 characters" variant="secondary" />
              <FieldError />
            </TextField>

            <TextField
              isRequired
              minLength={6}
              name="confirmPassword"
              type="password"
              validate={(val) => {
                if (!val || val.length < 6) {
                  return "Confirm your new password.";
                }
                if (val !== newPassword) {
                  return "Passwords do not match.";
                }

                return null;
              }}
              value={confirmPassword}
              onChange={setConfirmPassword}
            >
              <Label>Confirm Password</Label>
              <Input placeholder="Re-enter new password" variant="secondary" />
              <Description>Minimum 6 characters required.</Description>
              <FieldError />
            </TextField>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              isDisabled={sendingReset || !email}
              size="sm"
              type="button"
              variant="secondary"
              onPress={handleSendResetEmail}
            >
              {sendingReset ? <Spinner size="sm" /> : <MailCheck size={15} />}
              Send Recovery Email
            </Button>

            <Button
              className="font-semibold"
              isDisabled={updatingPassword}
              type="submit"
              variant="primary"
            >
              {updatingPassword ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Updating…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <KeyRound size={15} />
                  Update Password
                </span>
              )}
            </Button>
          </div>
        </Form>

        <Separator />

        <p className="text-xs text-muted leading-relaxed">
          Signed in as <span className="font-medium text-foreground">{email}</span>. Password updates apply immediately to your active session.
        </p>
      </Card.Content>
    </Card>
  );
}
