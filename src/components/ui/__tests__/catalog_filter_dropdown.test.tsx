import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CatalogFilterDropdown } from "../catalog_filter_dropdown";

function MultiFilterHarness() {
  const [status, setStatus] = React.useState("all");
  const [venue, setVenue] = React.useState("all");

  return (
    <div>
      <span data-testid="state">{`${status}:${venue}`}</span>
      <CatalogFilterDropdown
        filters={[
          {
            id: "status",
            label: "Status",
            ariaLabel: "Filter by status",
            value: status,
            options: [
              { id: "all", label: "All Statuses" },
              { id: "approved", label: "Approved" },
            ],
            onChange: setStatus,
          },
          {
            id: "venue",
            label: "Venue",
            ariaLabel: "Filter by venue",
            value: venue,
            options: [
              { id: "all", label: "All Venues" },
              { id: "gym", label: "University Gym" },
            ],
            onChange: setVenue,
          },
        ]}
      />
    </div>
  );
}

describe("<CatalogFilterDropdown />", () => {
  it("renders a direct Select dropdown when given a single filter", () => {
    const onChange = (val: string) => val;

    render(
      <CatalogFilterDropdown
        filters={[
          {
            id: "category",
            label: "Category",
            ariaLabel: "Filter by category",
            value: "all",
            options: [
              { id: "all", label: "All Categories" },
              { id: "academic", label: "Academic" },
            ],
            onChange,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", { name: /All Categories.*Filter by category/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Filters/i })).not.toBeInTheDocument();
  });

  it("renders a unified Filters popover with nested Selects and Reset when given multiple filters", () => {
    render(<MultiFilterHarness />);

    const trigger = screen.getByRole("button", { name: "Filters" });

    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);

    expect(screen.getByText("Filter Options")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Venue")).toBeInTheDocument();

    // Open Status Select inside Popover and select "Approved"
    fireEvent.click(screen.getByRole("button", { name: /Status/i }));
    fireEvent.click(screen.getByRole("option", { name: "Approved" }));

    expect(screen.getByTestId("state")).toHaveTextContent("approved:all");

    // Reset button appears and resets all filters
    const resetBtn = screen.getByRole("button", { name: /Reset/i });

    fireEvent.click(resetBtn);
    expect(screen.getByTestId("state")).toHaveTextContent("all:all");
  });
});
