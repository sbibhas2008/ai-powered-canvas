import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Y from "yjs";
import type { Node as DomainNode, Edge } from "@/lib/domain/types";
import { AGENT_ORIGIN } from "@/lib/sync/origins";

const acquireCollabDoc = vi.hoisted(() => vi.fn());

vi.mock("./collab-pool", () => ({ acquireCollabDoc }));

const { withCollabWrite } = await import("./headlessClient");

let doc: Y.Doc;
let release: ReturnType<typeof vi.fn>;
let origins: unknown[];

function node(id: string): DomainNode {
  return {
    id,
    type: "rectangle",
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
  } as DomainNode;
}

function edge(id: string): Edge {
  return { id, type: "edge", from: "a", to: "b" } as Edge;
}

beforeEach(() => {
  doc = new Y.Doc();
  release = vi.fn();
  origins = [];

  doc.on("afterTransaction", (transaction: Y.Transaction) => {
    origins.push(transaction.origin);
  });

  acquireCollabDoc.mockReset();
  acquireCollabDoc.mockResolvedValue({
    doc,
    nodesMap: doc.getMap<DomainNode>("nodes"),
    edgesMap: doc.getMap<Edge>("edges"),
    release,
  });
});

describe("withCollabWrite", () => {
  it("commits every write in a single transaction tagged AGENT_ORIGIN", async () => {
    await withCollabWrite("default-room", ({ nodesMap, edgesMap }) => {
      nodesMap.set("n1", node("n1"));
      nodesMap.set("n2", node("n2"));
      edgesMap.set("e1", edge("e1"));
    });

    expect(origins).toEqual([AGENT_ORIGIN]);
  });

  it("applies the writes to the document", async () => {
    await withCollabWrite("default-room", ({ nodesMap }) => {
      nodesMap.set("n1", node("n1"));
    });

    expect(doc.getMap<DomainNode>("nodes").get("n1")?.id).toBe("n1");
  });

  it("returns the callback's value", async () => {
    const result = await withCollabWrite("default-room", () => "done");

    expect(result).toBe("done");
  });

  it("releases the pooled connection after a successful write", async () => {
    await withCollabWrite("default-room", ({ nodesMap }) => {
      nodesMap.set("n1", node("n1"));
    });

    expect(release).toHaveBeenCalledTimes(1);
  });

  it("releases the pooled connection when the write throws", async () => {
    await expect(
      withCollabWrite("default-room", () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(release).toHaveBeenCalledTimes(1);
  });

  it("does not leave an untagged transaction behind on failure", async () => {
    await expect(
      withCollabWrite("default-room", ({ nodesMap }) => {
        nodesMap.set("n1", node("n1"));
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(origins.every((origin) => origin === AGENT_ORIGIN)).toBe(true);
  });
});
