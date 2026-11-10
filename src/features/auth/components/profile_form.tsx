"use client";

import * as React from "react";
import {
  Button,
  Chip,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { Save, User } from "lucide-react";

import { useAuth } from "@/contexts/auth_context";

export function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [pending, setPending] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const displayName = String(formData.get("displayName") ?? "").trim();
    const schoolId = String(formData.get("schoolId") ?? "").trim();

    const err = await updateProfile({
      displayName,
      schoolId: schoolId || null,
    });

    setPending(false);

    if (err) {
      toast.danger("Profile update failed", {
        description: err.message,
      });

      return;
    }

    toast.success("Profile updated!", {
      description: "Your profile information has been saved.",
    });
  };

  return (
    <Form
      className="flex w-full flex-col gap-5 max-w-xl"
      validationBehavior="native"
      onSubmit={onSubmit}
    >
      <div className="flex items-center gap-3 pb-2 border-b border-border/30">
        <div className="p-3 rounded-full bg-accent/10 text-accent">
          <User size={24} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {user?.displayName || "My Profile"}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted">{user?.email}</span>
            <Chip size="sm" variant="soft">
              {user?.role?.toUpperCase()}
            </Chip>
          </div>
        </div>
      </div>

      <TextField
        isRequired
        defaultValue={user?.displayName ?? ""}
        name="displayName"
        type="text"
      >
        <Label>Display Name</Label>
        <Input placeholder="Your full name" />
        <FieldError />
      </TextField>

      <TextField
        defaultValue={user?.schoolId ?? ""}
        name="schoolId"
        type="text"
      >
        <Label>School / Student ID</Label>
        <Input placeholder="e.g. 2026-10492" />
        <FieldError />
      </TextField>

      <TextField
        isReadOnly
        defaultValue={user?.email ?? ""}
        name="email"
        type="email"
      >
        <Label>School Email (Read-only)</Label>
        <Input readOnly />
      </TextField>

      <Button
        className="self-start font-semibold"
        isDisabled={pending}
        type="submit"
        variant="primary"
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            Saving…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Save size={16} />
            Save Changes
          </span>
        )}
      </Button>
    </Form>
  );
}
