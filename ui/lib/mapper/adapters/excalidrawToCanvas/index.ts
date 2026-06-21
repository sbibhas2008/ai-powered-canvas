import type { CanvasState, Node, Edge } from "@/lib/domain/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawRaw, TextByContainer } from "../../types";
import { nodeAdapters, edgeAdapters } from "./domainAdapter";

function indexBoundTextLabels(
  elements: readonly ExcalidrawElement[],
): TextByContainer {
  const map = new Map<string, ExcalidrawElement>();

  for (const el of elements) {
    if (el.isDeleted) continue;

    const raw = el as unknown as ExcalidrawRaw;

    if (raw.type === "text" && raw.containerId) {
      map.set(raw.containerId as string, el);
    }
  }

  return map;
}

export function translateExcalidrawToCanvas(
  elements: readonly ExcalidrawElement[],
): CanvasState {
  const boundTextLabels = indexBoundTextLabels(elements);

  const nodes: Record<string, Node> = {};
  const edges: Record<string, Edge> = {};

  for (const el of elements) {
    if (el.isDeleted) continue;

    const raw = el as unknown as ExcalidrawRaw;
    const type = raw.type as string;

    const nodeAdapter = nodeAdapters[type];
    if (nodeAdapter) {
      const node = nodeAdapter(el, raw, boundTextLabels);

      if (node) {
        nodes[node.id] = node;
        continue;
      }
    }

    const edgeAdapter = edgeAdapters[type];
    if (edgeAdapter) {
      const edge = edgeAdapter(el, raw, boundTextLabels);

      if (edge) {
        edges[edge.id] = edge;
      }
    }
  }

  return { nodes, edges };
}
