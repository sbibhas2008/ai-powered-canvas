import type { Node, Edge } from "@/lib/domain/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import {
  createTextElement,
  createShapeElement,
  createBoundTextElement,
  createArrowElement,
  createEdgeLabel,
} from "./factories";
import type { ArrowGeometry } from "./types";

// --- Shape helpers ---

function collectBoundElements(
  node: Node,
  allEdges: Record<string, Edge>,
): { id: string; type: "text" | "arrow" }[] {
  return [
    ...(node.label ? [{ id: `${node.id}-label`, type: "text" as const }] : []),
    ...Object.values(allEdges)
      .filter((e) => e.from === node.id || e.to === node.id)
      .map((e) => ({ id: e.id, type: "arrow" as const })),
  ];
}

// --- Edge helpers ---

// Returns the arrow's position and points, preferring explicit geometry over auto-calculated center-to-center.
function resolveArrowGeometry(
  edge: Edge,
  fromNode: Node | undefined,
  toNode: Node | undefined,
): ArrowGeometry | null {
  if (edge.position && edge.points) {
    return { x: edge.position.x, y: edge.position.y, points: edge.points };
  }

  if (!fromNode || !toNode) return null;

  const startX = fromNode.position.x + fromNode.size.width / 2;
  const startY = fromNode.position.y + fromNode.size.height / 2;
  const endX = toNode.position.x + toNode.size.width / 2;
  const endY = toNode.position.y + toNode.size.height / 2;

  return {
    x: startX,
    y: startY,
    points: [
      [0, 0],
      [endX - startX, endY - startY],
    ],
  };
}

// --- Orchestrators ---

export function nodeToExcalidraw(
  node: Node,
  allEdges: Record<string, Edge>,
): ExcalidrawElement[] {
  if (node.type === "text") {
    return [
      createTextElement({
        id: node.id,
        x: node.position.x,
        y: node.position.y,
        width: node.size.width,
        text: node.label ?? "",
        style: node.style,
        renderMeta: node.renderMeta,
        containerId: null,
      }),
    ];
  }

  const elements: ExcalidrawElement[] = [
    createShapeElement(node, collectBoundElements(node, allEdges)),
  ];

  if (node.label) elements.push(createBoundTextElement(node));

  return elements;
}

export function edgeToExcalidraw(
  edge: Edge,
  nodes: Record<string, Node>,
): ExcalidrawElement[] {
  const arrow = resolveArrowGeometry(edge, nodes[edge.from], nodes[edge.to]);

  if (!arrow) return [];

  const elements: ExcalidrawElement[] = [
    createArrowElement(edge, arrow, nodes[edge.from], nodes[edge.to]),
  ];

  if (edge.label) elements.push(createEdgeLabel(edge, arrow));

  return elements;
}
