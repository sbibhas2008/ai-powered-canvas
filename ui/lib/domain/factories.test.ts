import { describe, it, expect } from "vitest";
import { createNode, createEdge } from "./factories";
import {
  DEFAULT_NODE_SIZE,
  DEFAULT_BASE_STYLE,
  DEFAULT_RENDER_META,
} from "./constants";

describe("createNode", () => {
  it("returns correct type and position with minimal params", () => {
    const node = createNode({ type: "rectangle", position: { x: 10, y: 20 } });

    expect(node.type).toBe("rectangle");
    expect(node.position).toEqual({ x: 10, y: 20 });
  });

  it("generates a string id when not provided", () => {
    const node = createNode({ type: "ellipse", position: { x: 0, y: 0 } });

    expect(typeof node.id).toBe("string");
    expect(node.id.length).toBeGreaterThan(0);
  });

  it("uses provided id", () => {
    const node = createNode({
      type: "diamond",
      position: { x: 0, y: 0 },
      id: "custom-id",
    });

    expect(node.id).toBe("custom-id");
  });

  it("defaults size to 200x100", () => {
    const node = createNode({ type: "rectangle", position: { x: 0, y: 0 } });

    expect(node.size).toEqual({ width: 200, height: 100 });
  });

  it("applies partial size overrides", () => {
    const node = createNode({
      type: "rectangle",
      position: { x: 0, y: 0 },
      size: { width: 300 },
    });

    expect(node.size).toEqual({ width: 300, height: 100 });
  });

  it("applies full size override", () => {
    const node = createNode({
      type: "rectangle",
      position: { x: 0, y: 0 },
      size: { width: 50, height: 50 },
    });

    expect(node.size).toEqual({ width: 50, height: 50 });
  });

  it("applies label", () => {
    const node = createNode({
      type: "text",
      position: { x: 0, y: 0 },
      label: "Hello",
    });

    expect(node.label).toBe("Hello");
  });

  it("uses default base style", () => {
    const node = createNode({ type: "rectangle", position: { x: 0, y: 0 } });

    expect(node.style).toEqual(DEFAULT_BASE_STYLE);
  });

  it("merges partial style overrides with defaults", () => {
    const node = createNode({
      type: "rectangle",
      position: { x: 0, y: 0 },
      style: { strokeColor: "#ff0000" },
    });

    expect(node.style.strokeColor).toBe("#ff0000");
    expect(node.style.backgroundColor).toBe(DEFAULT_BASE_STYLE.backgroundColor);
    expect(node.style.strokeWidth).toBe(DEFAULT_BASE_STYLE.strokeWidth);
  });

  it("uses default renderMeta", () => {
    const node = createNode({ type: "rectangle", position: { x: 0, y: 0 } });

    expect(node.renderMeta).toEqual(DEFAULT_RENDER_META);
  });

  it("applies custom renderMeta", () => {
    const custom = { excalidraw: { roughness: 2 } };
    const node = createNode({
      type: "rectangle",
      position: { x: 0, y: 0 },
      renderMeta: custom,
    });

    expect(node.renderMeta).toEqual(custom);
  });
});

describe("createEdge", () => {
  it("returns correct type, from, and to with minimal params", () => {
    const edge = createEdge({ from: "a", to: "b" });

    expect(edge.type).toBe("edge");
    expect(edge.from).toBe("a");
    expect(edge.to).toBe("b");
  });

  it("generates a string id when not provided", () => {
    const edge = createEdge({ from: "a", to: "b" });

    expect(typeof edge.id).toBe("string");
    expect(edge.id.length).toBeGreaterThan(0);
  });

  it("uses provided id", () => {
    const edge = createEdge({ from: "a", to: "b", id: "edge-1" });

    expect(edge.id).toBe("edge-1");
  });

  it("position and points are undefined when not provided", () => {
    const edge = createEdge({ from: "a", to: "b" });

    expect(edge.position).toBeUndefined();
    expect(edge.points).toBeUndefined();
  });

  it("preserves position and points when provided", () => {
    const edge = createEdge({
      from: "a",
      to: "b",
      position: { x: 100, y: 200 },
      points: [
        [0, 0],
        [150, 50],
      ],
    });

    expect(edge.position).toEqual({ x: 100, y: 200 });
    expect(edge.points).toEqual([
      [0, 0],
      [150, 50],
    ]);
  });

  it("applies label", () => {
    const edge = createEdge({ from: "a", to: "b", label: "connects" });

    expect(edge.label).toBe("connects");
  });

  it("uses default base style", () => {
    const edge = createEdge({ from: "a", to: "b" });

    expect(edge.style).toEqual(DEFAULT_BASE_STYLE);
  });

  it("merges partial style overrides with defaults", () => {
    const edge = createEdge({
      from: "a",
      to: "b",
      style: { strokeStyle: "dashed" },
    });

    expect(edge.style.strokeStyle).toBe("dashed");
    expect(edge.style.strokeColor).toBe(DEFAULT_BASE_STYLE.strokeColor);
  });

  it("uses default renderMeta", () => {
    const edge = createEdge({ from: "a", to: "b" });

    expect(edge.renderMeta).toEqual(DEFAULT_RENDER_META);
  });
});
