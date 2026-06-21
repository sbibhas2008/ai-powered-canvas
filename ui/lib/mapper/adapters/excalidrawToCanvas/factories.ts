import type { Node, Edge, NodeType, Position } from "@/lib/domain/types";
import {
  DEFAULT_NODE_SIZE,
  DEFAULT_BASE_STYLE,
  DEFAULT_RENDER_META,
} from "@/lib/domain/constants";

export function createNode(
  params: { id: string; type: NodeType; position: Position } & Partial<Node>,
): Node {
  const { id, type, position, ...overrides } = params;
  return {
    id,
    type,
    position,
    size: overrides.size || { ...DEFAULT_NODE_SIZE },
    label: overrides.label || "",
    style: {
      ...DEFAULT_BASE_STYLE,
      ...overrides.style,
    },
    renderMeta: {
      excalidraw: {
        ...DEFAULT_RENDER_META.excalidraw,
        ...overrides.renderMeta?.excalidraw,
      },
    },
  };
}

export function createEdge(
  params: { id: string; from: string; to: string } & Partial<Edge>,
): Edge {
  const { id, from, to, ...overrides } = params;
  return {
    id,
    type: "edge",
    from,
    to,
    label: overrides.label || "",
    position: overrides.position,
    points: overrides.points,
    style: {
      ...DEFAULT_BASE_STYLE,
      ...overrides.style,
    },
    renderMeta: {
      excalidraw: {
        ...DEFAULT_RENDER_META.excalidraw,
        ...overrides.renderMeta?.excalidraw,
      },
    },
  };
}
