"use client";

import { useCallback } from "react";
import * as Y from "yjs";
import type { Node, Edge } from "@/lib/domain/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { deepEqual } from "@/utils/object";
import { translateExcalidrawToCanvas } from "../mapper/adapters/excalidrawToCanvas";

const LOCAL_ORIGIN = "local";

function reconcile<T extends { id: string }>(map: Y.Map<T>, items: T[]): void {
  const currentIds = new Set(items.map((item) => item.id));

  for (const item of items) {
    const existing = map.get(item.id);
    if (!existing || !deepEqual(existing, item)) {
      map.set(item.id, structuredClone(item));
    }
  }

  for (const key of Array.from(map.keys())) {
    if (!currentIds.has(key)) map.delete(key);
  }
}

export interface UseLocalCanvasSyncOptions {
  docRef: { current: Y.Doc | null };
  pendingRemoteUpdatesRef: { current: number };
}

export function useLocalCanvasSync({
  docRef,
  pendingRemoteUpdatesRef,
}: UseLocalCanvasSyncOptions) {
  const handleLocalChange = useCallback(
    (elements: readonly ExcalidrawElement[]) => {
      const doc = docRef.current;

      if (!doc) return;

      if (pendingRemoteUpdatesRef.current > 0) {
        pendingRemoteUpdatesRef.current--;

        return;
      }

      const canvas = translateExcalidrawToCanvas(elements);
      const nodesMap = doc.getMap<Node>("nodes");
      const edgesMap = doc.getMap<Edge>("edges");

      doc.transact(() => {
        reconcile(nodesMap, Object.values(canvas.nodes));
        reconcile(edgesMap, Object.values(canvas.edges));
      }, LOCAL_ORIGIN);
    },
    [docRef, pendingRemoteUpdatesRef],
  );

  return { handleLocalChange };
}
