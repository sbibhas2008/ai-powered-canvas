import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from ".";

describe("Textarea", () => {
  it("renders", () => {
    render(<Textarea aria-label="Test textarea" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(<Textarea aria-label="Test placeholder" placeholder="Type here..." />);
    expect(screen.getByPlaceholderText("Type here...")).toBeInTheDocument();
  });

  it("handles value changes", async () => {
    const handleChange = vi.fn();
    render(<Textarea aria-label="Test change" onChange={handleChange} />);
    await userEvent.type(screen.getByRole("textbox", { name: /test change/i }), "hello");
    expect(handleChange).toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Textarea aria-label="Test disabled" disabled />);
    expect(screen.getByRole("textbox", { name: /test disabled/i })).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<Textarea aria-label="Test class" className="custom-class" />);
    expect(screen.getByRole("textbox", { name: /test class/i }).className).toContain("custom-class");
  });

  it("supports rows prop", () => {
    render(<Textarea aria-label="Test rows" rows={5} />);
    expect(screen.getByRole("textbox", { name: /test rows/i })).toHaveAttribute("rows", "5");
  });
});
