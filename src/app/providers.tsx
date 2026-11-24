// Client-side providers tree for OrGanap.
"use client";

import type { ThemeProviderProps } from "next-themes";
import type { AuthUser } from "@/types";

import { I18nProvider, Toast } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "@/contexts/auth_context";

export interface ProvidersProps {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, initialUser, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider {...themeProps}>
      <I18nProvider locale="en-US">
        <AuthProvider initialUser={initialUser}>
          <Toast.Provider />
          {children}
        </AuthProvider>
      </I18nProvider>
    </NextThemesProvider>
  );
}
