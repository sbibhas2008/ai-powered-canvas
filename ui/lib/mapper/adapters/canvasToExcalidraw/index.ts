import type { CanvasState } from "@/lib/domain/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { MutableExcalidrawElement } from "../../types";
import { nodeToExcalidraw, edgeToExcalidraw } from "./excalidrawAdapter";

export function translateCanvasToExcalidraw(
  state: CanvasState,
): ExcalidrawElement[] {
  const elements: MutableExcalidrawElement[] = [];

  for (const node of Object.values(state.nodes)) {
    elements.push(...nodeToExcalidraw(node, state.edges));
  }
  for (const edge of Object.values(state.edges)) {
    elements.push(...edgeToExcalidraw(edge, state.nodes));
  }

  return elements as ExcalidrawElement[];
}
