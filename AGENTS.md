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

---

## 3. Security Rules

**NEVER** read, grep, cat, or access any `.env` file (`.env`, `.env.local`, `.env.production`, etc.) or any directory containing secrets.

**NEVER** print, echo, or log environment variables that contain keys, tokens, or passwords.

Real secrets are injected at runtime via `.env.local` (gitignored). For reference values, use `.env.example` (committed). For testing, use placeholder values like `test_key_changeme`.

---

## 4. Component Patterns

### Browser-Only Libraries

Libraries that access browser APIs at module scope (DOM, Canvas, WebGL) **must** use `dynamic(..., { ssr: false })` in Next.js App Router — `"use client"` alone is not sufficient.

**Pattern:** Create a co-located wrapper file (e.g., `ExcalidrawCanvas.tsx`) that exports the dynamically imported component. The consumer imports it like any other component.

```
canvas/
├── ExcalidrawCanvas.tsx   # dynamic import, ssr: false
└── Canvas.tsx             # clean import, no dynamic logic
```

---

## 5. Design Tokens

All colors are defined in `ui/app/globals.css` using **oklch** with CSS custom properties. Use Tailwind classes that reference these tokens — never hardcode colors.

### Token Naming Convention

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--primary` / `--primary-foreground` | `bg-primary text-primary-foreground` | Main action buttons, key UI |
| `--secondary` / `--secondary-foreground` | `bg-secondary text-secondary-foreground` | Secondary buttons, subtle fills |
| `--muted` / `--muted-foreground` | `bg-muted text-muted-foreground` | Disabled states, captions |
| `--accent` / `--accent-foreground` | `bg-accent text-accent-foreground` | Hover states, highlights |
| `--destructive` | `bg-destructive` | Delete/danger actions |
| `--background` / `--foreground` | `bg-background text-foreground` | Page background/text |
| `--card` / `--card-foreground` | `bg-card text-card-foreground` | Card surfaces |
| `--border` | `border-border` | Borders, dividers |
| `--ring` | `ring-ring` | Focus rings |

### Dark Mode

Dark mode uses `.dark` class selector (`@custom-variant dark`). Tokens invert automatically. Sidebar has its own set (`--sidebar-*`) for distinct panel styling.

---

## 6. File & Folder Naming

All component files and directories use **kebab-case**.

### Component Structure

Each component lives in its own wrapper directory with an `index.tsx` barrel export:

```
components/
├── ui/
│   ├── button/
│   │   ├── index.tsx              # barrel export
│   │   ├── button.tsx             # implementation
│   │   ├── button.stories.tsx     # Storybook story
│   │   └── button.test.tsx        # Vitest test
│   ├── scroll-area/
│   └── textarea/
├── canvas/
│   ├── canvas/
│   └── excalidraw-canvas/
└── chat/
    └── chat-panel/
```

### Naming Rules

| Item | Convention | Example |
|------|------------|---------|
| Component file | kebab-case | `chat-panel.tsx` |
| Component directory | kebab-case | `chat-panel/` |
| Barrel export | `index.tsx` | `chat-panel/index.tsx` |
| Story file | kebab-case + `.stories.tsx` | `button.stories.tsx` |
| Test file | kebab-case + `.test.tsx` | `textarea.test.tsx` |
| Grouping directory | lowercase single-word | `ui/`, `canvas/`, `chat/` |

### Barrel Export Pattern

```typescript
// components/ui/button/index.tsx
export { Button, buttonVariants } from "./button";
```

### Why Kebab-Case?

- Matches shadcn CLI conventions (`npx shadcn add` generates kebab-case files)
- Avoids naming conflicts between file and component names
- Consistent across all components regardless of domain
