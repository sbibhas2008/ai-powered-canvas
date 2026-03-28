import * as Y from "yjs";
import type { Canvas, Node, Edge } from "@/lib/domain/types";
import { canvasToUiElements } from "@/lib/mapper/canvasToUiElements";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export function readSharedCanvas(
  nodesMap: Y.Map<Node>,
  edgesMap: Y.Map<Edge>,
): Canvas {
  const nodes: Node[] = [];
  nodesMap.forEach((v) => nodes.push(v));

  const edges: Edge[] = [];

  edgesMap.forEach((v) => edges.push(v));

  return { nodes, edges };
}

export function renderSharedCanvas(
  api: ExcalidrawImperativeAPI,
  nodesMap: Y.Map<Node>,
  edgesMap: Y.Map<Edge>,
): void {
  api.updateScene({
    elements: canvasToUiElements(readSharedCanvas(nodesMap, edgesMap)),
  });
}
