import type { BaseElement, RenderMeta } from "@/lib/domain/types";
import type { Node, Edge } from "@/lib/domain/types";
import {
  DEFAULT_BASE_STYLE,
  DEFAULT_NODE_SIZE,
  DEFAULT_RENDER_META,
} from "@/lib/domain/constants";
import type { MutableExcalidrawElement } from "../../types";
import type { ArrowGeometry, ArrowBinding, BoundElementRef } from "./types";
import { stableHash } from "../../utils";

export function createExcalidrawBase(
  el: BaseElement,
): Partial<MutableExcalidrawElement> {
  const rm = el.renderMeta?.excalidraw ?? DEFAULT_RENDER_META.excalidraw;

  return {
    id: el.id,
    strokeColor: el.style.strokeColor ?? DEFAULT_BASE_STYLE.strokeColor,
    backgroundColor:
      el.style.backgroundColor ?? DEFAULT_BASE_STYLE.backgroundColor,
    fillStyle: rm?.fillStyle ?? "solid",
    strokeStyle: el.style.strokeStyle ?? DEFAULT_BASE_STYLE.strokeStyle,
    strokeWidth: el.style.strokeWidth ?? DEFAULT_BASE_STYLE.strokeWidth,
    opacity: (el.style.opacity ?? 1) * 100,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    link: null,
    locked: false,
    seed: stableHash(el.id),
    version: 1,
    versionNonce: stableHash(el.id + ":nonce"),
    roundness: rm?.roundness ?? null,
    boundElements: [],
    updated: Date.now(),
    roughness: rm?.roughness ?? 1,
  } as Partial<MutableExcalidrawElement>;
}

export function createTextElement({
  id,
  x,
  y,
  width,
  text,
  style,
  renderMeta,
  containerId,
}: {
  id: string;
  x: number;
  y: number;
  width: number;
  text: string;
  style: BaseElement["style"];
  renderMeta: RenderMeta | undefined;
  containerId: string | null;
}): MutableExcalidrawElement {
  const fontSize = style.fontSize ?? DEFAULT_BASE_STYLE.fontSize;
  return {
    ...createExcalidrawBase({ id, style, renderMeta }),
    type: "text",
    x,
    y,
    width,
    height: fontSize,
    angle: 0,
    text,
    fontSize,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    autoResize: true,
    containerId,
    originalText: text,
    lineHeight: 1.25,
    ...(containerId ? { backgroundColor: "transparent" } : {}),
  } as MutableExcalidrawElement;
}

export function createShapeElement(
  node: Node,
  boundElements: BoundElementRef[],
): MutableExcalidrawElement {
  return {
    ...createExcalidrawBase(node),
    type: node.type,
    x: node.position.x,
    y: node.position.y,
    width: node.size?.width ?? DEFAULT_NODE_SIZE.width,
    height: node.size?.height ?? DEFAULT_NODE_SIZE.height,
    angle: 0,
    boundElements,
  } as MutableExcalidrawElement;
}

export function createBoundTextElement(node: Node): MutableExcalidrawElement {
  return createTextElement({
    id: `${node.id}-label`,
    x: node.position.x + (node.size?.width ?? DEFAULT_NODE_SIZE.width) / 2,
    y: node.position.y + (node.size?.height ?? DEFAULT_NODE_SIZE.height) / 2,
    width: node.size?.width ?? DEFAULT_NODE_SIZE.width,
    text: node.label ?? "",
    style: node.style,
    renderMeta: node.renderMeta,
    containerId: node.id,
  });
}

export function createArrowBindings(
  fromNode: Node | undefined,
  toNode: Node | undefined,
): {
  startBinding: ArrowBinding | null;
  endBinding: ArrowBinding | null;
} {
  return {
    startBinding: fromNode
      ? { elementId: fromNode.id, focus: 0, gap: 1, fixedPoint: null }
      : null,
    endBinding: toNode
      ? { elementId: toNode.id, focus: 0, gap: 1, fixedPoint: null }
      : null,
  };
}

export function createArrowElement(
  edge: Edge,
  arrow: ArrowGeometry,
  fromNode: Node | undefined,
  toNode: Node | undefined,
): MutableExcalidrawElement {
  const [dx, dy] = arrow.points[arrow.points.length - 1];

  return {
    ...createExcalidrawBase(edge),
    type: "arrow",
    x: arrow.x,
    y: arrow.y,
    width: Math.abs(dx),
    height: Math.abs(dy),
    angle: 0,
    points: arrow.points,
    ...createArrowBindings(fromNode, toNode),
    startArrowhead: null,
    endArrowhead: "arrow",
    boundElements: edge.label
      ? [{ id: `${edge.id}-label`, type: "text" as const }]
      : [],
    elbowed: false,
  } as MutableExcalidrawElement;
}

export function createEdgeLabel(
  edge: Edge,
  arrow: ArrowGeometry,
): MutableExcalidrawElement {
  const [dx, dy] = arrow.points[arrow.points.length - 1];

  return createTextElement({
    id: `${edge.id}-label`,
    x: arrow.x + dx / 2,
    y: arrow.y + dy / 2,
    width: 100,
    text: edge.label ?? "",
    style: edge.style,
    renderMeta: edge.renderMeta,
    containerId: edge.id,
  });
}
