import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withCollabDoc } from "../headlessClient";
import { requireRoomId, type AgentToolRuntime } from "../context";
import type { Node, Edge } from "@/lib/domain/types";

type NodeSummary = Pick<Node, "id" | "type" | "label" | "position" | "size">;
type EdgeSummary = Pick<Edge, "id" | "type" | "from" | "to" | "label">;

function formatSection<T>(
  title: string,
  items: T[],
  formatItem: (item: T) => string,
): string {
  if (items.length === 0) return "";
  return `${title} (${items.length}):\n${items.map(formatItem).join("")}`;
}

function formatNode(n: NodeSummary): string {
  const label = n.label ? ` "${n.label}"` : "";
  return `  - ${n.id}: ${n.type}${label} at (${n.position.x}, ${n.position.y}) size ${n.size.width}x${n.size.height}\n`;
}

function formatEdge(e: EdgeSummary): string {
  const label = e.label ? ` "${e.label}"` : "";
  return `  - ${e.id}: ${e.from} -> ${e.to}${label}\n`;
}

async function listElements(_args: unknown, runtime: AgentToolRuntime) {
  const roomId = requireRoomId(runtime);
  const startTime = Date.now();
  console.log(`[listElements] called: room=${roomId}`);

  try {
    const result = await withCollabDoc(roomId, async (_doc, nodesMap, edgesMap) => {
      const nodes: NodeSummary[] = [];
      nodesMap.forEach((node, id) => {
        nodes.push({
          id,
          type: node.type,
          label: node.label,
          position: node.position,
          size: node.size,
        });
      });

      const edges: EdgeSummary[] = [];
      edgesMap.forEach((edge: Edge, id: string) => {
        edges.push({
          id,
          type: "edge",
          from: edge.from,
          to: edge.to,
          label: edge.label,
        });
      });

      return { nodes, edges };
    });

    const nodeCount = result.nodes.length;
    const edgeCount = result.edges.length;
    const duration = Date.now() - startTime;
    console.log(
      `[listElements] success: room=${roomId} nodes=${nodeCount} edges=${edgeCount} (${duration}ms)`,
    );

    if (nodeCount === 0 && edgeCount === 0) {
      return "Canvas is empty. No elements found.";
    }

    const output = [
      formatSection("Nodes", result.nodes, formatNode),
      formatSection("Edges", result.edges, formatEdge),
    ]
      .filter(Boolean)
      .join("\n");

    return output;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[listElements] failed: room=${roomId} (${duration}ms)`,
      error,
    );
    throw error;
  }
}

const listElementsSchema = z.object({});

export const listElementsTool = tool(listElements, {
  name: "list_elements",
  description:
    "List all elements (nodes and edges) currently on the canvas for a given room. " +
    "Returns each element's ID, type, label, position, and size. " +
    "Use this before drawing to see what already exists and avoid overlapping.",
  schema: listElementsSchema,
});
