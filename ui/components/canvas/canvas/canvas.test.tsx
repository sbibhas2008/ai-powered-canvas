import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

describe("Canvas", () => {
  it("renders without crashing", async () => {
    const { Canvas } = await import("./canvas");
    const { container } = render(<Canvas roomId="test-room" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
