import {
  type Canvas,
  type Node,
  type Edge,
  type Style,
  NodeType,
  DEFAULT_STYLE,
} from "@/lib/domain/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

const DOMAIN_NODE_TYPE: Record<string, NodeType> = {
  rectangle: NodeType.Rectangle,
  ellipse: NodeType.Ellipse,
  diamond: NodeType.Diamond,
};

function extractStyle(el: Record<string, unknown>): Style {
  return {
    backgroundColor:
      (el.backgroundColor as string) ?? DEFAULT_STYLE.backgroundColor,
    strokeColor: (el.strokeColor as string) ?? DEFAULT_STYLE.strokeColor,
    strokeWidth: (el.strokeWidth as number) ?? DEFAULT_STYLE.strokeWidth,
    strokeStyle: (el.strokeStyle as string) ?? "solid",
    opacity: (el.opacity as number) ?? DEFAULT_STYLE.opacity,
    fontSize: (el.fontSize as number) ?? DEFAULT_STYLE.fontSize,
    roughness: (el.roughness as number) ?? 1,
    roundness: (el.roundness as { type: number } | null) ?? null,
    fillStyle: (el.fillStyle as string) ?? "solid",
  };
}

function extractBoundLabel(
  textByContainer: Map<string, ExcalidrawElement>,
  id: string,
): string {
  const boundText = textByContainer.get(id);

  if (!boundText) return "";

  return (
    ((boundText as unknown as Record<string, unknown>).text as string) ?? ""
  );
}

export function uiElementsToCanvas(
  elements: readonly ExcalidrawElement[],
): Canvas {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const textByContainer = new Map<string, ExcalidrawElement>();
  for (const el of elements) {
    if (el.isDeleted) continue;

    const raw = el as unknown as Record<string, unknown>;

    if (raw.type === "text" && raw.containerId) {
      textByContainer.set(raw.containerId as string, el);
    }
  }

  for (const el of elements) {
    if (el.isDeleted) continue;
    const raw = el as unknown as Record<string, unknown>;
    const type = raw.type as string;

    const domainType = DOMAIN_NODE_TYPE[type];
    if (domainType) {
      nodes.push({
        id: el.id,
        type: domainType,
        position: { x: raw.x as number, y: raw.y as number },
        size: { width: raw.width as number, height: raw.height as number },
        label: extractBoundLabel(textByContainer, el.id),
        style: extractStyle(raw),
      });
    } else if (type === "text" && !raw.containerId) {
      nodes.push({
        id: el.id,
        type: NodeType.Text,
        position: { x: raw.x as number, y: raw.y as number },
        size: { width: raw.width as number, height: raw.height as number },
        label: (raw.text as string) ?? "",
        style: extractStyle(raw),
      });
    } else if (type === "arrow") {
      const startBinding = raw.startBinding as { elementId: string } | null;
      const endBinding = raw.endBinding as { elementId: string } | null;

      edges.push({
        id: el.id,
        from: startBinding?.elementId ?? "",
        to: endBinding?.elementId ?? "",
        label: extractBoundLabel(textByContainer, el.id),
        style: extractStyle(raw),
        position: { x: raw.x as number, y: raw.y as number },
        points: raw.points as [number, number][],
      });
    }
  }

  return { nodes, edges };
}
