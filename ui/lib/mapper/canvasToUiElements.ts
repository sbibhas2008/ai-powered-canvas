import {
  type Canvas,
  type Node,
  type Edge,
  type Style,
  NodeType,
  DEFAULT_STYLE,
} from "@/lib/domain/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type MutableElement = Mutable<ExcalidrawElement>;

// Deterministic seed from element ID so roughjs rendering is stable across syncs.
function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // ensure positive 32-bit int
}

const EXCALIDRAW_SHAPE: Record<NodeType, string> = {
  [NodeType.Rectangle]: "rectangle",
  [NodeType.Ellipse]: "ellipse",
  [NodeType.Diamond]: "diamond",
  [NodeType.Text]: "text",
};

function createBaseElement(id: string, style: Style): Partial<MutableElement> {
  return {
    id,
    strokeColor: style.strokeColor ?? DEFAULT_STYLE.strokeColor,
    backgroundColor: style.backgroundColor ?? DEFAULT_STYLE.backgroundColor,
    fillStyle: style.fillStyle ?? "solid",
    strokeStyle: style.strokeStyle ?? "solid",
    strokeWidth: style.strokeWidth ?? DEFAULT_STYLE.strokeWidth,
    opacity: style.opacity ?? DEFAULT_STYLE.opacity,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    link: null,
    locked: false,
    seed: stableHash(id),
    version: 1,
    versionNonce: stableHash(id + ":nonce"),
    roundness: style.roundness !== undefined ? style.roundness : DEFAULT_STYLE.roundness,
    boundElements: [],
    updated: Date.now(),
    roughness: style.roughness ?? DEFAULT_STYLE.roughness,
  } as Partial<MutableElement>;
}

function createTextElement(
  id: string,
  x: number,
  y: number,
  width: number,
  text: string,
  style: Style,
  containerId: string | null,
): MutableElement {
  return {
    ...createBaseElement(id, style),
    type: "text",
    x,
    y,
    width,
    height: style.fontSize ?? DEFAULT_STYLE.fontSize,
    angle: 0,
    text,
    fontSize: style.fontSize ?? DEFAULT_STYLE.fontSize,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    autoResize: true,
    containerId,
    originalText: text,
    lineHeight: 1.25,
    ...(containerId ? { backgroundColor: "transparent" } : {}),
  } as MutableElement;
}

function nodeToElements(node: Node, allEdges: Edge[]): MutableElement[] {
  if (node.type === NodeType.Text) {
    return [
      createTextElement(
        node.id,
        node.position.x,
        node.position.y,
        node.size.width,
        node.label,
        node.style,
        null,
      ),
    ];
  }

  const boundEdges = allEdges
    .filter((e) => e.from === node.id || e.to === node.id)
    .map((e) => ({ id: e.id, type: "arrow" as const }));

  const boundElements = [
    ...(node.label ? [{ id: `${node.id}-label`, type: "text" as const }] : []),
    ...boundEdges,
  ];

  const shape = {
    ...createBaseElement(node.id, node.style),
    type: EXCALIDRAW_SHAPE[node.type],
    x: node.position.x,
    y: node.position.y,
    width: node.size.width,
    height: node.size.height,
    angle: 0,
    boundElements,
  } as MutableElement;

  if (!node.label) return [shape];

  const label = createTextElement(
    `${node.id}-label`,
    node.position.x + node.size.width / 2,
    node.position.y + node.size.height / 2,
    node.size.width,
    node.label,
    node.style,
    node.id,
  );

  return [shape, label];
}

function resolveArrowGeometry(
  edge: Edge,
  fromNode: Node | undefined,
  toNode: Node | undefined,
): { x: number; y: number; points: [number, number][] } | null {
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

function edgeToElements(
  edge: Edge,
  nodeMap: Map<string, Node>,
): MutableElement[] {
  const fromNode = nodeMap.get(edge.from);
  const toNode = nodeMap.get(edge.to);
  const arrow = resolveArrowGeometry(edge, fromNode, toNode);

  if (!arrow) return [];

  const lastPoint = arrow.points[arrow.points.length - 1];
  const [dx, dy] = lastPoint;

  const boundElements = edge.label
    ? [{ id: `${edge.id}-label`, type: "text" as const }]
    : [];

  const arrowElement = {
    ...createBaseElement(edge.id, edge.style),
    type: "arrow",
    x: arrow.x,
    y: arrow.y,
    width: Math.abs(dx),
    height: Math.abs(dy),
    angle: 0,
    points: arrow.points,
    startBinding: fromNode
      ? { elementId: fromNode.id, focus: 0, gap: 1, fixedPoint: null }
      : null,
    endBinding: toNode
      ? { elementId: toNode.id, focus: 0, gap: 1, fixedPoint: null }
      : null,
    startArrowhead: null,
    endArrowhead: "arrow",
    boundElements,
    elbowed: false,
  } as MutableElement;

  if (!edge.label) return [arrowElement];

  const label = createTextElement(
    `${edge.id}-label`,
    arrow.x + dx / 2,
    arrow.y + dy / 2,
    100,
    edge.label,
    edge.style,
    edge.id,
  );

  return [arrowElement, label];
}

export function canvasToUiElements(canvas: Canvas): ExcalidrawElement[] {
  const nodeMap = new Map(canvas.nodes.map((n) => [n.id, n]));
  const elements: MutableElement[] = [];

  for (const node of canvas.nodes) {
    elements.push(...nodeToElements(node, canvas.edges));
  }
  for (const edge of canvas.edges) {
    elements.push(...edgeToElements(edge, nodeMap));
  }

  return elements as ExcalidrawElement[];
}
