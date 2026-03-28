"use client";

import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const COLLAB_SERVER_URL =
  process.env.NEXT_PUBLIC_COLLAB_SERVER_URL ?? "ws://localhost:1234";

export interface UseCollabSessionOptions {
  roomId: string;
}

export function useCollabSession({ roomId }: UseCollabSessionOptions): {
  docRef: { current: Y.Doc | null };
} {
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(COLLAB_SERVER_URL, roomId, doc);

    docRef.current = doc;
    providerRef.current = provider;

    return () => {
      provider.disconnect();
      doc.destroy();
      docRef.current = null;
      providerRef.current = null;
    };
  }, [roomId]);

  return { docRef };
}
