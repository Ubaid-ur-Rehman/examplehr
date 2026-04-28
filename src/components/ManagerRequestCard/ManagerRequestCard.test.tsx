import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { ManagerRequestCard } from "./ManagerRequestCard";

const request = {
  id: "req-1",
  employeeId: "emp-1",
  locationId: "loc-nyc",
  days: 4,
  startDate: "2025-06-01",
  endDate: "2025-06-04",
  reason: "Family trip",
  status: "pending" as const,
  submittedAt: new Date("2025-05-01T10:00:00Z"),
};

const balance = {
  employeeId: "emp-1",
  locationId: "loc-nyc",
  available: 12,
  pending: 0,
  lastSyncedAt: new Date(),
  isFresh: true,
};

describe("ManagerRequestCard", () => {
  it("shows balance skeleton when isLoadingBalance is true", () => {
    render(
      <ManagerRequestCard
        request={request}
        balance={undefined}
        isLoadingBalance
        onApprove={() => undefined}
        onDeny={() => undefined}
      />,
    );

    expect(screen.getByLabelText("Loading balance context")).toBeInTheDocument();
  });

  it("shows live indicator when balance isFresh is true", () => {
    render(
      <ManagerRequestCard
        request={request}
        balance={balance}
        onApprove={() => undefined}
        onDeny={() => undefined}
      />,
    );

    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("shows stale warning when balance isFresh is false", () => {
    render(
      <ManagerRequestCard
        request={request}
        balance={{
          ...balance,
          isFresh: false,
          lastSyncedAt: new Date(Date.now() - 3 * 60 * 1000),
        }}
        onApprove={() => undefined}
        onDeny={() => undefined}
      />,
    );

    expect(screen.getByText(/Stale - last synced/i)).toBeInTheDocument();
  });

  it("shows insufficient balance warning when days > available", () => {
    render(
      <ManagerRequestCard
        request={{ ...request, days: 20 }}
        balance={balance}
        onApprove={() => undefined}
        onDeny={() => undefined}
      />,
    );

    expect(
      screen.getAllByText("Employee may not have enough balance").length,
    ).toBeGreaterThan(0);
  });

  it("disables both buttons when isApproving is true", () => {
    render(
      <ManagerRequestCard
        request={request}
        balance={balance}
        isApproving
        onApprove={() => undefined}
        onDeny={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /approving/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deny" })).toBeDisabled();
  });

  it("disables both buttons when isDenying is true", () => {
    render(
      <ManagerRequestCard
        request={request}
        balance={balance}
        isDenying
        onApprove={() => undefined}
        onDeny={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /denying/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
  });

  it("calls onApprove with correct requestId when Approve is clicked", () => {
    const onApprove = vi.fn();

    render(
      <ManagerRequestCard
        request={request}
        balance={balance}
        onApprove={onApprove}
        onDeny={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(onApprove).toHaveBeenCalledWith("req-1");
  });

  it("calls onDeny with correct requestId when Deny is clicked", () => {
    const onDeny = vi.fn();

    render(
      <ManagerRequestCard
        request={request}
        balance={balance}
        onApprove={() => undefined}
        onDeny={onDeny}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Deny" }));

    expect(onDeny).toHaveBeenCalledWith("req-1");
  });

  it("hides action buttons when request status is not pending", () => {
    render(
      <ManagerRequestCard
        request={{ ...request, status: "approved", resolvedAt: new Date() }}
        balance={balance}
        onApprove={() => undefined}
        onDeny={() => undefined}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Deny" }),
    ).not.toBeInTheDocument();
  });

  it('shows "Balance unavailable" when balance is undefined', () => {
    render(
      <ManagerRequestCard
        request={request}
        balance={undefined}
        onApprove={() => undefined}
        onDeny={() => undefined}
      />,
    );

    expect(
      screen.getByText("Balance unavailable - approve with caution"),
    ).toBeInTheDocument();
  });
});
