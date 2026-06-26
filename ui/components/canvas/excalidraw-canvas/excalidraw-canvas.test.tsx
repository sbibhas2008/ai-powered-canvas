import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("ExcalidrawCanvas", () => {
  it("exports a component", async () => {
    const { ExcalidrawCanvas } = await import("./excalidraw-canvas");
    expect(ExcalidrawCanvas).toBeDefined();
    expect(typeof ExcalidrawCanvas).toBe("object");
  });
});
