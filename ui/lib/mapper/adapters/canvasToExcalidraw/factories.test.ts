import { describe, it, expect } from "vitest";
import {
  createExcalidrawBase,
  createTextElement,
  createShapeElement,
  createBoundTextElement,
  createArrowBindings,
  createArrowElement,
  createEdgeLabel,
} from "./factories";
import { stableHash } from "../../utils";
import {
  DEFAULT_BASE_STYLE,
  DEFAULT_NODE_SIZE,
  DEFAULT_RENDER_META,
} from "@/lib/domain/constants";
import type { Node, Edge } from "@/lib/domain/types";
import type { MutableExcalidrawElement } from "../../types";

// Cast through Record to access union-specific properties (text, points, etc.)
function asRaw(el: MutableExcalidrawElement) {
  return el as unknown as Record<string, unknown>;
}

function makeNode(overrides: Partial<Node> = {}): Node {
  return {
    id: "node-1",
    type: "rectangle",
    position: { x: 100, y: 200 },
    size: { width: 200, height: 100 },
    style: { ...DEFAULT_BASE_STYLE },
    renderMeta: { ...DEFAULT_RENDER_META },
    ...overrides,
  };
}

function makeEdge(overrides: Partial<Edge> = {}): Edge {
  return {
    id: "edge-1",
    type: "edge",
    from: "node-1",
    to: "node-2",
    style: { ...DEFAULT_BASE_STYLE },
    renderMeta: { ...DEFAULT_RENDER_META },
    ...overrides,
  };
}

describe("createExcalidrawBase", () => {
  it("sets id and applies default style fields", () => {
    const base = createExcalidrawBase(makeNode({ id: "abc" }));

    expect(base.id).toBe("abc");
    expect(base.strokeColor).toBe(DEFAULT_BASE_STYLE.strokeColor);
    expect(base.backgroundColor).toBe(DEFAULT_BASE_STYLE.backgroundColor);
    expect(base.strokeWidth).toBe(DEFAULT_BASE_STYLE.strokeWidth);
    expect(base.opacity).toBe(100);
  });

  it("scales opacity from 0-1 to 0-100", () => {
    const base = createExcalidrawBase(
      makeNode({ style: { opacity: 0.5 } }),
    );

    expect(base.opacity).toBe(50);
  });

  it("uses stableHash for seed and versionNonce", () => {
    const base = createExcalidrawBase(makeNode({ id: "test-id" }));

    expect(base.seed).toBe(stableHash("test-id"));
    expect(base.versionNonce).toBe(stableHash("test-id:nonce"));
  });

  it("applies renderMeta excalidraw fields", () => {
    const base = createExcalidrawBase(makeNode());

    expect(base.roughness).toBe(DEFAULT_RENDER_META.excalidraw?.roughness);
    expect(base.fillStyle).toBe(DEFAULT_RENDER_META.excalidraw?.fillStyle);
    expect(base.roundness).toEqual(DEFAULT_RENDER_META.excalidraw?.roundness);
  });

  it("sets structural fields to safe defaults", () => {
    const base = createExcalidrawBase(makeNode());

    expect(base.isDeleted).toBe(false);
    expect(base.groupIds).toEqual([]);
    expect(base.frameId).toBeNull();
    expect(base.link).toBeNull();
    expect(base.locked).toBe(false);
    expect(base.boundElements).toEqual([]);
  });
});

describe("createShapeElement", () => {
  it("maps node position and size to x, y, width, height", () => {
    const node = makeNode({
      position: { x: 50, y: 75 },
      size: { width: 300, height: 150 },
    });
    const el = createShapeElement(node, []);

    expect(el.x).toBe(50);
    expect(el.y).toBe(75);
    expect(el.width).toBe(300);
    expect(el.height).toBe(150);
  });

  it("preserves node type", () => {
    const node = makeNode({ type: "ellipse" });
    const el = createShapeElement(node, []);

    expect(el.type).toBe("ellipse");
  });

  it("applies bound elements", () => {
    const bounds = [
      { id: "label-1", type: "text" as const },
      { id: "arrow-1", type: "arrow" as const },
    ];
    const el = createShapeElement(makeNode(), bounds);

    expect(el.boundElements).toEqual(bounds);
  });

  it("falls back to DEFAULT_NODE_SIZE when node.size is missing", () => {
    const node = makeNode({ size: undefined as never });
    const el = createShapeElement(node, []);

    expect(el.width).toBe(DEFAULT_NODE_SIZE.width);
    expect(el.height).toBe(DEFAULT_NODE_SIZE.height);
  });
});

describe("createTextElement", () => {
  it("sets type to text with correct position", () => {
    const el = createTextElement({
      id: "t1",
      x: 10,
      y: 20,
      width: 100,
      text: "Hello",
      style: DEFAULT_BASE_STYLE,
      renderMeta: DEFAULT_RENDER_META,
      containerId: null,
    });

    expect(el.type).toBe("text");
    expect(el.x).toBe(10);
    expect(el.y).toBe(20);
    expect(el.width).toBe(100);
  });

  it("sets height to fontSize", () => {
    const el = createTextElement({
      id: "t1",
      x: 0,
      y: 0,
      width: 100,
      text: "Hi",
      style: { fontSize: 32 },
      renderMeta: DEFAULT_RENDER_META,
      containerId: null,
    });

    expect(el.height).toBe(32);
    expect(asRaw(el).fontSize).toBe(32);
  });

  it("sets text-related fields", () => {
    const el = createTextElement({
      id: "t1",
      x: 0,
      y: 0,
      width: 100,
      text: "Label",
      style: DEFAULT_BASE_STYLE,
      renderMeta: DEFAULT_RENDER_META,
      containerId: null,
    });

    expect(asRaw(el).text).toBe("Label");
    expect(asRaw(el).originalText).toBe("Label");
    expect(asRaw(el).textAlign).toBe("center");
    expect(asRaw(el).verticalAlign).toBe("middle");
    expect(asRaw(el).autoResize).toBe(true);
  });

  it("applies transparent background when containerId is set", () => {
    const el = createTextElement({
      id: "t1",
      x: 0,
      y: 0,
      width: 100,
      text: "Hi",
      style: DEFAULT_BASE_STYLE,
      renderMeta: DEFAULT_RENDER_META,
      containerId: "parent-1",
    });

    expect(asRaw(el).containerId).toBe("parent-1");
    expect(el.backgroundColor).toBe("transparent");
  });

  it("does not apply transparent background override when no containerId", () => {
    const el = createTextElement({
      id: "t1",
      x: 0,
      y: 0,
      width: 100,
      text: "Hi",
      style: DEFAULT_BASE_STYLE,
      renderMeta: DEFAULT_RENDER_META,
      containerId: null,
    });

    // backgroundColor comes from createExcalidrawBase via style defaults,
    // not from the container-specific transparent override
    expect(el.backgroundColor).toBe(DEFAULT_BASE_STYLE.backgroundColor);
  });
});

describe("createBoundTextElement", () => {
  it("positions text at the node origin and vertically centers within the container", () => {
    const node = makeNode({
      position: { x: 100, y: 200 },
      size: { width: 200, height: 100 },
      label: "Box",
    });
    const el = createBoundTextElement(node);

    expect(el.id).toBe("node-1-label");
    expect(el.x).toBe(100);
    expect(el.y).toBe(240); // 200 + (100 - 20) / 2
    expect(el.width).toBe(200);
    expect(asRaw(el).text).toBe("Box");
    expect(asRaw(el).containerId).toBe("node-1");
  });
});

describe("createArrowBindings", () => {
  it("returns bindings for both nodes", () => {
    const from = makeNode({ id: "from-node" });
    const to = makeNode({ id: "to-node" });
    const bindings = createArrowBindings(from, to);

    expect(bindings.startBinding).toEqual({
      elementId: "from-node",
      focus: 0,
      gap: 1,
      fixedPoint: null,
    });
    expect(bindings.endBinding).toEqual({
      elementId: "to-node",
      focus: 0,
      gap: 1,
      fixedPoint: null,
    });
  });

  it("returns null bindings when nodes are undefined", () => {
    const bindings = createArrowBindings(undefined, undefined);

    expect(bindings.startBinding).toBeNull();
    expect(bindings.endBinding).toBeNull();
  });

  it("handles only start node defined", () => {
    const from = makeNode({ id: "from-node" });
    const bindings = createArrowBindings(from, undefined);

    expect(bindings.startBinding).not.toBeNull();
    expect(bindings.endBinding).toBeNull();
  });

  it("handles only end node defined", () => {
    const to = makeNode({ id: "to-node" });
    const bindings = createArrowBindings(undefined, to);

    expect(bindings.startBinding).toBeNull();
    expect(bindings.endBinding).not.toBeNull();
  });
});

describe("createArrowElement", () => {
  it("sets position and dimensions from arrow geometry", () => {
    const edge = makeEdge();
    const arrow = { x: 300, y: 150, points: [[0, 0], [200, 0]] as [number, number][] };
    const el = createArrowElement(edge, arrow, undefined, undefined);

    expect(el.x).toBe(300);
    expect(el.y).toBe(150);
    expect(el.width).toBe(200);
    expect(el.height).toBe(0);
    expect(asRaw(el).points).toEqual([[0, 0], [200, 0]]);
  });

  it("computes width/height from absolute last point delta", () => {
    const edge = makeEdge();
    const arrow = { x: 0, y: 0, points: [[0, 0], [-150, 80]] as [number, number][] };
    const el = createArrowElement(edge, arrow, undefined, undefined);

    expect(el.width).toBe(150);
    expect(el.height).toBe(80);
  });

  it("sets arrowhead and structural fields", () => {
    const edge = makeEdge();
    const arrow = { x: 0, y: 0, points: [[0, 0], [100, 0]] as [number, number][] };
    const el = createArrowElement(edge, arrow, undefined, undefined);

    expect(asRaw(el).startArrowhead).toBeNull();
    expect(asRaw(el).endArrowhead).toBe("arrow");
    expect(asRaw(el).elbowed).toBe(false);
  });

  it("includes text bound element when edge has a label", () => {
    const edge = makeEdge({ id: "arr-1", label: "connects" });
    const arrow = { x: 0, y: 0, points: [[0, 0], [100, 0]] as [number, number][] };
    const el = createArrowElement(edge, arrow, undefined, undefined);

    expect(el.boundElements).toEqual([{ id: "arr-1-label", type: "text" }]);
  });

  it("returns empty boundElements when no label", () => {
    const edge = makeEdge({ label: undefined });
    const arrow = { x: 0, y: 0, points: [[0, 0], [100, 0]] as [number, number][] };
    const el = createArrowElement(edge, arrow, undefined, undefined);

    expect(el.boundElements).toEqual([]);
  });

  it("applies arrow bindings from nodes", () => {
    const from = makeNode({ id: "n1" });
    const to = makeNode({ id: "n2" });
    const edge = makeEdge();
    const arrow = { x: 0, y: 0, points: [[0, 0], [100, 0]] as [number, number][] };
    const el = createArrowElement(edge, arrow, from, to);

    expect(asRaw(el).startBinding).toEqual({
      elementId: "n1",
      focus: 0,
      gap: 1,
      fixedPoint: null,
    });
    expect(asRaw(el).endBinding).toEqual({
      elementId: "n2",
      focus: 0,
      gap: 1,
      fixedPoint: null,
    });
  });
});

describe("createEdgeLabel", () => {
  it("centers label on the arrow midpoint", () => {
    const edge = makeEdge({ label: "yes" });
    const arrow = { x: 100, y: 200, points: [[0, 0], [200, 0]] as [number, number][] };
    const el = createEdgeLabel(edge, arrow);

    expect(el.id).toBe("edge-1-label");
    expect(el.x).toBe(200); // 100 + 200/2
    expect(el.y).toBe(200); // 200 + 0/2
    expect(asRaw(el).text).toBe("yes");
    expect(asRaw(el).containerId).toBe("edge-1");
  });

  it("scales label width with fontSize", () => {
    const edge20 = makeEdge({ label: "test", style: { fontSize: 20 } });
    const edge24 = makeEdge({ label: "test", style: { fontSize: 24 } });
    const arrow = { x: 0, y: 0, points: [[0, 0], [100, 0]] as [number, number][] };

    const w20 = createEdgeLabel(edge20, arrow).width;
    const w24 = createEdgeLabel(edge24, arrow).width;

    expect(w24).toBeGreaterThan(w20);
  });

  it("wider label produces wider width at same fontSize", () => {
    const short = makeEdge({ label: "ok" });
    const long = makeEdge({ label: "this is a much longer label" });
    const arrow = { x: 0, y: 0, points: [[0, 0], [100, 0]] as [number, number][] };

    const wShort = createEdgeLabel(short, arrow).width;
    const wLong = createEdgeLabel(long, arrow).width;

    expect(wLong).toBeGreaterThan(wShort);
  });

  it("uses DEFAULT_BASE_STYLE.fontSize when edge has no fontSize", () => {
    const edge = makeEdge({ label: "test", style: {} });
    const arrow = { x: 0, y: 0, points: [[0, 0], [100, 0]] as [number, number][] };
    const el = createEdgeLabel(edge, arrow);

    // At fontSize 20: max(80, 4*8 + 40) = max(80, 72) = 80
    expect(el.width).toBe(80);
  });

  it("uses stored labelWidth when available", () => {
    const edge = makeEdge({ label: "test", labelWidth: 132 });
    const arrow = { x: 0, y: 0, points: [[0, 0], [100, 0]] as [number, number][] };
    const el = createEdgeLabel(edge, arrow);

    expect(el.width).toBe(132);
  });

  it("sets autoResize to false for cross-client consistency", () => {
    const edge = makeEdge({ label: "test" });
    const arrow = { x: 0, y: 0, points: [[0, 0], [100, 0]] as [number, number][] };
    const el = createEdgeLabel(edge, arrow);

    expect(asRaw(el).autoResize).toBe(false);
  });
});
