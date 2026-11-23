export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "OrGanap",
  shortName: "OrGanap",
  tagline: "Student Organization Event Approval & Attendance Management System",
  description:
    "OrGanap centralizes event proposals, two-stage adviser and Student Affairs reviews, venue conflict checking, student event registration, and digital attendance verification.",
  url: "https://organap.edu",
  ogImage: "/og.png",
  author: "OrGanap Team",
  keywords: [
    "OrGanap",
    "event approval",
    "student organizations",
    "attendance management",
    "university events",
    "venue reservation",
    "QR attendance",
  ],
  navItems: [
    { label: "Events", href: "/events" },
    { label: "Organizations", href: "/organizations" },
    { label: "Calendar", href: "/calendar" },
  ] as { label: string; href: string }[],
  authNavItems: [
    { label: "Sign In", href: "/login" },
    { label: "Create Account", href: "/register" },
  ],
  navMenuItems: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Events", href: "/events" },
    { label: "My Passes", href: "/registrations" },
    { label: "Organizations", href: "/organizations" },
    { label: "Attendance", href: "/attendance" },
    { label: "Profile", href: "/profile" },
    { label: "Settings", href: "/settings" },
    { label: "Logout", href: "#logout" },
  ],
  links: {
    docs: "/docs",
    support: "mailto:support@organap.edu",
  },
};
