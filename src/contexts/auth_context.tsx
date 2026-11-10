// AuthContext — wraps the app in a single source of truth for the
// currently signed-in user across all OrGanap features.
"use client";

import type {
  AuthError,
  AuthUser,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  SignUpResult,
  UpdateProfileInput,
} from "@/features/auth/types";

import * as React from "react";
import { toast } from "@heroui/react";
import { useRouter } from "next/navigation";

import {
  hydrateAuthUser,
  requestPasswordReset as svcRequestPasswordReset,
  signInWithPassword as svcSignInWithPassword,
  signOut as svcSignOut,
  signUpWithPassword as svcSignUpWithPassword,
  updateProfile as svcUpdateProfile,
  updateUserPassword as svcUpdateUserPassword,
} from "@/features/auth/services/auth_services";
import { createClient } from "@/utils/supabase/client";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (input: SignInInput) => Promise<AuthError | null>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<AuthError | null>;
  requestPasswordReset: (input: ResetPasswordInput) => Promise<AuthError | null>;
  updatePassword: (password: string) => Promise<AuthError | null>;
  isSuperadmin: boolean;
  isStudentAffairs: boolean;
  isAdviser: boolean;
  isOfficer: boolean;
  isStudent: boolean;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const recoveryHandledRef = React.useRef(false);

  const handleRecovery = React.useCallback(() => {
    if (recoveryHandledRef.current) return;
    recoveryHandledRef.current = true;

    toast.info("Signed in via recovery link", {
      description: "Please enter your new password to update your account.",
    });

    if (typeof window !== "undefined" && window.location.pathname !== "/reset-password") {
      router.push("/reset-password");
    }
  }, [router]);

  React.useEffect(() => {
    let cancelled = false;

    try {
      const supabase = createClient();

      const sync = async (
        nextAuthUser: { id: string; email?: string | null } | null | undefined,
      ) => {
        if (cancelled) return;
        const hydrated = await hydrateAuthUser(nextAuthUser);

        if (cancelled) return;
        setUser(hydrated);
        setLoading(false);
      };

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        void sync(session?.user);

        if (event === "PASSWORD_RECOVERY") {
          handleRecovery();
        }
      });

      return () => {
        cancelled = true;
        subscription.unsubscribe();
      };
    } catch (e) {
      console.warn("Supabase auth client not initialized yet:", e);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, [handleRecovery]);

  const signIn = React.useCallback(async (input: SignInInput) => {
    const res = await svcSignInWithPassword(input);

    if (res.error) return res.error;
    setUser(res.data);

    return null;
  }, []);

  const signUp = React.useCallback(async (input: SignUpInput) => {
    const res = await svcSignUpWithPassword(input);

    if (res.status === "signed_in") {
      setUser(res.user);
    }

    return res;
  }, []);

  const signOut = React.useCallback(async () => {
    await svcSignOut();
    setUser(null);
  }, []);

  const updateProfile = React.useCallback(
    async (input: UpdateProfileInput) => {
      const err = await svcUpdateProfile(input);

      if (!err && user) {
        setUser({
          ...user,
          displayName:
            input.displayName !== undefined ? input.displayName : user.displayName,
          schoolId:
            input.schoolId !== undefined ? input.schoolId : user.schoolId,
          avatarUrl:
            input.avatarUrl !== undefined ? input.avatarUrl : user.avatarUrl,
        });
      }

      return err;
    },
    [user],
  );

  const requestPasswordReset = React.useCallback(
    async (input: ResetPasswordInput) => {
      return svcRequestPasswordReset(input);
    },
    [],
  );

  const updatePassword = React.useCallback(async (password: string) => {
    return svcUpdateUserPassword(password);
  }, []);

  const isSuperadmin = user?.role === "superadmin";
  const isStudentAffairs = user?.role === "student_affairs" || isSuperadmin;
  const isAdviser = user?.role === "adviser";
  const isOfficer = user?.role === "officer";
  const isStudent = user?.role === "student";

  const value = React.useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      requestPasswordReset,
      updatePassword,
      isSuperadmin,
      isStudentAffairs,
      isAdviser,
      isOfficer,
      isStudent,
    }),
    [
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      requestPasswordReset,
      updatePassword,
      isSuperadmin,
      isStudentAffairs,
      isAdviser,
      isOfficer,
      isStudent,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return ctx;
}
