import { describe, it, expect } from "vitest";
import {
  extractPosition,
  extractSize,
  extractBaseStyle,
  extractRenderMeta,
  extractBoundLabel,
  extractBoundLabelWidth,
} from "./extractors";
import { DEFAULT_BASE_STYLE } from "@/lib/domain/constants";
import type { ExcalidrawRaw, TextByContainer } from "../../types";

function raw(overrides: Record<string, unknown> = {}): ExcalidrawRaw {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    strokeWidth: 2,
    strokeStyle: "solid",
    opacity: 100,
    fontSize: 20,
    fontFamily: "Virgil",
    roughness: 1,
    fillStyle: "solid",
    roundness: { type: 3 },
    ...overrides,
  };
}

describe("extractPosition", () => {
  it("returns x and y from raw element", () => {
    expect(extractPosition(raw({ x: 150, y: 250 }))).toEqual({
      x: 150,
      y: 250,
    });
  });

  it("handles zero coordinates", () => {
    expect(extractPosition(raw({ x: 0, y: 0 }))).toEqual({ x: 0, y: 0 });
  });
});

describe("extractSize", () => {
  it("returns width and height from raw element", () => {
    expect(extractSize(raw({ width: 300, height: 150 }))).toEqual({
      width: 300,
      height: 150,
    });
  });
});

describe("extractBaseStyle", () => {
  it("extracts all style fields", () => {
    const result = extractBaseStyle(
      raw({
        backgroundColor: "#ff0000",
        strokeColor: "#00ff00",
        strokeWidth: 4,
        strokeStyle: "dashed",
        opacity: 80,
        fontSize: 24,
        fontFamily: "Helvetica",
      }),
    );

    expect(result).toEqual({
      backgroundColor: "#ff0000",
      strokeColor: "#00ff00",
      strokeWidth: 4,
      strokeStyle: "dashed",
      opacity: 0.8,
      fontSize: 24,
      fontFamily: "Helvetica",
    });
  });

  it("scales opacity from 0-100 to 0-1", () => {
    expect(extractBaseStyle(raw({ opacity: 100 })).opacity).toBe(1);
    expect(extractBaseStyle(raw({ opacity: 50 })).opacity).toBe(0.5);
    expect(extractBaseStyle(raw({ opacity: 0 })).opacity).toBe(0);
  });

  it("falls back to defaults when fields are missing", () => {
    const result = extractBaseStyle(raw({}));

    expect(result.backgroundColor).toBe(DEFAULT_BASE_STYLE.backgroundColor);
    expect(result.strokeColor).toBe(DEFAULT_BASE_STYLE.strokeColor);
    expect(result.strokeWidth).toBe(DEFAULT_BASE_STYLE.strokeWidth);
    expect(result.fontSize).toBe(DEFAULT_BASE_STYLE.fontSize);
    expect(result.fontFamily).toBe(DEFAULT_BASE_STYLE.fontFamily);
  });

  it("defaults strokeStyle to solid when missing", () => {
    const result = extractBaseStyle(raw({ strokeStyle: undefined }));

    expect(result.strokeStyle).toBe("solid");
  });
});

describe("extractRenderMeta", () => {
  it("extracts all render meta fields", () => {
    const result = extractRenderMeta(
      raw({
        roughness: 2,
        fillStyle: "hachure",
        roundness: { type: 2 },
      }),
    );

    expect(result).toEqual({
      excalidraw: {
        roughness: 2,
        fillStyle: "hachure",
        roundness: { type: 2 },
      },
    });
  });

  it("defaults roughness to 1 when missing", () => {
    const result = extractRenderMeta(raw({ roughness: undefined }));

    expect(result.excalidraw?.roughness).toBe(1);
  });

  it("defaults fillStyle to solid when missing", () => {
    const result = extractRenderMeta(raw({ fillStyle: undefined }));

    expect(result.excalidraw?.fillStyle).toBe("solid");
  });

  it("handles null roundness", () => {
    const result = extractRenderMeta(raw({ roundness: null }));

    expect(result.excalidraw?.roundness).toBeNull();
  });
});

describe("extractBoundLabel", () => {
  it("returns text from bound element", () => {
    const labels: TextByContainer = new Map();
    labels.set("node-1", { text: "Hello World" } as never);

    expect(extractBoundLabel(labels, "node-1")).toBe("Hello World");
  });

  it("returns empty string when ID not found", () => {
    const labels: TextByContainer = new Map();

    expect(extractBoundLabel(labels, "missing-id")).toBe("");
  });

  it("returns empty string when map is empty", () => {
    const labels: TextByContainer = new Map();

    expect(extractBoundLabel(labels, "any")).toBe("");
  });
});

describe("extractBoundLabelWidth", () => {
  it("returns width from bound text element", () => {
    const labels: TextByContainer = new Map();
    labels.set("edge-1", { width: 132 } as never);

    expect(extractBoundLabelWidth(labels, "edge-1")).toBe(132);
  });

  it("returns undefined when ID not found", () => {
    const labels: TextByContainer = new Map();

    expect(extractBoundLabelWidth(labels, "missing-id")).toBeUndefined();
  });

  it("returns undefined when map is empty", () => {
    const labels: TextByContainer = new Map();

    expect(extractBoundLabelWidth(labels, "any")).toBeUndefined();
  });
});
