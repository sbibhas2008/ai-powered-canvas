import * as Y from "yjs";
import type { Node as DomainNode, Edge } from "@/lib/domain/types";
import { AGENT_ORIGIN } from "@/lib/sync/origins";
import { acquireCollabDoc } from "./collab-pool";

export interface CollabWriteContext {
  doc: Y.Doc;
  nodesMap: Y.Map<DomainNode>;
  edgesMap: Y.Map<Edge>;
}

/**
 * Acquires a connection from the pool, runs a callback against the document's
 * Y.Maps, then releases the connection back to the pool for reuse.
 */
export async function withCollabDoc<T>(
  roomId: string,
  fn: (
    doc: Y.Doc,
    nodesMap: Y.Map<DomainNode>,
    edgesMap: Y.Map<Edge>,
  ) => Promise<T>,
): Promise<T> {
  console.log(`[headless] acquire: room=${roomId}`);
  const startTime = Date.now();
  const { doc, nodesMap, edgesMap, release } = await acquireCollabDoc(roomId);

  try {
    const result = await fn(doc, nodesMap, edgesMap);
    const duration = Date.now() - startTime;
    console.log(`[headless] completed: room=${roomId} in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[headless] failed: room=${roomId} in ${duration}ms`,
      error,
    );
    throw error;
  } finally {
    release();
  }
}

/**
 * Runs a write against the document's Y.Maps inside a single transaction
 * tagged with AGENT_ORIGIN, so a whole operation lands as one atomic,
 * attributable change rather than one untagged transaction per `.set()`.
 *
 * The callback is deliberately synchronous: a Yjs transaction does not span
 * an `await`, so an async callback would close the transaction at its first
 * await point and any later write would escape the origin tag. Resolve
 * everything you need before calling this, then commit in one go.
 */
export async function withCollabWrite<T>(
  roomId: string,
  write: (ctx: CollabWriteContext) => T,
): Promise<T> {
  return withCollabDoc(roomId, async (doc, nodesMap, edgesMap) =>
    doc.transact(() => write({ doc, nodesMap, edgesMap }), AGENT_ORIGIN),
  );
}
