"use client";

import { useRef } from "react";
import { useCollabSession } from "@/lib/sync/useCollabSession";
import { useRemoteCanvasSync } from "@/lib/sync/useRemoteCanvasSync";
import { useLocalCanvasSync } from "@/lib/sync/useLocalCanvasSync";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export interface UseCanvasSyncOptions {
  roomId: string;
  canvasApi: ExcalidrawImperativeAPI | null;
}

export function useCanvasSync({ roomId, canvasApi }: UseCanvasSyncOptions) {
  const { docRef } = useCollabSession({ roomId });

  // Counts programmatic updateScene calls in flight; each one triggers exactly
  // one onChange echo that should not be written back to Remote.
  const pendingRemoteUpdatesRef = useRef(0);

  useRemoteCanvasSync({
    canvasApi,
    docRef,
    pendingRemoteUpdatesRef,
    roomId,
  });

  const { handleLocalChange } = useLocalCanvasSync({
    docRef,
    pendingRemoteUpdatesRef,
  });

  return { handleLocalChange };
}
