/**
 * Roundtrip test: simulate what Excalidraw produces for an arrow between two
 * rectangles, convert to domain, convert back, and compare critical properties.
 *
 * Run: npx tsx lib/mapper/excalidraw.test.ts
 */

import { canvasToUiElements } from "./canvasToUiElements";
import { uiElementsToCanvas } from "./uiElementsToCanvas";
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
  x: 150,
  y: 135,
  width: 100,
  height: 25,
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
  x: 550,
  y: 135,
  width: 100,
  height: 25,
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

// Arrow drawn from right edge of rect1 to left edge of rect2
const arrow1 = fakeElement({
  id: "arrow1",
  type: "arrow",
  x: 300, // right edge of rect1
  y: 150, // vertical center of rect1
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

// ── Roundtrip ─────────────────────────────────────────────────────

console.log("=== Original Excalidraw Elements ===");
for (const el of originalElements) {
  const r = el as unknown as Record<string, unknown>;
  console.log(
    `  ${r.id}: type=${r.type}, x=${r.x}, y=${r.y}, w=${r.width}, h=${r.height}`,
    r.type === "arrow" ? `points=${JSON.stringify(r.points)}` : "",
    r.type === "text" ? `containerId=${r.containerId}` : "",
  );
}

const domain = uiElementsToCanvas(originalElements);

console.log("\n=== Domain Model ===");
console.log("Nodes:", JSON.stringify(domain.nodes, null, 2));
console.log("Edges:", JSON.stringify(domain.edges, null, 2));

const reconstructed = canvasToUiElements(domain);

console.log("\n=== Reconstructed Excalidraw Elements ===");
for (const el of reconstructed) {
  const r = el as unknown as Record<string, unknown>;
  console.log(
    `  ${r.id}: type=${r.type}, x=${r.x}, y=${r.y}, w=${r.width}, h=${r.height}`,
    r.type === "arrow"
      ? `points=${JSON.stringify(r.points)} startBinding=${JSON.stringify(r.startBinding)} endBinding=${JSON.stringify(r.endBinding)}`
      : "",
    r.type === "text" ? `containerId=${r.containerId} text="${r.text}"` : "",
  );
}

// ── Compare critical properties ───────────────────────────────────

console.log("\n=== Comparison ===");
let pass = true;

for (const orig of originalElements) {
  const origR = orig as unknown as Record<string, unknown>;
  const recon = reconstructed.find(
    (e) => (e as unknown as Record<string, unknown>).id === origR.id,
  );

  if (!recon) {
    console.log(`FAIL: ${origR.id} missing from reconstructed`);
    pass = false;
    continue;
  }

  const reconR = recon as unknown as Record<string, unknown>;
  const checks = ["x", "y", "width", "height", "type"];
  for (const key of checks) {
    if (origR[key] !== reconR[key]) {
      console.log(
        `FAIL: ${origR.id}.${key}: original=${origR[key]}, reconstructed=${reconR[key]}`,
      );
      pass = false;
    }
  }

  if (origR.type === "arrow") {
    const origPoints = JSON.stringify(origR.points);
    const reconPoints = JSON.stringify(reconR.points);
    if (origPoints !== reconPoints) {
      console.log(
        `FAIL: ${origR.id}.points: original=${origPoints}, reconstructed=${reconPoints}`,
      );
      pass = false;
    }

    // Check bindings
    const origStart = origR.startBinding as Record<string, unknown> | null;
    const reconStart = reconR.startBinding as Record<string, unknown> | null;
    if (origStart?.elementId !== reconStart?.elementId) {
      console.log(
        `FAIL: ${origR.id}.startBinding.elementId: original=${origStart?.elementId}, reconstructed=${reconStart?.elementId}`,
      );
      pass = false;
    }

    const origEnd = origR.endBinding as Record<string, unknown> | null;
    const reconEnd = reconR.endBinding as Record<string, unknown> | null;
    if (origEnd?.elementId !== reconEnd?.elementId) {
      console.log(
        `FAIL: ${origR.id}.endBinding.elementId: original=${origEnd?.elementId}, reconstructed=${reconEnd?.elementId}`,
      );
      pass = false;
    }
  }
}

console.log(pass ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(pass ? 0 : 1);
