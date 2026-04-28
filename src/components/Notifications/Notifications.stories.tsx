import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";

import { useAppStore } from "@/lib/store";

import { Notifications } from "./Notifications";

function NotificationsStoryHarness({
  notifications,
}: {
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    createdAt: Date;
  }>;
}) {
  useEffect(() => {
    useAppStore.setState({ notifications });

    return () => {
      useAppStore.setState({ notifications: [] });
    };
  }, [notifications]);

  return (
    <div className="min-h-[320px] bg-zinc-100 p-8">
      <Notifications />
    </div>
  );
}

const meta = {
  title: "Components/Notifications",
  component: NotificationsStoryHarness,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof NotificationsStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

const makeNotification = (
  id: string,
  type: "success" | "error" | "warning" | "info",
  message: string,
) => ({
  id,
  type,
  message,
  createdAt: new Date(),
});

export const SingleSuccess: Story = {
  args: {
    notifications: [makeNotification("1", "success", "Request approved.")],
  },
};

export const SingleError: Story = {
  args: {
    notifications: [makeNotification("2", "error", "Unable to load balances.")],
  },
};

export const SingleWarning: Story = {
  args: {
    notifications: [
      makeNotification(
        "3",
        "warning",
        "Balance changed since request was submitted. Please review.",
      ),
    ],
  },
};

export const SingleInfo: Story = {
  args: {
    notifications: [
      makeNotification("4", "info", "Anniversary bonus applied successfully."),
    ],
  },
};

export const MultipleNotifications: Story = {
  args: {
    notifications: [
      makeNotification("5", "success", "Request submitted successfully."),
      makeNotification("6", "warning", "Request may not have been saved."),
      makeNotification("7", "error", "Insufficient balance."),
      makeNotification("8", "info", "Live balance refreshed."),
    ],
  },
};
