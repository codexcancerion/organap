"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Save, User } from "lucide-react";

import { useAuth } from "@/contexts/auth_context";
import {
  ImageCropUploader,
  type CompressedImageValue,
} from "@/components/ui/image_crop_uploader";
import { uploadProfileAvatar } from "@/features/auth/services/auth_services";

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();

    return name.slice(0, 2).toUpperCase();
  }
  if (!email) return "U";

  return email.slice(0, 2).toUpperCase();
}

export type ProfileFormProps = {
  initialDisplayName?: string | null;
  initialSchoolId?: string | null;
  initialEmail?: string;
  initialAvatarUrl?: string | null;
};

export function ProfileForm({
  initialDisplayName,
  initialSchoolId,
  initialEmail,
  initialAvatarUrl,
}: ProfileFormProps = {}) {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [pending, setPending] = React.useState(false);
  const [displayName, setDisplayName] = React.useState(
    initialDisplayName ?? user?.displayName ?? "",
  );
  const [schoolId, setSchoolId] = React.useState(
    initialSchoolId ?? user?.schoolId ?? "",
  );
  const [croppedAvatar, setCroppedAvatar] = React.useState<CompressedImageValue | null>(null);
  const [isAvatarCleared, setIsAvatarCleared] = React.useState(false);

  const resolvedEmail = user?.email ?? initialEmail ?? "";
  const resolvedAvatarUrl = user?.avatarUrl ?? initialAvatarUrl ?? null;
  const resolvedFallbackName = displayName || user?.displayName || initialDisplayName;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    const trimmedSchoolId = schoolId.trim();

    if (trimmedName.length < 2) {
      toast.danger("Invalid display name", {
        description: "Display name must be at least 2 characters.",
      });

      return;
    }

    setPending(true);

    let nextAvatarUrl: string | null | undefined = undefined;

    if (croppedAvatar) {
      const uploadRes = await uploadProfileAvatar(croppedAvatar.blob);

      if (!uploadRes.success) {
        setPending(false);
        toast.danger("Avatar upload failed", {
          description: uploadRes.error.message,
        });

        return;
      }

      nextAvatarUrl = uploadRes.data.publicUrl;
    } else if (isAvatarCleared) {
      nextAvatarUrl = null;
    }

    const err = await updateProfile({
      displayName: trimmedName,
      schoolId: trimmedSchoolId || null,
      ...(nextAvatarUrl !== undefined ? { avatarUrl: nextAvatarUrl } : {}),
    });

    setPending(false);

    if (err) {
      toast.danger("Profile update failed", {
        description: err.message,
      });

      return;
    }

    setCroppedAvatar(null);
    setIsAvatarCleared(false);
    toast.success("Profile updated", {
      description: "Your profile details and photo have been saved.",
    });
    router.refresh();
  };

  return (
    <Card className="border border-border/40">
      <Card.Header className="flex flex-row items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <User size={18} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <Card.Title className="text-base font-semibold">Personal Identity</Card.Title>
          <Card.Description>
            Update your profile photo, public display name, and university identification.
          </Card.Description>
        </div>
      </Card.Header>

      <Card.Content>
        <Form
          className="flex w-full flex-col gap-5"
          validationBehavior="native"
          onSubmit={handleSubmit}
        >
          <ImageCropUploader
            avatarVariant="circle"
            chooseButtonLabel="Choose Photo"
            emptyTitle="Upload Profile Photo"
            existingImageUrl={resolvedAvatarUrl}
            existingTitle="Current Profile Photo"
            fallbackText={getInitials(resolvedFallbackName, resolvedEmail)}
            helperDescription="Upload a PNG, JPG, or WebP photo. Drag and zoom to frame a crisp 512×512 profile avatar."
            inputAriaLabel="Upload profile photo"
            isCleared={isAvatarCleared}
            replaceButtonLabel="Change Photo"
            subjectName={resolvedFallbackName || "Profile"}
            value={croppedAvatar}
            onChange={(next) => {
              setCroppedAvatar(next);
              if (next) setIsAvatarCleared(false);
            }}
            onClearExisting={() => setIsAvatarCleared(true)}
          />

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              isRequired
              minLength={2}
              name="displayName"
              type="text"
              validate={(val) => {
                if (!val || val.trim().length < 2) {
                  return "Display name must be at least 2 characters.";
                }

                return null;
              }}
              value={displayName}
              onChange={setDisplayName}
            >
              <Label>Display Name</Label>
              <Input placeholder="Your full name" variant="secondary" />
              <FieldError />
            </TextField>

            <TextField
              name="schoolId"
              type="text"
              value={schoolId}
              onChange={setSchoolId}
            >
              <Label>School / Student ID</Label>
              <Input placeholder="e.g. 2026-10492" variant="secondary" />
              <Description>Used for event check-in lookup and attendance rosters.</Description>
              <FieldError />
            </TextField>
          </div>

          <TextField
            isReadOnly
            name="email"
            type="email"
            value={resolvedEmail}
          >
            <Label>Institutional Email</Label>
            <Input readOnly variant="secondary" />
            <Description>
              Institutional emails are tied to authentication and cannot be self-edited.
            </Description>
          </TextField>

          <div className="flex items-center justify-end pt-1">
            <Button
              className="font-semibold"
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
                  Save Profile
                </span>
              )}
            </Button>
          </div>
        </Form>
      </Card.Content>
    </Card>
  );
}
