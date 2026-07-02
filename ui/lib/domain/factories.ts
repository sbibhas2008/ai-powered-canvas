import { randomUUID } from "crypto";
import type {
  Node,
  Edge,
  NodeType,
  Position,
  Size,
  BaseStyle,
  RenderMeta,
} from "./types";
import {
  DEFAULT_NODE_SIZE,
  DEFAULT_BASE_STYLE,
  DEFAULT_RENDER_META,
} from "./constants";

export function createNode(params: {
  type: NodeType;
  position: Position;
  id?: string;
  size?: Partial<Size>;
  label?: string;
  style?: Partial<BaseStyle>;
  renderMeta?: RenderMeta;
}): Node {
  return {
    id: params.id ?? randomUUID(),
    type: params.type,
    position: params.position,
    size: {
      width: params.size?.width ?? DEFAULT_NODE_SIZE.width,
      height: params.size?.height ?? DEFAULT_NODE_SIZE.height,
    },
    label: params.label,
    style: { ...DEFAULT_BASE_STYLE, ...params.style },
    renderMeta: params.renderMeta ?? DEFAULT_RENDER_META,
  };
}

export function createEdge(params: {
  from: string;
  to: string;
  id?: string;
  label?: string;
  style?: Partial<BaseStyle>;
  renderMeta?: RenderMeta;
}): Edge {
  return {
    id: params.id ?? randomUUID(),
    type: "edge",
    from: params.from,
    to: params.to,
    label: params.label,
    style: { ...DEFAULT_BASE_STYLE, ...params.style },
    renderMeta: params.renderMeta ?? DEFAULT_RENDER_META,
  };
}
