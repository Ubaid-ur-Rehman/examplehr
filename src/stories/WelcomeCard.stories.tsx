import type { Meta, StoryObj } from "@storybook/react";

function WelcomeCard() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-neutral-950">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
        ExampleHR
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-black dark:text-white">
        Time-off management, ready for development
      </h1>
      <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        Storybook is wired to the Next.js App Router project and ready for
        component work.
      </p>
    </div>
  );
}

const meta = {
  title: "ExampleHR/WelcomeCard",
  component: WelcomeCard,
  tags: ["autodocs"],
} satisfies Meta<typeof WelcomeCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
