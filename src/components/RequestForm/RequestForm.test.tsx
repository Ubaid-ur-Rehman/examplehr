import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { RequestForm } from "./RequestForm";

const balances = [
  {
    employeeId: "emp-1",
    locationId: "loc-nyc",
    available: 12,
    pending: 0,
    lastSyncedAt: new Date(),
    isFresh: true,
  },
  {
    employeeId: "emp-1",
    locationId: "loc-sf",
    available: 8,
    pending: 0,
    lastSyncedAt: new Date(),
    isFresh: true,
  },
];

describe("RequestForm", () => {
  it("renders location options from balances", () => {
    render(
      <RequestForm
        employeeId="emp-1"
        balances={balances}
        onSubmit={() => undefined}
      />,
    );

    expect(screen.getByRole("option", { name: "New York" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "San Francisco" }),
    ).toBeInTheDocument();
  });

  it("calculates days automatically from date range", async () => {
    render(
      <RequestForm
        employeeId="emp-1"
        balances={balances}
        onSubmit={() => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-05-01" },
    });
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-05-03" },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Days")).toHaveValue(3);
    });
  });

  it("shows error when days exceed available balance", async () => {
    render(
      <RequestForm
        employeeId="emp-1"
        balances={balances}
        onSubmit={() => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText("Days"), {
      target: { value: "20" },
    });

    await waitFor(() => {
      expect(
        screen.getByText("Days cannot exceed available balance."),
      ).toBeInTheDocument();
    });
  });

  it("disables submit button when isSubmitting is true", () => {
    render(
      <RequestForm
        employeeId="emp-1"
        balances={balances}
        isSubmitting
        onSubmit={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", { name: /submitting/i }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Location")).toBeDisabled();
  });

  it("calls onSubmit with correct data when form is valid", async () => {
    const onSubmit = vi.fn();

    render(
      <RequestForm employeeId="emp-1" balances={balances} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "loc-sf" },
    });
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-06-10" },
    });
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-06-12" },
    });
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Family event" },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Days")).toHaveValue(3);
    });

    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      locationId: "loc-sf",
      days: 3,
      startDate: "2026-06-10",
      endDate: "2026-06-12",
      reason: "Family event",
    });
  });

  it("shows submitError message when prop is set", () => {
    render(
      <RequestForm
        employeeId="emp-1"
        balances={balances}
        onSubmit={() => undefined}
        submitError="Request failed to save."
      />,
    );

    expect(screen.getByText("Request failed to save.")).toBeInTheDocument();
  });

  it('shows "No locations available" when balances is empty', () => {
    render(
      <RequestForm employeeId="emp-1" balances={[]} onSubmit={() => undefined} />,
    );

    expect(screen.getByText("No locations available")).toBeInTheDocument();
  });
});
