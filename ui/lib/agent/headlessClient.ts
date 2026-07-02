import * as Y from "yjs";
import type { Node as DomainNode, Edge } from "@/lib/domain/types";
import { acquireCollabDoc } from "./collab-pool";

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
