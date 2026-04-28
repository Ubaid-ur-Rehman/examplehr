import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";

import { BalanceCard } from "./BalanceCard";

const meta = {
  title: "Components/BalanceCard",
  component: BalanceCard,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BalanceCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const freshDate = new Date();
const staleDate = new Date(Date.now() - 2 * 60 * 1000);

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Fresh: Story = {
  args: {
    balance: {
      employeeId: "emp-1",
      locationId: "loc-nyc",
      available: 12,
      pending: 0,
      lastSyncedAt: freshDate,
      isFresh: true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("New York")).toBeInTheDocument();
    await expect(canvas.getByText("12 days")).toBeInTheDocument();
  },
};

export const Stale: Story = {
  args: {
    balance: {
      employeeId: "emp-2",
      locationId: "loc-chicago",
      available: 10,
      pending: 1,
      lastSyncedAt: staleDate,
      isFresh: false,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Chicago')).toBeInTheDocument()
    await expect(canvas.getByText(/balance may be outdated/i)).toBeInTheDocument()
  },
};

export const OptimisticPending: Story = {
  args: {
    balance: {
      employeeId: "emp-1",
      locationId: "loc-sf",
      available: 6,
      pending: 2,
      lastSyncedAt: freshDate,
      isFresh: true,
      optimisticStatus: "submitting",
      originalAvailable: 8,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/pending/i)).toBeInTheDocument()
    await expect(canvas.getByText('6 days')).toBeInTheDocument()
  },
};

export const OptimisticRolledBack: Story = {
  args: {
    balance: {
      employeeId: "emp-1",
      locationId: "loc-sf",
      available: 6,
      pending: 0,
      lastSyncedAt: freshDate,
      isFresh: true,
      optimisticStatus: "rolled-back",
      originalAvailable: 8,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/failed|rolled.back/i)).toBeInTheDocument()
  },
};

export const Error: Story = {
  args: {
    error: true,
  },
};
export const BalanceRefreshedMidSession: Story = {
  args: {
    balance: {
      employeeId: 'emp-1',
      locationId: 'loc-nyc',
      available: 17,
      pending: 0,
      lastSyncedAt: freshDate,
      isFresh: true,
    },
    highlightRefresh: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/balance updated by hcm/i)).toBeInTheDocument()
    await expect(canvas.getByText('17 days')).toBeInTheDocument()
  },
}

export const HCMSilentlyWrong: Story = {
  args: {
    balance: {
      employeeId: 'emp-1',
      locationId: 'loc-nyc',
      available: 12,
      pending: 0,
      lastSyncedAt: freshDate,
      isFresh: false,
    },
    silentFailure: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/may not have saved/i)).toBeInTheDocument()
  },
}
