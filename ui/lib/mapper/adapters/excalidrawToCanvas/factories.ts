import type { Node, Edge, NodeType, Position } from "@/lib/domain/types";
import { DEFAULT_RENDER_META } from "@/lib/domain/constants";
import {
  createNode as createDomainNode,
  createEdge as createDomainEdge,
} from "@/lib/domain/factories";

function mergeExcalidrawMeta(overrides?: { excalidraw?: Record<string, unknown> }) {
  return {
    excalidraw: {
      ...DEFAULT_RENDER_META.excalidraw,
      ...overrides?.excalidraw,
    },
  };
}

export function createNode(
  params: { id: string; type: NodeType; position: Position } & Partial<Node>,
): Node {
  return createDomainNode({
    ...params,
    label: params.label ?? "",
    renderMeta: mergeExcalidrawMeta(params.renderMeta),
  });
}

export function createEdge(
  params: { id: string; from: string; to: string } & Partial<Edge>,
): Edge {
  return createDomainEdge({
    ...params,
    label: params.label ?? "",
    renderMeta: mergeExcalidrawMeta(params.renderMeta),
  });
}
