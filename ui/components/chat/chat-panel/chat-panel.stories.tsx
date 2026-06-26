import type { Meta, StoryObj } from "@storybook/react";
import { ChatPanel } from ".";

const meta = {
  title: "Chat/ChatPanel",
  component: ChatPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex h-screen">
      <div className="flex-1 bg-background p-8">
        <h1 className="text-2xl font-bold">Canvas Area</h1>
        <p className="mt-2 text-muted-foreground">
          The chat panel is on the right side.
        </p>
      </div>
      <ChatPanel />
    </div>
  ),
};
