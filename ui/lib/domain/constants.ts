import type { Size, BaseStyle, RenderMeta } from "./types";

export const DEFAULT_NODE_SIZE: Size = {
  width: 200,
  height: 100,
};

/**
 * Universal styling defaults that any canvas (or AI) can understand.
 */
export const DEFAULT_BASE_STYLE: BaseStyle = {
  backgroundColor: "transparent",
  strokeColor: "#1e1e1e",
  strokeWidth: 2,
  strokeStyle: "solid",
  opacity: 1, // 1.0 represents 100% opaque
  fontSize: 20,
  fontFamily: "Virgil", // Standard Excalidraw handwritten font
};

/**
 * Excalidraw-specific styling defaults to ensure shapes
 * retain that "hand-drawn" aesthetic.
 */
export const DEFAULT_RENDER_META: RenderMeta = {
  excalidraw: {
    roughness: 1,
    fillStyle: "solid",
    roundness: { type: 3 },
  },
};
