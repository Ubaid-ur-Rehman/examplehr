import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { BalanceCard } from "./BalanceCard";

const freshBalance = {
  employeeId: "emp-1",
  locationId: "loc-nyc",
  available: 12,
  pending: 0,
  lastSyncedAt: new Date(),
  isFresh: true,
} as const;

describe("BalanceCard", () => {
  it("renders available days correctly", () => {
    render(<BalanceCard balance={freshBalance} />);

    expect(screen.getAllByText("12 days").length).toBeGreaterThan(0);
  });

  it("shows skeleton when loading", () => {
    render(<BalanceCard isLoading />);

    expect(screen.getByLabelText("Loading balance")).toBeInTheDocument();
  });

  it("shows amber warning when stale", () => {
    render(
      <BalanceCard
        balance={{
          ...freshBalance,
          locationId: "loc-chicago",
          lastSyncedAt: new Date(Date.now() - 2 * 60 * 1000),
          isFresh: false,
        }}
      />,
    );

    expect(screen.getAllByText("Balance may be outdated").length).toBeGreaterThan(0);
  });

  it("shows green indicator when fresh", () => {
    render(<BalanceCard balance={freshBalance} />);

    expect(screen.getByLabelText("Fresh balance")).toBeInTheDocument();
    expect(screen.getByText("Fresh")).toBeInTheDocument();
  });

  it("shows Pending badge when optimisticStatus is submitting", () => {
    render(
      <BalanceCard
        balance={{
          ...freshBalance,
          available: 10,
          pending: 2,
          optimisticStatus: "submitting",
          originalAvailable: 12,
        }}
      />,
    );

    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
  });

  it("shows Failed badge when optimisticStatus is rolled-back", () => {
    render(
      <BalanceCard
        balance={{
          ...freshBalance,
          available: 10,
          pending: 0,
          optimisticStatus: "rolled-back",
          originalAvailable: 12,
        }}
      />,
    );

    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getAllByText("12 days").length).toBeGreaterThan(0);
  });

  it("shows correct pending days", () => {
    render(
      <BalanceCard
        balance={{
          ...freshBalance,
          pending: 3,
        }}
      />,
    );

    expect(screen.getByText("3 days")).toBeInTheDocument();
  });
});
