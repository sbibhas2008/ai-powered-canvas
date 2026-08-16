import { describe, it, expect } from "vitest";
import type { z } from "zod";
import { drawShapeTool, listElementsTool, connectNodesTool } from "./index";

const tools = [drawShapeTool, listElementsTool, connectNodesTool];

function argNames(tool: (typeof tools)[number]): string[] {
  return Object.keys((tool.schema as z.ZodObject<z.ZodRawShape>).shape);
}

describe("tool schemas", () => {
  it.each(tools.map((tool) => [tool.name, tool] as const))(
    "%s does not accept roomId from the model",
    (_name, tool) => {
      expect(argNames(tool)).not.toContain("roomId");
    },
  );

  it("still exposes the arguments the agent needs", () => {
    expect(argNames(drawShapeTool)).toContain("shapeType");
    expect(argNames(connectNodesTool)).toEqual(
      expect.arrayContaining(["fromNodeId", "toNodeId"]),
    );
  });

  it("leaves list_elements with no model-supplied arguments", () => {
    expect(argNames(listElementsTool)).toEqual([]);
  });
});
