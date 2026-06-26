import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Canvas/ExcalidrawCanvas",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex h-96 w-full items-center justify-center rounded-lg border bg-background">
      <p className="text-muted-foreground">
        ExcalidrawCanvas (dynamic import, requires browser)
      </p>
    </div>
  ),
};
