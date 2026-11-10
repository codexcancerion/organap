// Client-side providers tree for OrGanap.
"use client";

import type { ThemeProviderProps } from "next-themes";

import { Toast } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "@/contexts/auth_context";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider {...themeProps}>
      <AuthProvider>
        <Toast.Provider />
        {children}
      </AuthProvider>
    </NextThemesProvider>
  );
}
