import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import Link from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { fontSans, fontMono, fontLogo } from "@/config/fonts";
import { Navbar } from "@/components/navigation/navbar";
import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getUnreadNotificationCount } from "@/features/notifications/services/notification_queries";
import { CookieConsent } from "@/components/ui/cookie_consent";

import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  applicationName: siteConfig.name,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    url: siteConfig.url,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#141b18" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <html
      suppressHydrationWarning
      className={clsx(fontSans.variable, fontMono.variable, fontLogo.variable)}
      lang="en"
    >
      <body className="min-h-screen text-foreground bg-background font-sans antialiased">
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex flex-col min-h-screen">
            <Navbar unreadCount={unreadCount} user={user} />
            <div className="flex-1">
              {children}
            </div>
            <footer className="w-full border-t border-border/30 py-8 text-center text-xs text-muted mt-auto bg-surface/50">
              <div className="container mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{siteConfig.name}</span>
                  <span>© {new Date().getFullYear()}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                    v0.1.0 Beta
                  </span>
                </div>
                <p className="text-muted text-xs">
                  {siteConfig.tagline}
                </p>
                <div className="flex items-center gap-4">
                  <Link className="hover:text-foreground transition-colors" href="/docs">Docs</Link>
                  <Link className="hover:text-foreground transition-colors" href="/privacy">Privacy</Link>
                  <Link className="hover:text-foreground transition-colors" href="/terms">Terms</Link>
                </div>
              </div>
            </footer>
            <CookieConsent />
          </div>
        </Providers>
      </body>
    </html>
  );
}
