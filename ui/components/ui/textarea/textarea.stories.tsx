import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from ".";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Type something...",
  },
};

export const WithValue: Story = {
  args: {
    value: "This is some pre-filled text.",
    readOnly: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Cannot type here",
  },
};

export const WithRows: Story = {
  args: {
    rows: 6,
    placeholder: "Multi-line textarea...",
  },
};

export const InvalidState: Story = {
  args: {
    "aria-invalid": true,
    placeholder: "This field has an error",
  },
};

export const AutoResize: Story = {
  args: {
    placeholder: "This textarea auto-resizes as you type more content...",
    className: "min-h-16 max-h-32",
  },
};
