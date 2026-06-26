import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from ".";

const meta = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-64 rounded-lg border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="py-2 text-sm">
            Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const HorizontalScroll: Story = {
  render: () => (
    <ScrollArea className="w-64 rounded-lg border">
      <div className="flex gap-4 p-4" style={{ width: "max-content" }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex h-32 w-32 shrink-0 items-center justify-center rounded-md bg-muted"
          >
            Card {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const LongContent: Story = {
  render: () => (
    <ScrollArea className="h-64 w-full rounded-lg border">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Document Title</h2>
        <p className="mt-2 text-muted-foreground">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
        {Array.from({ length: 30 }).map((_, i) => (
          <p key={i} className="mt-4 text-muted-foreground">
            Paragraph {i + 1}: Duis aute irure dolor in reprehenderit in
            voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};
