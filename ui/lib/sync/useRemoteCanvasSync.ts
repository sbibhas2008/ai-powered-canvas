"use client";

import { useEffect } from "react";
import * as Y from "yjs";
import type { Node, Edge } from "@/lib/domain/types";
import { renderSharedCanvas } from "@/lib/sync/sharedCanvas";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const LOCAL_ORIGIN = "local";

export interface UseRemoteCanvasSyncOptions {
  canvasApi: ExcalidrawImperativeAPI | null;
  docRef: { current: Y.Doc | null };
  pendingRemoteUpdatesRef: { current: number };
  roomId: string;
}

export function useRemoteCanvasSync({
  canvasApi,
  docRef,
  pendingRemoteUpdatesRef,
  roomId,
}: UseRemoteCanvasSyncOptions): void {
  useEffect(() => {
    const doc = docRef.current;
    if (!doc || !canvasApi) return;

    const nodesMap = doc.getMap<Node>("nodes");
    const edgesMap = doc.getMap<Edge>("edges");

    // Use a doc-level transaction handler instead of per-map observers.
    // A single transaction can touch both maps but we must only call
    // updateScene (and bump the pending counter) once per transaction.
    const handleAfterTransaction = (transaction: Y.Transaction) => {
      if (transaction.origin === LOCAL_ORIGIN) return;

      const touchedNodes = transaction.changedParentTypes.has(nodesMap as never);
      const touchedEdges = transaction.changedParentTypes.has(edgesMap as never);
      if (!touchedNodes && !touchedEdges) return;

      pendingRemoteUpdatesRef.current++;
      renderSharedCanvas(canvasApi, nodesMap, edgesMap);
    };

    doc.on("afterTransaction", handleAfterTransaction);

    // On initial connect, load existing Yjs state into Excalidraw
    if (nodesMap.size > 0 || edgesMap.size > 0) {
      pendingRemoteUpdatesRef.current++;
      renderSharedCanvas(canvasApi, nodesMap, edgesMap);
    }

    return () => {
      doc.off("afterTransaction", handleAfterTransaction);
    };
  }, [canvasApi, docRef, pendingRemoteUpdatesRef, roomId]);
}
