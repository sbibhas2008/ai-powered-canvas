import * as Y from "yjs";
import type { Node, Edge, CanvasState } from "@/lib/domain/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { translateCanvasToExcalidraw } from "../mapper/adapters/canvasToExcalidraw";

export function renderSharedCanvas(
  api: ExcalidrawImperativeAPI,
  nodesMap: Y.Map<Node>,
  edgesMap: Y.Map<Edge>,
): void {
  const state: CanvasState = {
    nodes: Object.fromEntries(nodesMap.entries()),
    edges: Object.fromEntries(edgesMap.entries()),
  };
  api.updateScene({
    elements: translateCanvasToExcalidraw(state),
  });
}
