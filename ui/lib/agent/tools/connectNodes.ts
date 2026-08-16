import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withCollabWrite } from "../headlessClient";
import { requireRoomId, type AgentToolRuntime } from "../context";
import { createEdge } from "@/lib/domain/factories";

interface ConnectNodesArgs {
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  strokeColor?: string;
}

async function connectNodes(
  { fromNodeId, toNodeId, label, strokeColor }: ConnectNodesArgs,
  runtime: AgentToolRuntime,
) {
  const roomId = requireRoomId(runtime);
  const startTime = Date.now();
  console.log(
    `[connectNodes] called: room=${roomId} from=${fromNodeId} to=${toNodeId}`,
  );

  const edge = createEdge({
    from: fromNodeId,
    to: toNodeId,
    label,
    style: strokeColor ? { strokeColor } : undefined,
  });

  try {
    await withCollabWrite(roomId, ({ edgesMap }) => {
      edgesMap.set(edge.id, edge);
    });

    const duration = Date.now() - startTime;
    console.log(
      `[connectNodes] success: room=${roomId} edgeId=${edge.id} (${duration}ms)`,
    );
    return `Connected ${fromNodeId} -> ${toNodeId}. Edge ID: ${edge.id}`;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[connectNodes] failed: room=${roomId} (${duration}ms)`,
      error,
    );
    throw error;
  }
}

const connectNodesSchema = z.object({
  fromNodeId: z
    .string()
    .describe("The ID of the source node (use list_elements to find IDs)"),
  toNodeId: z
    .string()
    .describe("The ID of the target node (use list_elements to find IDs)"),
  label: z
    .string()
    .optional()
    .describe("Optional text label to display on the edge/arrow"),
  strokeColor: z
    .string()
    .optional()
    .describe("Edge color as hex (e.g. '#e11d48' for red)"),
});

export const connectNodesTool = tool(connectNodes, {
  name: "connect_nodes",
  description:
    "Connect two existing nodes with an arrow/edge. " +
    "Use list_elements first to get the node IDs. " +
    "The arrow appears instantly for all connected users.",
  schema: connectNodesSchema,
});
