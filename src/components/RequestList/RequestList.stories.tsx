import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

import { RequestList } from "./RequestList";

const baseDate = new Date("2025-06-01T10:00:00Z");

const pendingRequest = {
  id: "req-1",
  employeeId: "emp-1",
  locationId: "loc-nyc",
  days: 5,
  startDate: "2025-06-01",
  endDate: "2025-06-05",
  reason: "Summer vacation",
  status: "pending" as const,
  submittedAt: baseDate,
};

const approvedRequest = {
  ...pendingRequest,
  id: "req-2",
  locationId: "loc-sf",
  status: "approved" as const,
  resolvedAt: new Date("2025-05-20T09:00:00Z"),
};

const deniedRequest = {
  ...pendingRequest,
  id: "req-3",
  locationId: "loc-chicago",
  status: "denied" as const,
  resolvedAt: new Date("2025-05-21T09:00:00Z"),
};

const cancelledRequest = {
  ...pendingRequest,
  id: "req-4",
  status: "cancelled" as const,
};

const meta = {
  title: "Components/RequestList",
  component: RequestList,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[720px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RequestList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    requests: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    requests: [],
  },
};

export const WithPendingRequests: Story = {
  args: {
    requests: [pendingRequest],
    onCancel: () => undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("Pending Approval"),
    ).toBeInTheDocument();
  },
};

export const WithApprovedRequests: Story = {
  args: {
    requests: [approvedRequest],
  },
};

export const WithDeniedRequests: Story = {
  args: {
    requests: [deniedRequest],
  },
};

export const WithOptimisticSubmitting: Story = {
  args: {
    requests: [
      {
        ...pendingRequest,
        id: "req-5",
        optimisticStatus: "submitting" as const,
      },
    ],
  },
};

export const WithOptimisticRolledBack: Story = {
  args: {
    requests: [
      {
        ...pendingRequest,
        id: "req-6",
        optimisticStatus: "rolled-back" as const,
      },
    ],
  },
};

export const Mixed: Story = {
  args: {
    requests: [
      pendingRequest,
      approvedRequest,
      deniedRequest,
      cancelledRequest,
      {
        ...pendingRequest,
        id: "req-7",
        optimisticStatus: "pending-confirm" as const,
      },
      {
        ...pendingRequest,
        id: "req-8",
        optimisticStatus: "rolled-back" as const,
      },
    ],
    onCancel: () => undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
  },
};
