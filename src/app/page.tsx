import type { Metadata } from "next";

import NextLink from "next/link";
import { Button, Card } from "@heroui/react";
import {
  FileCheck2,
  Building2,
  QrCode,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

import { getCurrentUser } from "@/features/auth/services/auth_queries";

export const metadata: Metadata = {
  title: "OrGanap — Student Organization Event Approval & Attendance Management",
  description:
    "Centralize event proposals, faculty adviser endorsements, Student Affairs approvals, venue scheduling, and digital attendance verification.",
};

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="relative w-full py-16 md:py-28 overflow-hidden bg-radial from-accent/10 via-transparent to-transparent">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/20 text-accent text-xs font-semibold animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            University Co-Curricular Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-[1.15]">
            Student Organization Events,{" "}
            <span className="text-accent">Transparent &amp; Conflict-Free</span>
          </h1>

          <p className="text-muted text-base sm:text-lg max-w-2xl leading-relaxed">
            OrGanap unifies event proposal drafting, two-stage adviser and Student Affairs approvals, automated venue collision prevention, and digital attendance verification in one institutional system.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {user ? (
              <NextLink href="/dashboard">
                <Button size="lg" variant="primary">
                  Go to Dashboard
                  <ArrowRight size={18} />
                </Button>
              </NextLink>
            ) : (
              <>
                <NextLink href="/login">
                  <Button size="lg" variant="primary">
                    Sign In to Portal
                    <ArrowRight size={18} />
                  </Button>
                </NextLink>
                <NextLink href="/register">
                  <Button size="lg" variant="secondary">
                    Create Account
                  </Button>
                </NextLink>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Pillar Bento */}
      <section className="w-full py-12 md:py-20 border-t border-border/30 bg-surface/30">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex flex-col gap-12">
          <div className="flex flex-col items-center text-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Built for Campus Organizations and Student Affairs
            </h2>
            <p className="text-muted text-sm sm:text-base max-w-xl">
              From the initial draft to the final attendance audit, every step is synchronized.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border border-border/40 hover:border-accent/40 transition-colors">
              <Card.Content className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                  <FileCheck2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Two-Stage Approval Routing</h3>
                  <p className="text-muted text-sm mt-1 leading-relaxed">
                    Faculty advisers endorse proposals with formal remarks before Student Affairs grants final authorization. Complete audit history is retained.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-accent mt-auto">
                  <CheckCircle size={14} /> FR-03 to FR-09
                </div>
              </Card.Content>
            </Card>

            <Card className="p-6 border border-border/40 hover:border-accent/40 transition-colors">
              <Card.Content className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Venue Collision Prevention</h3>
                  <p className="text-muted text-sm mt-1 leading-relaxed">
                    Automated scheduling validation guarantees no two approved events occupy the same physical auditorium or hall simultaneously.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-accent mt-auto">
                  <CheckCircle size={14} /> FR-06 &amp; FR-07
                </div>
              </Card.Content>
            </Card>

            <Card className="p-6 border border-border/40 hover:border-accent/40 transition-colors">
              <Card.Content className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                  <QrCode size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Digital Attendance &amp; Reports</h3>
                  <p className="text-muted text-sm mt-1 leading-relaxed">
                    Distinguish registered attendees from confirmed attendees. Perform check-ins during the event window and export verified CSV records.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-accent mt-auto">
                  <CheckCircle size={14} /> FR-12 to FR-18
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
