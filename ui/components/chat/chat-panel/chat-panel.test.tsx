import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("ChatPanel", () => {
  it("renders chat panel", async () => {
    const { ChatPanel } = await import("./chat-panel");
    render(<ChatPanel />);
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    const { ChatPanel } = await import("./chat-panel");
    render(<ChatPanel />);
    expect(screen.getAllByText("No messages yet").length).toBeGreaterThan(0);
  });
});
