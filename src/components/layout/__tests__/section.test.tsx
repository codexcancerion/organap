import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, Chip } from "@heroui/react";

import { Section } from "../section";

describe("<Section />", () => {
  it("renders section title, badge, description, actions, and children", () => {
    render(
      <Section
        actions={
          <Button size="sm" variant="primary">
            Add Member
          </Button>
        }
        badge={
          <Chip size="sm" variant="soft">
            4 Members
          </Chip>
        }
        description="Active organization members"
        title="Organization Members"
      >
        <div data-testid="section-body">Roster grid</div>
      </Section>
    );

    expect(screen.getByRole("heading", { level: 2, name: "Organization Members" })).toBeInTheDocument();
    expect(screen.getByText("4 Members")).toBeInTheDocument();
    expect(screen.getByText("Active organization members")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Member" })).toBeInTheDocument();
    expect(screen.getByTestId("section-body")).toBeInTheDocument();
  });

  it("supports h3 heading level and bordered top divider", () => {
    const { container } = render(
      <Section bordered as="h3" title="Past Events">
        <p>History</p>
      </Section>
    );

    expect(screen.getByRole("heading", { level: 3, name: "Past Events" })).toBeInTheDocument();
    expect(container.querySelector("section")?.className).toContain("border-t");
  });
});
