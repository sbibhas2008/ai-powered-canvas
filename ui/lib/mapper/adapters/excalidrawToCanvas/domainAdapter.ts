import type { Node, Edge } from "@/lib/domain/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  ExcalidrawRaw,
  TextByContainer,
  NodeAdapter,
  EdgeAdapter,
} from "../../types";
import {
  extractPosition,
  extractSize,
  extractBaseStyle,
  extractRenderMeta,
  extractBoundLabel,
} from "./extractors";
import { createEdge, createNode } from "./factories";

function excalidrawShapeToNode(
  el: ExcalidrawElement,
  raw: ExcalidrawRaw,
  boundTextLabels: TextByContainer,
): Node {
  return createNode({
    id: el.id,
    type: raw.type as Node["type"],
    position: extractPosition(raw),
    size: extractSize(raw),
    label: extractBoundLabel(boundTextLabels, el.id),
    style: extractBaseStyle(raw),
    renderMeta: extractRenderMeta(raw),
  });
}

function excalidrawTextToNode(
  el: ExcalidrawElement,
  raw: ExcalidrawRaw,
  _boundTextLabels: TextByContainer,
): Node | null {
  if (raw.containerId) return null;

  return createNode({
    id: el.id,
    type: "text",
    position: extractPosition(raw),
    size: extractSize(raw),
    label: (raw.text as string) ?? "",
    style: extractBaseStyle(raw),
    renderMeta: extractRenderMeta(raw),
  });
}

function excalidrawArrowToEdge(
  el: ExcalidrawElement,
  raw: ExcalidrawRaw,
  boundTextLabels: TextByContainer,
): Edge | null {
  if (raw.type !== "arrow") return null;

  const startBinding = raw.startBinding as { elementId: string } | null;
  const endBinding = raw.endBinding as { elementId: string } | null;

  return createEdge({
    id: el.id,
    from: startBinding?.elementId ?? "",
    to: endBinding?.elementId ?? "",
    label: extractBoundLabel(boundTextLabels, el.id),
    style: extractBaseStyle(raw),
    renderMeta: extractRenderMeta(raw),
    position: extractPosition(raw),
    points: raw.points as [number, number][],
  });
}

export const nodeAdapters: Record<string, NodeAdapter> = {
  rectangle: excalidrawShapeToNode,
  ellipse: excalidrawShapeToNode,
  diamond: excalidrawShapeToNode,
  text: excalidrawTextToNode,
};

export const edgeAdapters: Record<string, EdgeAdapter> = {
  arrow: excalidrawArrowToEdge,
};
