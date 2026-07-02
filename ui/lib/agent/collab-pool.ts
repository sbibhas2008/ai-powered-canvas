import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import WebSocket from "ws";
import type { Node as DomainNode, Edge } from "@/lib/domain/types";

const COLLAB_SERVER_URL =
  process.env.COLLAB_SERVER_URL ?? "ws://localhost:1234";

const INITIAL_SYNC_TIMEOUT_MS = 15_000;
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

interface PooledConnection {
  doc: Y.Doc;
  provider: HocuspocusProvider;
  refCount: number;
  lastUsed: number;
  connected: boolean;
}

const pool = new Map<string, PooledConnection>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [roomId, conn] of pool.entries()) {
      if (conn.refCount === 0 && now - conn.lastUsed > IDLE_TIMEOUT_MS) {
        console.log(
          `[collab-pool] cleaning idle connection: room=${roomId} (idle ${Math.round((now - conn.lastUsed) / 1000)}s)`,
        );
        conn.provider.destroy();
        pool.delete(roomId);
      }
    }
    if (pool.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL_MS);
}

function handleConnectionClose(roomId: string) {
  console.log(`[collab-pool] connection closed: room=${roomId}`);
  const conn = pool.get(roomId);
  if (conn) {
    conn.connected = false;
  }
}

export async function acquireCollabDoc(roomId: string): Promise<{
  doc: Y.Doc;
  nodesMap: Y.Map<DomainNode>;
  edgesMap: Y.Map<Edge>;
  release: () => void;
}> {
  startCleanupTimer();

  let conn = pool.get(roomId);

  // Reuse existing connection if it's still connected
  if (conn && conn.connected) {
    console.log(
      `[collab-pool] reuse: room=${roomId} (refCount=${conn.refCount + 1})`,
    );
    conn.refCount++;
    conn.lastUsed = Date.now();
    return createReleaseContext(conn, roomId);
  }

  // Clean up stale connection if it exists but is disconnected
  if (conn && !conn.connected) {
    console.log(`[collab-pool] removing stale connection: room=${roomId}`);
    try {
      conn.provider.destroy();
    } catch {
      // ignore cleanup errors
    }
    pool.delete(roomId);
  }

  // Create new connection
  console.log(`[collab-pool] connect: room=${roomId} (new connection)`);
  console.log(`[collab-pool] server url: ${COLLAB_SERVER_URL}`);
  const doc = new Y.Doc();

  // HocuspocusProvider accepts WebSocketPolyfill at runtime for Node.js
  // even though the TypeScript types don't expose it directly on the union type.
  const provider = new HocuspocusProvider({
    url: COLLAB_SERVER_URL,
    name: roomId,
    document: doc,
    WebSocketPolyfill: WebSocket,
  } as ConstructorParameters<typeof HocuspocusProvider>[0]);

  provider.on("onDisconnect", () => {
    handleConnectionClose(roomId);
  });

  // Wait for initial sync
  const startTime = Date.now();
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.error(
        `[collab-pool] sync timed out: room=${roomId} after ${elapsed}ms`,
      );
      console.error(
        `[collab-pool] provider state: synced=${provider.isSynced}`,
      );
      reject(new Error(`Yjs sync timed out after ${elapsed}ms`));
    }, INITIAL_SYNC_TIMEOUT_MS);

    if (provider.isSynced) {
      const elapsed = Date.now() - startTime;
      console.log(
        `[collab-pool] sync completed (immediate): room=${roomId} in ${elapsed}ms`,
      );
      clearTimeout(timer);
      resolve();
      return;
    }

    provider.on("synced", ({ state }: { state: boolean }) => {
      if (state) {
        const elapsed = Date.now() - startTime;
        console.log(
          `[collab-pool] sync completed: room=${roomId} in ${elapsed}ms`,
        );
        clearTimeout(timer);
        resolve();
      }
    });
  });

  conn = {
    doc,
    provider,
    refCount: 1,
    lastUsed: Date.now(),
    connected: true,
  };
  pool.set(roomId, conn);

  return createReleaseContext(conn, roomId);
}

function createReleaseContext(conn: PooledConnection, roomId: string) {
  const nodesMap = conn.doc.getMap<DomainNode>("nodes");
  const edgesMap = conn.doc.getMap<Edge>("edges");

  return {
    doc: conn.doc,
    nodesMap,
    edgesMap,
    release: () => {
      conn.refCount--;
      conn.lastUsed = Date.now();
      console.log(
        `[collab-pool] release: room=${roomId} (refCount=${conn.refCount})`,
      );
    },
  };
}

export function getPoolStats() {
  return {
    size: pool.size,
    connections: Array.from(pool.entries()).map(([roomId, conn]) => ({
      roomId,
      refCount: conn.refCount,
      connected: conn.connected,
      lastUsed: new Date(conn.lastUsed).toISOString(),
    })),
  };
}
