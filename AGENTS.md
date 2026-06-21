# Canvas System Architecture & AI Implementation Guide

## 1. System Context

This repository contains a Proof of Concept (POC) for an agentic, real-time collaborative canvas.

**Core Stack:**

- **Frontend:** Next.js (App Router), React.
- **Renderer:** Excalidraw (Strictly used as a dumb renderer).
- **Real-time Sync:** Yjs (CRDT) over WebSockets.
- **WebSocket Server:** Hocuspocus (Monolithic Node.js container).
- **Persistence & Identity:** Supabase (PostgreSQL, managed Auth).
- **AI Orchestration:** LangChain (Server-side Node.js environment).

**The Golden Rule:** Excalidraw is an implementation detail. The database, the CRDT server, and the AI Agents **must never** rely on Excalidraw's internal data structures. The Canonical Domain Model is the absolute source of truth.

---

## 2. The Canonical Domain Model

All application state must adhere to the definitions in `lib/domain/types.ts`.

### Architectural Invariants:

1. **Yjs Data Structures:** The root canvas state MUST be stored using `Y.Map`. `Y.Array` is strictly forbidden for the root element lists due to index-shifting conflict resolution.
2. **String Literal Unions:** Prefer string literal unions over TypeScript Enums for zero-cost network serialization.
3. **The Escape Hatch:** All renderer-specific visual properties (e.g., roughness, hachure fill) MUST be isolated within the `renderMeta` object. The base `Style` interface must only contain universal web canvas properties.

### Data Schema

```typescript
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
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
}

export interface RenderMeta {
  excalidraw?: {
    roughness?: number;
    fillStyle?: "solid" | "hachure" | "cross-hatch";
    roundness?: number;
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
  position?: Position;
  points?: [number, number][];
}

export type CanvasElement = Node | Edge;

export interface CanvasState {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
}
```
