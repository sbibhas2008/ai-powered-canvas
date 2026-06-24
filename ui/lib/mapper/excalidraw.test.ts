import { describe, it, expect } from "vitest";
import { translateCanvasToExcalidraw } from "./adapters/canvasToExcalidraw";
import { translateExcalidrawToCanvas } from "./adapters/excalidrawToCanvas";
import type { CanvasState } from "@/lib/domain/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

// ── Simulate realistic Excalidraw output ──────────────────────────

function fakeElement(overrides: Record<string, unknown>) {
  return {
    id: "test",
    type: "rectangle",
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: 12345,
    version: 3,
    versionNonce: 67890,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    index: "a0",
    roundness: { type: 3 },
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    ...overrides,
  } as unknown as ExcalidrawElement;
}

const rect1 = fakeElement({
  id: "rect1",
  type: "rectangle",
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  boundElements: [
    { id: "rect1-label", type: "text" },
    { id: "arrow1", type: "arrow" },
  ],
});

const rect1Label = fakeElement({
  id: "rect1-label",
  type: "text",
  x: 200,
  y: 150,
  width: 200,
  height: 20,
  text: "Box A",
  originalText: "Box A",
  fontSize: 20,
  fontFamily: 5,
  textAlign: "center",
  verticalAlign: "middle",
  containerId: "rect1",
  autoResize: true,
  lineHeight: 1.25,
});

const rect2 = fakeElement({
  id: "rect2",
  type: "rectangle",
  x: 500,
  y: 100,
  width: 200,
  height: 100,
  boundElements: [
    { id: "rect2-label", type: "text" },
    { id: "arrow1", type: "arrow" },
  ],
});

const rect2Label = fakeElement({
  id: "rect2-label",
  type: "text",
  x: 600,
  y: 150,
  width: 200,
  height: 20,
  text: "Box B",
  originalText: "Box B",
  fontSize: 20,
  fontFamily: 5,
  textAlign: "center",
  verticalAlign: "middle",
  containerId: "rect2",
  autoResize: true,
  lineHeight: 1.25,
});

const arrow1 = fakeElement({
  id: "arrow1",
  type: "arrow",
  x: 300,
  y: 150,
  width: 200,
  height: 0,
  points: [
    [0, 0],
    [200, 0],
  ],
  startBinding: {
    elementId: "rect1",
    focus: 0,
    gap: 1,
    fixedPoint: null,
  },
  endBinding: {
    elementId: "rect2",
    focus: 0,
    gap: 1,
    fixedPoint: null,
  },
  startArrowhead: null,
  endArrowhead: "arrow",
  elbowed: false,
  boundElements: [],
});

const originalElements = [rect1, rect1Label, rect2, rect2Label, arrow1];

// ── Tests ─────────────────────────────────────────────────────────

describe("Excalidraw roundtrip mapper", () => {
  const domain: CanvasState = translateExcalidrawToCanvas(originalElements);
  const reconstructed = translateCanvasToExcalidraw(domain);

  it("preserves all element IDs", () => {
    for (const orig of originalElements) {
      const r = orig as unknown as Record<string, unknown>;
      const recon = reconstructed.find(
        (e) => (e as unknown as Record<string, unknown>).id === r.id,
      );
      expect(recon).toBeDefined();
    }
  });

  it("preserves position and size for all elements", () => {
    for (const orig of originalElements) {
      const origR = orig as unknown as Record<string, unknown>;
      const recon = reconstructed.find(
        (e) => (e as unknown as Record<string, unknown>).id === origR.id,
      ) as unknown as Record<string, unknown>;

      expect(recon.x).toBe(origR.x);
      expect(recon.y).toBe(origR.y);
      expect(recon.width).toBe(origR.width);
      expect(recon.height).toBe(origR.height);
      expect(recon.type).toBe(origR.type);
    }
  });

  it("preserves arrow points", () => {
    const origR = arrow1 as unknown as Record<string, unknown>;
    const recon = reconstructed.find(
      (e) => (e as unknown as Record<string, unknown>).id === "arrow1",
    ) as unknown as Record<string, unknown>;

    expect(JSON.stringify(recon.points)).toBe(JSON.stringify(origR.points));
  });

  it("preserves arrow bindings", () => {
    const recon = reconstructed.find(
      (e) => (e as unknown as Record<string, unknown>).id === "arrow1",
    ) as unknown as Record<string, unknown>;

    expect((recon.startBinding as Record<string, unknown>)?.elementId).toBe(
      "rect1",
    );
    expect((recon.endBinding as Record<string, unknown>)?.elementId).toBe(
      "rect2",
    );
  });

  it("preserves text container bindings", () => {
    const reconLabel = reconstructed.find(
      (e) => (e as unknown as Record<string, unknown>).id === "rect1-label",
    ) as unknown as Record<string, unknown>;

    expect(reconLabel.containerId).toBe("rect1");
    expect(reconLabel.text).toBe("Box A");
  });
});
