"use client";

import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

const COLLAB_SERVER_URL =
  process.env.NEXT_PUBLIC_COLLAB_SERVER_URL ?? "ws://localhost:1234";

export interface UseCollabSessionOptions {
  roomId: string;
}

export function useCollabSession({ roomId }: UseCollabSessionOptions): {
  docRef: { current: Y.Doc | null };
} {
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();

    const provider = new HocuspocusProvider({
      url: COLLAB_SERVER_URL,
      name: roomId,
      document: doc,
    });

    docRef.current = doc;
    providerRef.current = provider;

    return () => {
      provider.destroy();
      doc.destroy();
      docRef.current = null;
      providerRef.current = null;
    };
  }, [roomId]);

  return { docRef };
}
