import type { BaseStyle, RenderMeta, Position, Size } from "@/lib/domain/types";
import { DEFAULT_BASE_STYLE } from "@/lib/domain/constants";
import type { ExcalidrawRaw, TextByContainer } from "../../types";

export function extractPosition(el: ExcalidrawRaw): Position {
  return { x: el.x as number, y: el.y as number };
}

export function extractSize(el: ExcalidrawRaw): Size {
  return { width: el.width as number, height: el.height as number };
}

export function extractBaseStyle(el: ExcalidrawRaw): BaseStyle {
  return {
    backgroundColor:
      (el.backgroundColor as string) ?? DEFAULT_BASE_STYLE.backgroundColor,
    strokeColor: (el.strokeColor as string) ?? DEFAULT_BASE_STYLE.strokeColor,
    strokeWidth: (el.strokeWidth as number) ?? DEFAULT_BASE_STYLE.strokeWidth,
    strokeStyle: (el.strokeStyle as BaseStyle["strokeStyle"]) ?? "solid",
    opacity: ((el.opacity as number) ?? 100) / 100,
    fontSize: (el.fontSize as number) ?? DEFAULT_BASE_STYLE.fontSize,
    fontFamily: (el.fontFamily as string) ?? DEFAULT_BASE_STYLE.fontFamily,
  };
}

export function extractRenderMeta(el: ExcalidrawRaw): RenderMeta {
  return {
    excalidraw: {
      roughness: (el.roughness as number) ?? 1,
      fillStyle:
        (el.fillStyle as "solid" | "hachure" | "cross-hatch") ?? "solid",
      roundness: (el.roundness as { type: number } | null) ?? null,
    },
  };
}

export function extractBoundLabel(
  boundTextLabels: TextByContainer,
  id: string,
): string {
  const boundText = boundTextLabels.get(id);
  if (!boundText) return "";
  return ((boundText as unknown as ExcalidrawRaw).text as string) ?? "";
}
