import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { Node, Edge } from "@/lib/domain/types";

export type ExcalidrawRaw = Record<string, unknown>;
export type TextByContainer = Map<string, ExcalidrawElement>;

export type NodeAdapter = (
  el: ExcalidrawElement,
  raw: ExcalidrawRaw,
  boundTextLabels: TextByContainer,
) => Node | null;

export type EdgeAdapter = (
  el: ExcalidrawElement,
  raw: ExcalidrawRaw,
  boundTextLabels: TextByContainer,
) => Edge | null;

export type Mutable<T> = { -readonly [K in keyof T]: T[K] };
export type MutableExcalidrawElement = Mutable<ExcalidrawElement>;
