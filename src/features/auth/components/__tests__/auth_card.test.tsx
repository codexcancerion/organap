import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { AuthCard } from "../auth_card";

describe("<AuthCard />", () => {
  it("renders title, description, and children in centered card shell", () => {
    render(
      <AuthCard
        description="Sign in to manage your proposals"
        title="Welcome to OrGanap"
      >
        <div>Form Content</div>
      </AuthCard>,
    );

    expect(screen.getByText("Welcome to OrGanap")).toBeInTheDocument();
    expect(screen.getByText("Sign in to manage your proposals")).toBeInTheDocument();
    expect(screen.getByText("Form Content")).toBeInTheDocument();
  });

  it("renders footer in Card.Footer when footer prop is provided", () => {
    render(
      <AuthCard
        footer={<div>Footer Links</div>}
        title="Create Account"
      >
        <div>Registration Form</div>
      </AuthCard>,
    );

    expect(screen.getByText("Footer Links")).toBeInTheDocument();
    expect(screen.getByText("Registration Form")).toBeInTheDocument();
  });
});
