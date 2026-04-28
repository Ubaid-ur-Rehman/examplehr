import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { RequestList } from "./RequestList";

const baseRequest = {
  id: "req-1",
  employeeId: "emp-1",
  locationId: "loc-nyc",
  days: 5,
  startDate: "2025-06-01",
  endDate: "2025-06-05",
  reason: "Summer vacation",
  status: "pending" as const,
  submittedAt: new Date("2025-05-01T10:00:00Z"),
};

describe("RequestList", () => {
  it("shows skeleton when loading", () => {
    render(<RequestList requests={[]} isLoading />);

    expect(screen.getByLabelText("Loading requests")).toBeInTheDocument();
  });

  it("shows empty state message when requests is empty", () => {
    render(<RequestList requests={[]} />);

    expect(screen.getByText("No time-off requests yet")).toBeInTheDocument();
  });

  it("renders correct status badge for each status", () => {
    render(
      <RequestList
        requests={[
          baseRequest,
          { ...baseRequest, id: "req-2", status: "approved", resolvedAt: new Date() },
          { ...baseRequest, id: "req-3", status: "denied", resolvedAt: new Date() },
          { ...baseRequest, id: "req-4", status: "cancelled" },
        ]}
      />,
    );

    expect(screen.getByText("Pending Approval")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Denied")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("shows Cancel button only for pending requests", () => {
    render(
      <RequestList
        requests={[
          baseRequest,
          { ...baseRequest, id: "req-2", status: "approved", resolvedAt: new Date() },
        ]}
        onCancel={() => undefined}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(1);
  });

  it("calls onCancel with correct requestId when Cancel is clicked", () => {
    const onCancel = vi.fn();

    render(<RequestList requests={[baseRequest]} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledWith("req-1");
  });

  it("shows resolved date for approved and denied requests", () => {
    render(
      <RequestList
        requests={[
          {
            ...baseRequest,
            id: "req-2",
            status: "approved",
            resolvedAt: new Date("2025-05-20T09:00:00Z"),
          },
          {
            ...baseRequest,
            id: "req-3",
            status: "denied",
            resolvedAt: new Date("2025-05-21T09:00:00Z"),
          },
        ]}
      />,
    );

    expect(screen.getByText("Resolved May 20, 2025")).toBeInTheDocument();
    expect(screen.getByText("Resolved May 21, 2025")).toBeInTheDocument();
  });

  it("shows optimistic status badges correctly", () => {
    render(
      <RequestList
        requests={[
          { ...baseRequest, id: "req-4", optimisticStatus: "submitting" },
          { ...baseRequest, id: "req-5", optimisticStatus: "pending-confirm" },
          { ...baseRequest, id: "req-6", optimisticStatus: "rolled-back" },
        ]}
      />,
    );

    expect(screen.getByText("Submitting...")).toBeInTheDocument();
    expect(screen.getByText("Confirming...")).toBeInTheDocument();
    expect(screen.getByText("Failed - Rolled Back")).toBeInTheDocument();
  });
});
