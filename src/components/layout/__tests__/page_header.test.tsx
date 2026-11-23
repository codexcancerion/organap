import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Chip, Button } from "@heroui/react";

import { PageHeader } from "../page_header";

describe("<PageHeader />", () => {
  it("renders breadcrumbs with links and current page indicator", () => {
    render(
      <PageHeader
        breadcrumbs={[
          { label: "Back to Organizations", href: "/organizations" },
          { label: "CSS" },
        ]}
        title="Computer Science Society"
      />
    );

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });

    expect(nav).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: "Back to Organizations" });

    expect(backLink).toHaveAttribute("href", "/organizations");

    const currentCrumb = screen.getByText("CSS");

    expect(currentCrumb).toHaveAttribute("aria-current", "page");
  });

  it("renders multi-level breadcrumbs on nested /id/edit routes", () => {
    render(
      <PageHeader
        breadcrumbs={[
          { label: "Back to Events", href: "/events" },
          { label: "Hackathon 2026", href: "/events/evt-1" },
          { label: "Revise Proposal" },
        ]}
        title="Revise Event Proposal"
      />
    );

    expect(screen.getByRole("link", { name: "Back to Events" })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("link", { name: "Hackathon 2026" })).toHaveAttribute(
      "href",
      "/events/evt-1"
    );
    expect(screen.getByText("Revise Proposal")).toHaveAttribute("aria-current", "page");
  });

  it("renders single badge, media, description, meta, and rightmost actions", () => {
    render(
      <PageHeader
        actions={
          <>
            <Button size="sm" variant="outline">
              Edit Details
            </Button>
            <Button size="sm" variant="danger">
              Delete Org
            </Button>
          </>
        }
        badge={
          <Chip color="success" size="sm" variant="soft">
            Recognized & Active
          </Chip>
        }
        description="Official student society"
        media={<div data-testid="header-media">CSS</div>}
        meta={<span>Academic · 2 members</span>}
        title="Computer Science Society"
      />
    );

    expect(screen.getByTestId("header-media")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Computer Science Society" })).toBeInTheDocument();
    expect(screen.getByText("Recognized & Active")).toBeInTheDocument();
    expect(screen.getByText("Official student society")).toBeInTheDocument();
    expect(screen.getByText("Academic · 2 members")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Org" })).toBeInTheDocument();
  });
});
