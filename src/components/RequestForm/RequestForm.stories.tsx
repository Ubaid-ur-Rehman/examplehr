import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

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

const meta = {
  title: "Components/RequestForm",
  component: RequestForm,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[640px]">
        <Story />
      </div>
    ),
  ],
  args: {
    employeeId: "emp-1",
    balances,
    onSubmit: () => undefined,
    isSubmitting: false,
    submitError: null,
  },
} satisfies Meta<typeof RequestForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

export const ValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Start date"), "2026-05-01");
    await userEvent.type(canvas.getByLabelText("End date"), "2026-05-03");
    await userEvent.clear(canvas.getByLabelText("Days"));
    await userEvent.type(canvas.getByLabelText("Days"), "20");
    await userEvent.type(canvas.getByLabelText("Reason"), "Family trip");

    await expect(
      canvas.getByText("Days cannot exceed available balance."),
    ).toBeInTheDocument();
  },
};

export const SubmitError: Story = {
  args: {
    submitError: "Unable to submit request. Please try again.",
  },
};

export const NoBalances: Story = {
  args: {
    balances: [],
  },
};
