import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withCollabDoc } from "../headlessClient";
import { createEdge } from "@/lib/domain/factories";

interface ConnectNodesArgs {
  roomId: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  strokeColor?: string;
}

async function connectNodes({
  roomId,
  fromNodeId,
  toNodeId,
  label,
  strokeColor,
}: ConnectNodesArgs) {
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
    await withCollabDoc(roomId, async (_doc, _nodesMap, edgesMap) => {
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
  roomId: z
    .string()
    .describe("The room/document ID (e.g. 'default-room')"),
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
