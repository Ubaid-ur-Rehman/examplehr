import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";

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

const freshBalance = {
  employeeId: "emp-1",
  locationId: "loc-nyc",
  available: 12,
  pending: 0,
  lastSyncedAt: new Date(),
  isFresh: true,
};

const staleBalance = {
  ...freshBalance,
  lastSyncedAt: new Date(Date.now() - 3 * 60 * 1000),
  isFresh: false,
};

const meta = {
  title: "Components/ManagerRequestCard",
  component: ManagerRequestCard,
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
  args: {
    request,
    balance: freshBalance,
    onApprove: () => undefined,
    onDeny: () => undefined,
  },
} satisfies Meta<typeof ManagerRequestCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoadingBalance: Story = {
  args: {
    balance: undefined,
    isLoadingBalance: true,
  },
};

export const FreshBalanceSufficient: Story = {
  args: {
    balance: freshBalance,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Live")).toBeInTheDocument();
  },
};

export const FreshBalanceInsufficient: Story = {
  args: {
    request: {
      ...request,
      days: 14,
    },
    balance: freshBalance,
  },
};

export const StaleBalance: Story = {
  args: {
    balance: staleBalance,
  },
};

export const BalanceUnavailable: Story = {
  args: {
    balance: undefined,
  },
};

export const Approving: Story = {
  args: {
    isApproving: true,
  },
};

export const Denying: Story = {
  args: {
    isDenying: true,
  },
};

export const AlreadyApproved: Story = {
  args: {
    request: {
      ...request,
      status: "approved",
      resolvedAt: new Date("2025-05-04T12:00:00Z"),
    },
  },
};

export const AlreadyDenied: Story = {
  args: {
    request: {
      ...request,
      status: "denied",
      resolvedAt: new Date("2025-05-04T12:00:00Z"),
    },
  },
};
