// ─── Canvas Domain Model ───────────────────────────────────────────
// This is the canonical source of truth for diagram state.
// Excalidraw is just a renderer. The AI generates these types directly.
// Yjs syncs these types across peers.

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type NodeType = "rectangle" | "ellipse" | "diamond" | "text";
export type StrokeStyle = "solid" | "dashed" | "dotted";

export interface BaseStyle {
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  opacity?: number; // 0.0 to 1.0
  fontSize?: number;
  fontFamily?: string;
}

/**
 * The Escape Hatch: Renderer-specific data lives here.
 * The core domain logic and AI tools do not need to understand this data.
 */
export interface RenderMeta {
  excalidraw?: {
    roughness?: number; // 0=architect, 1=artist, 2=cartoonist
    fillStyle?: "solid" | "hachure" | "cross-hatch";
    roundness?: { type: number } | null;
  };
}

export interface BaseElement {
  id: string;
  style: BaseStyle;
  renderMeta?: RenderMeta;
}

export interface Node extends BaseElement {
  type: NodeType;
  position: Position;
  size: Size;
  label?: string;
}

export interface Edge extends BaseElement {
  type: "edge";
  from: string; // source node ID
  to: string; // target node ID
  label?: string;
  /**
   * Measured label width in pixels.
   *
   * Why store this? Excalidraw's canvas-based `measureText` can produce
   * different results across clients (font loading timing, devicePixelRatio).
   * Without a canonical width, the same label renders with different padding
   * on different clients.
   *
   * How it works:
   * - Client 1 creates edge → Excalidraw measures text → width stored in Domain
   * - Yjs syncs Domain (with labelWidth) to all clients
   * - Client 2 receives canonical width → renders identically
   *
   * Text wrapping (line breaks) is still handled by the renderer via arrow bounds.
   * This field only controls the display width of single-line labels.
   */
  labelWidth?: number;
  position?: Position;
  points?: [number, number][];
}

/**
 * Represents a complete snapshot of the canvas.
 * Uses Records (Maps) instead of Arrays to mirror the Y.Map
 * CRDT architecture, guaranteeing O(1) lookups and conflict-free updates.
 */
export interface CanvasState {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
}

export type CanvasElement = Node | Edge;
