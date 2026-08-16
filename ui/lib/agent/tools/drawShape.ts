import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withCollabWrite } from "../headlessClient";
import { requireRoomId, type AgentToolRuntime } from "../context";
import type { NodeType } from "@/lib/domain/types";
import { createNode } from "@/lib/domain/factories";

interface DrawShapeArgs {
  shapeType: NodeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  strokeColor?: string;
  backgroundColor?: string;
}

async function drawShape(
  {
    shapeType,
    x,
    y,
    width,
    height,
    label,
    strokeColor,
    backgroundColor,
  }: DrawShapeArgs,
  runtime: AgentToolRuntime,
) {
  const roomId = requireRoomId(runtime);
  const startTime = Date.now();
  const labelPart = label ? ` "${label}"` : "";
  console.log(
    `[drawShape] called: room=${roomId} type=${shapeType} pos=(${x},${y}) label=${labelPart || "none"}`,
  );

  const node = createNode({
    type: shapeType,
    position: { x, y },
    size: width != null || height != null ? { width, height } : undefined,
    label,
    style: {
      ...(strokeColor ? { strokeColor } : {}),
      ...(backgroundColor ? { backgroundColor } : {}),
    },
  });

  try {
    await withCollabWrite(roomId, ({ nodesMap }) => {
      nodesMap.set(node.id, node);
    });

    const duration = Date.now() - startTime;
    console.log(
      `[drawShape] success: room=${roomId} id=${node.id} (${duration}ms)`,
    );
    return `Drew ${shapeType}${labelPart} at (${x}, ${y}) with size ${node.size.width}x${node.size.height}. ID: ${node.id}`;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[drawShape] failed: room=${roomId} (${duration}ms)`, error);
    throw error;
  }
}

const drawShapeSchema = z.object({
  shapeType: z
    .enum(["rectangle", "ellipse", "diamond", "text"])
    .describe("The type of shape to draw"),
  x: z.number().describe("X coordinate in pixels from the left edge. Range: 0-1200"),
  y: z.number().describe("Y coordinate in pixels from the top edge. Range: 0-800"),
  width: z
    .number()
    .optional()
    .describe("Width of the shape in pixels (default: 200)"),
  height: z
    .number()
    .optional()
    .describe("Height of the shape in pixels (default: 100)"),
  label: z
    .string()
    .optional()
    .describe("Optional text label to display inside the shape"),
  strokeColor: z
    .string()
    .optional()
    .describe("Border color as hex (e.g. '#e11d48' for red)"),
  backgroundColor: z
    .string()
    .optional()
    .describe("Fill color as hex (e.g. '#fecdd3' for light red)"),
});

export const drawShapeTool = tool(drawShape, {
  name: "draw_shape",
  description:
    "Draw a shape (rectangle, ellipse, diamond, or text) on the canvas. " +
    "The shape appears instantly for all connected users.",
  schema: drawShapeSchema,
});
