import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./agent";
import {
  DEFAULT_BASE_STYLE,
  DEFAULT_NODE_SIZE,
  LABEL_SIZING,
} from "@/lib/domain/constants";

describe("buildSystemPrompt", () => {
  it("mentions default size matching DEFAULT_NODE_SIZE", () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain(
      `${DEFAULT_NODE_SIZE.width}×${DEFAULT_NODE_SIZE.height}`,
    );
  });

  it("mentions circle minimum derived from DEFAULT_NODE_SIZE", () => {
    const prompt = buildSystemPrompt();
    const minCircleSize = Math.round(
      (DEFAULT_NODE_SIZE.width * DEFAULT_BASE_STYLE.fontSize) / 20,
    );

    expect(prompt).toContain(`${minCircleSize}×${minCircleSize}`);
  });

  it("mentions padding derived from DEFAULT_BASE_STYLE.fontSize", () => {
    const prompt = buildSystemPrompt();
    const labelPadding = DEFAULT_BASE_STYLE.fontSize * LABEL_SIZING.paddingRatio;

    expect(prompt).toContain(`~${labelPadding}px padding`);
  });

  it("mentions border-to-border arrows (not center-to-center)", () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain("border of the source node");
    expect(prompt).not.toContain("center of the source node");
  });

  it("does not tell the model to pick a room", () => {
    const prompt = buildSystemPrompt();

    expect(prompt).not.toContain("Default room");
    expect(prompt).not.toContain("default-room");
  });

  it("mentions label width scales with font size", () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain("label width scales with font size");
  });
});
