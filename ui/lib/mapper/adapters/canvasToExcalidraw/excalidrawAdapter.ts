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
import {
  rectangleIntersection,
  ellipseIntersection,
  nodeCenter,
} from "../../geometry";

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

function borderPoint(
  node: Node,
  target: { x: number; y: number },
): { x: number; y: number } {
  const center = nodeCenter(node.position, node.size);
  if (node.type === "ellipse") {
    return ellipseIntersection(node.position, node.size, center, target);
  }
  return rectangleIntersection(node.position, node.size, center, target);
}

// --- Edge helpers ---

// Returns the arrow's position and points, preferring explicit geometry over auto-calculated edge-to-edge.
function resolveArrowGeometry(
  edge: Edge,
  fromNode: Node | undefined,
  toNode: Node | undefined,
): ArrowGeometry | null {
  if (edge.position && edge.points) {
    return { x: edge.position.x, y: edge.position.y, points: edge.points };
  }

  if (!fromNode || !toNode) return null;

  const fromCenter = nodeCenter(fromNode.position, fromNode.size);
  const toCenter = nodeCenter(toNode.position, toNode.size);

  const start = borderPoint(fromNode, toCenter);
  const end = borderPoint(toNode, fromCenter);

  return {
    x: start.x,
    y: start.y,
    points: [
      [0, 0],
      [end.x - start.x, end.y - start.y],
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
