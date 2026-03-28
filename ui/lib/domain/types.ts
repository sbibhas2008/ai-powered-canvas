// ─── Canvas Domain Model ───────────────────────────────────────────
// This is the canonical source of truth for diagram state.
// Excalidraw is just a renderer. The AI generates these types directly.
// Yjs syncs these types across peers.

export enum NodeType {
  Rectangle = "rectangle",
  Ellipse = "ellipse",
  Diamond = "diamond",
  Text = "text",
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Style {
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: string; // "solid" | "dashed" | "dotted"
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  roughness?: number; // 0=architect, 1=artist, 2=cartoonist
  roundness?: { type: number } | null;
  fillStyle?: string; // "solid" | "hachure" | "cross-hatch" etc.
}

export interface Node {
  id: string;
  type: NodeType;
  position: Position;
  size: Size;
  label: string;
  style: Style;
}

export interface Edge {
  id: string;
  from: string; // source node ID
  to: string; // target node ID
  label: string;
  style: Style;
  // Arrow geometry — preserved from Excalidraw for lossless roundtrip.
  // When AI-generated, these can be omitted and will be auto-computed from node positions.
  position?: Position;
  points?: [number, number][];
}

export interface Canvas {
  nodes: Node[];
  edges: Edge[];
}

// ─── Defaults ──────────────────────────────────────────────────────

export const DEFAULT_NODE_SIZE: Size = { width: 200, height: 100 };

export const DEFAULT_STYLE: Style = {
  backgroundColor: "transparent",
  strokeColor: "#1e1e1e",
  strokeWidth: 2,
  opacity: 100,
  fontSize: 20,
  fontFamily: "Virgil",
  roughness: 1,
  roundness: { type: 3 },
  fillStyle: "solid",
};

export function createNode(partial: Partial<Node> & { id: string }): Node {
  return {
    type: NodeType.Rectangle,
    position: { x: 0, y: 0 },
    size: { ...DEFAULT_NODE_SIZE },
    label: "",
    style: { ...DEFAULT_STYLE },
    ...partial,
  };
}

export function createEdge(
  partial: Partial<Edge> & { id: string; from: string; to: string },
): Edge {
  return {
    label: "",
    style: { ...DEFAULT_STYLE },
    ...partial,
  };
}
