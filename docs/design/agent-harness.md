# Agent Harness Redesign

**Status:** Proposed
**Scope:** The AI agent's tool surface, placement logic, and orchestration
**Does not cover:** The renderer, the CRDT transport, or the domain model's shape (except where noted)

---

## TL;DR

The agent currently does its own arithmetic to decide where shapes go. It is bad at that, and it's the main reason output is unreliable. This document proposes removing coordinates from everything the model can see, and resolving position deterministically in code instead.

The model stops saying *"draw a box at (340, 220)"* and starts saying *"draw a box below the auth service"*. Code turns the second into the first.

Four things in the original brief turned out not to match the code, and are corrected in §3. Seven proposed pieces were cut as over-engineering for this stage; they're listed with reasons in the appendix, because "we considered it and said no" is more useful than silence.

---

## 1. Why this exists

Today the agent picks its own pixel coordinates. The `draw_shape` tool takes `x`, `y`, `width`, and `height`, and the system prompt instructs the model to do arithmetic:

> - For subsequent shapes, use list_elements output to compute relative positions (previous.x + previous.width + 50)
> - Keep all shapes within canvas bounds (x: 0-1100, y: 0-700) to ensure visibility

— [`ui/lib/agent/agent.ts:44,79`](../../ui/lib/agent/agent.ts)

This asks a language model to do the one thing language models are worst at: spatial reasoning and multi-step arithmetic held in working memory. The failure modes are predictable and all present — shapes overlapping, shapes drifting off-canvas, flowcharts whose rows don't line up, and arrows pointing at nodes that were never created.

None of this is a prompting problem. You cannot prompt your way to reliable geometry. The fix is to stop asking.

**The thesis of this document:** the model supplies *meaning* (what kind of thing, what it's called, what it relates to). Code supplies *numbers*. The two never mix, and there is no tool schema anywhere that lets a coordinate cross the boundary.

---

## 2. Current state

*What exists today, with citations. Read this before the proposal — several claims in the original brief don't survive contact with the code.*

### 2.1 Domain model

[`ui/lib/domain/types.ts`](../../ui/lib/domain/types.ts) is 90 lines. `Node` carries `position` and `size` inline; `Edge` carries `from`/`to` plus *optional* `position` and `points`.

What the domain does **not** have: grouping, z-order, or rotation. `groupIds: []` and `angle: 0` are hardcoded at export time ([`canvasToExcalidraw/factories.ts:28,100`](../../ui/lib/mapper/adapters/canvasToExcalidraw/factories.ts)). This matters later — the brief lists "orphaned groups" as an invariant to check, but there are no groups to orphan.

Ids are `randomUUID()` ([`domain/factories.ts:27,52`](../../ui/lib/domain/factories.ts)). There is no readable-id scheme anywhere in the repo.

### 2.2 The vendor escape hatch

It's called `renderMeta` ([`types.ts:29-39`](../../ui/lib/domain/types.ts)), and it is **closed, not open**: a hardcoded `excalidraw?` key with exactly three enumerated fields (`roughness`, `fillStyle`, `roundness`). There is no index signature and no generic vendor map, so adding a fourth Excalidraw property or a second renderer means editing the domain type.

That's a reasonable trade for a single-renderer app, but it's worth naming, because the architecture doc describes it as a general escape hatch and it isn't one yet.

### 2.3 Translation is not lossless

The brief states translation is lossless. It isn't.

**Preserved:** element ids, geometry, `startBinding`/`endBinding` element ids, the styles in `BaseStyle`, and `renderMeta`.

**Lost or silently rewritten:**

| Field | What happens |
|---|---|
| `angle` | No domain field; always written as `0`. Rotating a shape is destroyed on the next remote render. |
| `index` (z-order) | Never emitted. Order is nodes-then-edges insertion order. |
| `groupIds` | Always `[]`. Groups are destroyed. |
| `binding.focus` / `gap` | Always `0` / `1`. Per-arrow anchor tuning is flattened. |
| `fixedPoint` | Always `null`. Elbow arrows lose anchors. |
| `startArrowhead` / `endArrowhead` | Hardcoded `null` / `"arrow"`. |
| `fontFamily` | Typed `string` in the domain but numeric in Excalidraw; always reset. |
| `line`, `freedraw`, `image`, `frame`, `embeddable` | **No adapter — dropped entirely** ([`excalidrawToCanvas/index.ts:38-55`](../../ui/lib/mapper/adapters/excalidrawToCanvas/index.ts)) |

That last row is the consequential one. See §3.3.

There is also no test asserting domain → Excalidraw → domain; the only roundtrip test in [`excalidraw.test.ts`](../../ui/lib/mapper/excalidraw.test.ts) starts from Excalidraw.

### 2.4 Tools

Three, in [`ui/lib/agent/tools/`](../../ui/lib/agent/tools/):

- **`draw_shape`** — takes `x`, `y`, `width`, `height`. This is the problem.
- **`connect_nodes`** — already coordinate-free and id-based. Arrow geometry is derived at render time by `resolveArrowGeometry` ([`excalidrawAdapter.ts:45-70`](../../ui/lib/mapper/adapters/canvasToExcalidraw/excalidrawAdapter.ts)). **This tool is the model for where we're going** — it already proves the pattern works.
- **`list_elements`** — no coordinates in its *schema*, but it prints them in its *output* ([`listElements.ts:20-23`](../../ui/lib/agent/tools/listElements.ts)). Geometry reaches the model in both directions.

All three take `roomId` as a **model-supplied argument**. Combined with Hocuspocus having no auth, a hallucinated or injected room id writes into an arbitrary document. This should be server-injected.

### 2.5 Agent loop

[`agent.ts:82-100`](../../ui/lib/agent/agent.ts): `createAgent` from `langchain@1.5.2`, Gemini 2.5 Flash, `temperature: 0`, cached as a module-level singleton. No checkpointer, no recursion limit configured (falls back to LangGraph's default of 25), no per-conversation state.

Message history is re-sent from the client each request, and [`route.ts:16-25`](../../ui/app/api/agent/route.ts) flattens only `type === "text"` parts — so **prior tool calls and results are dropped every turn**. The agent has no recollection of what it drew except by calling `list_elements` again.

### 2.6 Collaboration transport

Two root `Y.Map`s, `"nodes"` and `"edges"`, keyed by element id, with whole plain objects as values. Because the value is the entire element, writes are **last-write-wins per element** — there is no per-field merge.

Agent writes are bare `.set()` calls **outside any transaction and with no origin tag** ([`drawShape.ts:48-50`](../../ui/lib/agent/tools/drawShape.ts)). The browser writer, by contrast, uses `doc.transact(..., LOCAL_ORIGIN)` ([`useLocalCanvasSync.ts:61-64`](../../ui/lib/sync/useLocalCanvasSync.ts)). Consequences: nothing can distinguish an agent edit from another human's, and a multi-shape run produces N separate re-renders instead of one.

The agent never touches `provider.awareness` — there is no presence signal at all.

### 2.7 What does not exist

Worth stating plainly, because it's a lot:

- **No layout, collision, bounding-box, or spatial-index code.** No `dagre`, `elkjs`, or `rbush` in any of the three manifests. The only geometry in the repo is [`geometry.ts`](../../ui/lib/mapper/geometry.ts) (126 lines), used solely to compute arrow endpoints.
- **No validation layer.** No zod schema for the domain, no referential integrity. `connect_nodes` will happily create an edge to a node that doesn't exist; it then silently renders nothing ([`excalidrawAdapter.ts:108`](../../ui/lib/mapper/adapters/canvasToExcalidraw/excalidrawAdapter.ts)).
- **No tool-call visibility.** [`stream.ts:16`](../../ui/lib/agent/stream.ts) drops every event except text deltas.
- **No working cancellation.** The stop button aborts the client fetch; the server keeps looping and keeps writing shapes.
- **No tests for the agent, its tools, the connection pool, or the stream.** `agent.test.ts` asserts on prompt string contents only.

---

## 3. Four corrections to the brief

*Each of these changes what should be built, so they're stated before the proposal rather than buried in it.*

### 3.1 We are already on LangGraph, and no graph authoring is needed

The brief proposes "LangGraph.js replacing the current LangChain loop." But `createAgent` from `langchain@1.5.2` **already compiles to a LangGraph `StateGraph`** — `@langchain/langgraph@1.4.7` and `@langchain/langgraph-checkpoint@1.1.3` are already in the dependency tree transitively.

More importantly, the returned `ReactAgent` already exposes everything the brief wants from the migration:

```ts
get checkpointer(): BaseCheckpointSaver | boolean | undefined;
get store(): BaseStore | undefined;
withConfig(config): ReactAgent   // recursionLimit
// invoke/stream accept config.signal
```
— `ui/node_modules/langchain/dist/agents/ReactAgent.d.ts:63-109`

So checkpointing, resumable runs, cancellation, and loop bounds are **configuration, not construction**. This collapses what the brief framed as a framework migration into passing four options to a function that's already being called. Authoring a custom graph buys nothing until there's a real branch to express — see §10.3.

### 3.2 There is no persistence anywhere

The brief asks for "a durable checkpointer (not MemorySaver)". But there is no database in the monorepo — no `pg`, `sqlite`, `redis`, or Supabase client in any of the three `package.json` files.

And the canvas itself isn't durable: `onLoadDocument` returns `null` ([`collab-server/src/index.ts:17-20`](../../collab-server/src/index.ts)), so **every document dies when the collab server restarts.**

A durable record of the agent's conversation, sitting on top of a canvas that evaporates on restart, is backwards. If durability is worth building, canvas persistence should land first — otherwise you can faithfully resume a run against a document that no longer exists.

(`AGENTS.md` lists "Persistence & Identity: Supabase (PostgreSQL, managed Auth)" in the core stack. That's aspirational; no such dependency exists. Worth fixing in that doc.)

**Decision: `MemorySaver`, behind an interface so the swap is cheap later.**

### 3.3 The illustrative path has two blockers the brief doesn't account for

The brief describes illustrative output entering the domain as "a single opaque entity with a bbox". Two things stand in the way:

1. **Excalidraw images need a `BinaryFiles` store**, keyed by `fileId`, which is entirely separate from `elements` and **completely absent from the Yjs sync** — only `"nodes"` and `"edges"` maps exist. Images would render on the machine that created them and appear broken everywhere else.

2. **The sync layer would delete the entity.** `reconcile` deletes any key in the `Y.Map` that isn't present in the local element list ([`useLocalCanvasSync.ts:31-33`](../../ui/lib/sync/useLocalCanvasSync.ts)), and the mapper drops element types it has no adapter for. So the agent writes an opaque entity, the browser can't render it, the next local edit produces an element list without it, and **reconcile deletes it.** Written by the agent, destroyed by the user's next click.

Neither is unsolvable, but together they're a multi-week workstream touching the sync layer's core invariant. **Decision: design the boundary, build nothing.** §6 keeps the macro set open to it; nothing else in this document depends on it.

### 3.4 "Macro boundary = undo boundary" doesn't follow from the current code

Undo today is Excalidraw's local, per-client undo stack. Agent writes arrive as *remote* transactions and are applied via `updateScene`. They are not meaningfully in the user's Ctrl+Z history, and making them so requires a `Y.UndoManager` scoped by origin, coexisting with Excalidraw's own undo — a genuinely fiddly piece of work with a lot of interleaving edge cases.

**Decision: an explicit "revert last agent run" action instead.** It reverses the run's ops by id, which is predictable and testable, and it doesn't fight the renderer's undo stack. The macro is still a single transaction — that part of the brief stands and is worth having on its own merits (one re-render, atomic visibility to peers).

---

## 4. Gap analysis

| Area | Exists | Changes | New |
|---|---|---|---|
| Domain types | `Node`, `Edge`, `CanvasState`, `renderMeta` | — | Optional `createdBy: "agent" \| "user"` for revert |
| Domain factories | `createNode`, `createEdge` | Id generation gains a readable-slug path | Slug + collision minting |
| Mapper | Bidirectional, tested | **Nothing** — readable ids are just strings | — |
| Tools | 3, coordinate-bearing | Replaced wholesale by macros | 8 macros with coordinate-free schemas |
| Placement | None (prompt text) | — | Resolver: sizing, relative offset, collision nudge |
| Validation | None | — | `checkInvariants` + pre-commit re-check |
| Scene → model | `list_elements`, prints coordinates | Replaced by `describe_scene` | Handle assignment + resolution table |
| Agent loop | `createAgent`, no config | Add `checkpointer`, `recursionLimit`, `signal` | Run registry (`runId` → `AbortController`) |
| Yjs writes | Bare `.set()`, no origin | Wrapped in one `transact` with `AGENT_ORIGIN` | — |
| API | `POST /api/agent`, text-only stream | `roomId` server-injected; stream gains `data-*` parts | `POST /api/agent/cancel` |
| Client | Renders text parts only | Renders step/tool parts | Awareness presence |
| Tests | Mapper + domain well covered; agent not at all | — | Eval suite with pass-rate tracking |

---

## 5. The macro interface

*A macro is one complete, meaningful change to the canvas — "add a node here", "connect these two", "draw this five-step flow". The model asks for it in semantic terms; the code works out every number.*

*Each macro runs in separated stages: **work out what would change** (pure, touches nothing), **check the result is sane**, then **write it all at once**. Splitting it this way means a macro can fail without ever having half-drawn something. And when it fails, the model gets a sentence explaining why — so it corrects itself instead of the run dying.*

```ts
type MacroResult =
  | { ok: true; ops: Op[]; summary: string }
  | { ok: false; reason: string; hint: string };

interface Macro<A> {
  name: string;
  description: string;
  schema: z.ZodType<A>;                                   // no x/y/width/height, ever
  resolve(scene: SceneSnapshot, args: A): MacroResult;    // pure — no side effects
}

type Op =
  | { kind: "upsertNode"; node: Node }
  | { kind: "upsertEdge"; edge: Edge }
  | { kind: "deleteNode"; id: string }
  | { kind: "deleteEdge"; id: string };
```

### Execution pipeline

`Op`s are internal. The model never sees them — it sees the macro's `summary` on success or its `hint` on failure.

```
resolve(scene, args)       → ops | { ok: false, hint }    pure
applyOps(scene, ops)       → scene'                       in-memory projection
placement(scene')          → scene''                      offsets + collision nudge
checkInvariants(scene'')   → ok | { ok: false, hint }
commit(diff(scene, scene''))                              ONE Y.transact, AGENT_ORIGIN
```

Two properties fall out of this shape, and both matter:

**Failures never throw.** They return a `hint` that becomes the tool result. `"No element called 'databse'. Known: auth_service, db, payments"` is something the model can act on; a stack trace is not. This is the self-correction loop.

**Nothing is written until everything validates.** `resolve` and `placement` operate on an in-memory projection of the scene. The `Y.Doc` isn't touched until `commit`, and `commit` is a single transaction. There is no state in which a macro has half-applied.

---

## 6. Starter macro set

*Eight macros. Every schema below is the complete contract the model sees — reviewing them is how you verify no geometry leaked back in.*

`roomId` appears in none of them: it's injected server-side from the request (§11), closing the arbitrary-document-write hole in §2.4.

### Shared schemas

```ts
const Ref = z.string()
  .describe("Name of an existing element, exactly as given by describe_scene.");

const Gap = z.enum(["tight", "normal", "loose"])
  .describe("How much space to leave. Not a pixel value.");

const Near = z.object({
  ref: Ref,
  direction: z.enum(["above", "below", "left", "right"]),
  gap: Gap.optional(),
}).describe("Position relative to an existing element.");

const Style = z.object({
  strokeColor:     z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  strokeWidth:     z.enum(["thin", "normal", "thick"]).optional(),
  strokeStyle:     z.enum(["solid", "dashed", "dotted"]).optional(),
  textSize:        z.enum(["small", "normal", "large"]).optional(),
  opacity:         z.number().min(0).max(1).optional(),
}).describe("Visual styling. Contains no positions or dimensions.");

const NewRef = z.string().regex(/^[a-z][a-z0-9_]*$/).optional()
  .describe("Optional name for the new element. Defaults to one derived from its label.");
```

**Note the deviation from the brief:** it specifies `near: { ref, direction, gap? }` with `gap` implicitly numeric. We make `gap` an enum, and `strokeWidth`/`textSize` too. A pixel value in the schema is still geometry the model has to reason about, and "should this gap be 40 or 60?" is exactly the question we're trying to stop asking. The enum maps to constants in code. If a caller genuinely needs a pixel gap later, that's a code-side constant change, not a model-side one.

### The macros

```ts
// 1. Create one node.
create_node: z.object({
  ref:   NewRef,
  kind:  z.enum(["rectangle", "ellipse", "diamond", "text"]),
  label: z.string().min(1).max(120),
  near:  Near.optional(),        // omitted → append rule, §7
  style: Style.optional(),
})

// 2. Connect two existing nodes with an arrow.
connect: z.object({
  from:  Ref,
  to:    Ref,
  label: z.string().max(60).optional(),
  style: Style.optional(),
})

// 3. Create a whole chain of connected nodes in one call.
create_flow: z.object({
  steps: z.array(z.object({
    ref:   NewRef,
    label: z.string().min(1).max(120),
    kind:  z.enum(["rectangle", "ellipse", "diamond"]).optional(),
  })).min(2).max(20),
  direction: z.enum(["down", "right"]).default("down"),
  startNear: Near.optional(),
  connect:   z.boolean().default(true),
})

// 4. Reposition an existing node relative to another.
move_near: z.object({ ref: Ref, near: Near })

// 5. Change a node's or edge's text.
relabel: z.object({ ref: Ref, label: z.string().min(1).max(120) })

// 6. Restyle one or more elements.
restyle: z.object({ refs: z.array(Ref).min(1).max(50), style: Style })

// 7. Delete elements. Incident edges are removed automatically.
delete: z.object({ refs: z.array(Ref).min(1).max(50) })

// 8. Read the canvas. Returns names, kinds, labels, and connections — no coordinates.
describe_scene: z.object({})
```

**`create_flow` is the biggest single reliability win.** "Draw a five-step onboarding flow" currently means eleven tool calls, each one an opportunity to fumble a coordinate. Here it's one call whose geometry is a loop in code. Most real prompts are flows.

**There is no `group` macro** — the domain has no grouping (§2.1), so the brief's "orphaned groups" invariant has nothing to check. If grouping lands in the domain later, it gets a macro then.

---

## 7. Placement resolution

*This is the piece that replaces the model's arithmetic. The model says "put a database below the auth service"; this decides what that means in pixels. It works out how big the box needs to be from the text going into it, puts it where the direction says, and if something's already sitting there, slides it along until it isn't.*

*The awkward case the brief skips is when there's nothing to be near — the very first shape on an empty canvas, or one the model just didn't anchor. That needs a defined answer, or placement is undefined in the most common situation there is.*

### Sizing

Derived from the label, never supplied by the model. Reuse the existing constants in [`domain/constants.ts`](../../ui/lib/domain/constants.ts) — `LABEL_SIZING` (`charWidthRatio`, `paddingRatio`, `minWidthRatio`) and `DEFAULT_NODE_SIZE` — which already encode this and are already consumed by the edge-label sizing path at [`canvasToExcalidraw/factories.ts:182-188`](../../ui/lib/mapper/adapters/canvasToExcalidraw/factories.ts).

```
width  = max(DEFAULT_NODE_SIZE.width,  textWidth(label, fontSize) + fontSize * paddingRatio)
height = max(DEFAULT_NODE_SIZE.height, lineCount * fontSize * lineHeight + fontSize * paddingRatio)
```

Circles (`ellipse` where the model wants equal axes) take `max(width, height)` on both. This replaces the three paragraphs of prompt text currently trying to teach the model to size circles.

### Relative placement

Given an anchor rect `A`, a direction, and a gap constant `g`:

| Direction | Result |
|---|---|
| `right` | `x = A.x + A.width + g`, vertically centred on `A` |
| `left` | `x = A.x - width - g`, vertically centred on `A` |
| `below` | `y = A.y + A.height + g`, horizontally centred on `A` |
| `above` | `y = A.y - height - g`, horizontally centred on `A` |

### Collision

Test the candidate rect against every existing rect (axis-aligned overlap, inflated by a minimum-separation constant). On overlap, step the candidate along the direction's axis by `g` and retest, up to a bounded number of attempts; then fall back to the append rule below.

**Use a plain O(n) scan.** At the scale this canvas operates (tens of elements, low hundreds at worst) a linear scan is faster than building an index, and `rbush` is a dependency and a cache-invalidation problem for a loop that runs in microseconds. Revisit if profiling ever says otherwise.

### The no-anchor case

Two sub-cases, both fully deterministic:

**Empty scene** → seed at `(100, 100)`. One constant, one obvious answer.

**Non-empty, no `near`** → append in reading order. Compute the bounding box of all existing elements; place the new element to the right of it with gap `g`; if that would exceed a maximum row width, wrap to a new row below the bbox instead, starting at the bbox's left edge.

This is the rule that makes "draw three boxes" work without the model tracking anything between calls. It also means a sequence of unanchored `create_node` calls produces a tidy grid rather than a pile.

### No graph layout pass

The brief proposes dagre or elkjs over the domain graph. **Not in this design**, for two reasons:

1. `create_flow` — the case that actually motivates auto-layout — is a chain of relative placements, which the resolver above already does. Adding a layout engine to draw a straight line of boxes is not a good trade.
2. A layout pass that runs over the whole graph **rewrites the positions of elements the user placed by hand.** On a shared canvas where a human is drawing at the same time, that's hostile. Any future layout work must be explicitly opt-in and scoped to a selection.

If arbitrary re-layout becomes a real requirement, `dagre` is the pick — synchronous, small, and sufficient for layered graphs. `elkjs` is async and considerably heavier for what this needs.

---

## 8. Ids and reference handles

*Every shape currently has an id like `a7f3e9c1-4b2d-11ee-be56-0242ac120002`. Those ids are the only way the model can point at anything, and they're terrible for the job — it can't hold them in memory, they consume its limited reading budget, and it regularly invents ones that don't exist.*

*So we give shapes **names**. Like contacts on a phone: you tap "Mum", the phone knows the number. The model says `auth_service`, and our code swaps in the real id before touching anything.*

*Shapes the AI draws get named at birth — a box labelled "Auth Service" simply gets the id `auth_service`. Shapes you drew by hand already have random ids we don't control, so we invent a nickname when describing the canvas: its text if it has any (`payments`), otherwise one derived from its id (`rect_a3f`). The model only ever sees names.*

### The rule

**A `ref` is not an id.** It's a handle, and the resolver maps handles to domain ids.

| Element | Handle | Stability |
|---|---|---|
| Agent-created | its actual id (`auth_service`) | permanent — the id *is* the handle |
| User-drawn, labelled | slug of the label (`payments`) | stable while the label is |
| User-drawn, unlabelled | `${kind}_${shortHash(id)}` (`rect_a3f`) | permanent — derived from the uuid |

What the model sees from `describe_scene`:

```
nodes:
  auth_service   rectangle  "Auth Service"
  db             ellipse    "Database"
  payments       rectangle  "Payments"
  rect_a3f       rectangle  (no label)
edges:
  auth_service -> db  "queries"
```

No coordinates, no sizes, no uuids.

### Why hashes and not numbers

For unlabelled user shapes, the fallback handle is derived from a hash of the element's uuid — not an ordinal like `rect_1`, `rect_2`.

Ordinals shift. Delete `rect_1` and everything renumbers: yesterday's `rect_2` is today's `rect_1`. If the model remembered a handle from earlier in the conversation, it now points at a different shape and will confidently edit the wrong thing. A hash of the element's own id never moves, needs no stored table, and survives any amount of churn around it.

### Resolution

The serializer builds `Map<handle, domainId>` at snapshot time, held in the run context — server-side, never written to the `Y.Doc`, never shown to the model. `resolve` looks up every `ref` through it.

- **Unknown handle** → `{ ok: false, hint: "No element 'databse'. Known: auth_service, db, payments" }`
- **Ambiguous handle** (two shapes both labelled "Box") → error listing the candidates. **Never a guess.** Silently picking one is how you corrupt someone's diagram in a way they won't notice for an hour.

### Minting agent ids

`slug(label)`, prefixed by kind where it reads better, with a `_2`, `_3` … suffix on collision against a fresh snapshot. The pre-commit re-check (§10.4) catches the case where two concurrent runs mint the same name.

### Why this was the cheap option

The domain id is used **verbatim** as the Excalidraw element id, and the mapper derives `seed: stableHash(el.id)` and bound-label ids `${id}-label` from it. Excalidraw doesn't care whether an id is a uuid or the word `auth_service` — it's all opaque text.

So **nothing in the translation layer changes.** No remap table, no identity break, no migration of existing documents. That's the entire reason for naming only agent-created elements rather than renaming everything.

**Known wart:** rename a label and the id goes stale — `auth_service` labelled "Login Service". Acceptable: ids are opaque handles, and `describe_scene` always shows the live label next to the handle, so the model is never misled. It just looks untidy in the `Y.Doc`.

---

## 9. Invariants

*The rules that must hold after every macro. The point of checking them before commit rather than after is that a macro that would break one simply doesn't happen — the model gets told why and tries again, and the canvas never passes through a broken state.*

| Invariant | Enforced in | Notes |
|---|---|---|
| Edge endpoints exist | `checkInvariants` | Today's dangling edges silently render nothing |
| `edge.from` / `to` non-empty | `checkInvariants` | Ingest currently coerces to `""` |
| No duplicate ids | `checkInvariants` | Also guards the id-minting race |
| No self-edge | `resolve` | Caught early — it's an argument error |
| Geometry finite, non-`NaN` | `checkInvariants` | Cheap guard against resolver bugs |
| No overlapping nodes | guaranteed by `placement`, asserted by `checkInvariants` | Assertion catches resolver regressions |
| Within canvas bounds | `placement` clamps, `checkInvariants` asserts | |
| Delete cascades to incident edges | `resolve` | Prevents creating the dangling case |
| Referenced ids still present | pre-commit re-check | The concurrency guard — §10.4 |

Absent from the brief's list: **orphaned groups.** There is no grouping in the domain (§2.1), so there's nothing to check. Add it with grouping, if grouping ever lands.

---

## 10. Agent configuration and concurrency

*Two things here. First, the setup is much smaller than expected — the agent library already supports saving conversation state, cancelling a run, and capping how long it loops, so we switch those on rather than build them. Second, the hard part: you and the AI draw on the same canvas simultaneously. If the AI plans against the canvas as it looked ten seconds ago and you've since deleted the box it was about to connect to, it has to notice and re-think rather than write nonsense.*

### 10.1 Configuration

```ts
const agent = createAgent({
  model,
  tools: macros,
  systemPrompt,                       // much shorter — no coordinate rules left to explain
  contextSchema: agentContextSchema,  // { roomId } — shipped in phase 0
  checkpointer: new MemorySaver(),    // behind an interface; see §3.2
}).withConfig({ recursionLimit: 12 });

await agent.invoke(
  { messages },
  { signal, context: { roomId }, configurable: { thread_id, runId } },
);
```

`roomId` travels in `context`, not in tool arguments.

**As shipped in phase 0:** the room moves in `context` rather than `configurable`. Both work in `langchain@1.5.2`, but `context` is typed by `contextSchema` and reaches a tool as `runtime.context.roomId` via the `ToolRuntime` second parameter, whereas `configurable` arrives untyped. `thread_id` and `runId` stay in `configurable`, which is where LangGraph itself reads the thread from.

A note on the system prompt: roughly half of it today is coordinate instruction — the coordinate system, layout conventions, circle sizing, canvas bounds. All of that becomes dead text once the schemas can't accept coordinates, and should be deleted rather than left to rot. [`agent.test.ts`](../../ui/lib/agent/agent.test.ts) asserts on those exact strings and will need updating with it.

### 10.2 State shape

```ts
interface AgentState {
  messages: BaseMessage[];   // the only thing checkpointed
  roomId: string;            // server-injected, never model-supplied
  runId: string;             // for cancellation and revert
}
```

**Scene state is deliberately absent.** See §10.4.

### 10.3 Topology

The built-in ReAct loop:

```
plan ──▶ (macro tool call) ──▶ plan ──▶ … ──▶ respond
```

It iterates until the model stops calling tools or `recursionLimit` trips. We document it rather than author it because there is currently no branch to express — §3.1.

**The trigger for revisiting this:** the first genuine fork in control flow. Intent routing for the illustrative path (§3.3) is that fork. When it arrives, authoring a graph starts paying for itself. Not before — a hand-authored graph with a single linear path is strictly more code for identical behaviour.

### 10.4 Concurrency

**The core rule: the agent never trusts a remembered picture of the canvas.**

- **Resolve against a fresh snapshot read at execute time.** Not a cached scene, not one from a checkpoint. Every macro reads current state immediately before computing.
- **Checkpoints store messages only — never geometry, never ops.** On resume, re-snapshot and re-resolve from the conversation. Replaying stale ops against a changed document is the single worst failure mode available here, and the way to avoid it is to have nothing to replay.
- **Pre-commit re-check.** Between `resolve` and `commit`, verify every referenced id still exists. If one vanished, abandon the commit and return a hint — the model re-plans against reality. This is what makes a resumed run safe against a document the user edited while it was suspended.

**A hazard worth stating plainly:** `Y.Map` values are whole element objects, so writes are last-write-wins *per element*. If the agent restyles a node while you're dragging it, the agent's write carries the old position and clobbers your move. This is a property of the existing data model, not something this design introduces — but the agent making more writes makes it more visible.

The real fix is per-field granularity (a nested `Y.Map` per element), which is a substantially larger change to the sync layer and out of scope here. **Mitigation:** re-read the element and merge only the fields the macro actually changes, immediately before commit. That narrows the window to milliseconds without closing it. The residual risk should be understood rather than assumed away.

### 10.5 Open: thread scope

The brief says thread id per run. But per *conversation* is what makes "now make it blue" work — a stated goal in [`future-work.md`](../../future-work.md), and currently broken for a second reason (§2.5 — tool history is dropped every turn).

**Recommendation:** thread = conversation, run = one invocation on that thread. `runId` still identifies a run for cancellation and revert. Flagged as a decision, not settled.

---

## 11. API surface

| Endpoint | Change |
|---|---|
| `POST /api/agent` | `roomId` resolved server-side into `configurable`, not accepted from the model. Response includes `runId`. |
| `POST /api/agent/cancel` | **New.** `{ runId }` → aborts via a server-side registry mapping `runId` → `AbortController`. |

**Run lifecycle events ride the existing stream.** [`stream.ts`](../../ui/lib/agent/stream.ts) already uses `createUIMessageStream` from the AI SDK, which carries typed `data-*` parts alongside text. Emitting `data-step` events there is a handful of lines in the existing `for await` loop. A separate SSE channel would mean a second connection, a second lifecycle to manage, and a correlation problem between the two streams — for capability the current transport already has.

The events to emit are **step-level, not token-level**: macro started, macro succeeded with its summary, macro failed with its hint, run finished.

### Client implications

- **[`chat-panel.tsx`](../../ui/components/chat/chat-panel/chat-panel.tsx) renders only text parts** (`getMessageText` filters to `part.type === "text"`). It needs to handle step parts to show tool activity at all.
- **The stop button doesn't currently stop anything server-side.** It calls `stop` from `useChat`, which aborts the fetch; the agent keeps running and keeps writing. Wiring it to `POST /api/agent/cancel` is what makes it real.
- **Presence is entirely absent.** The agent never touches `provider.awareness`. An "AI is drawing" indicator means setting an awareness field around the commit, which is a few lines in the headless client and reuses the presence channel already open.

---

## 12. Eval suite

*The whole premise is that deterministic placement is more reliable than model arithmetic. That's a testable claim, and if we're not measuring it we're guessing.*

Structure: a fixed prompt suite, each run N times (start at 5), asserting on the **resulting domain graph** rather than on the model's prose. Track pass rate per case over time; a case that drops is a regression even if nothing threw.

Assertions are structural and deterministic — node counts, edge endpoints, relative positions, absence of overlap. No model in the assertion path.

| # | Prompt | Assertion |
|---|---|---|
| 1 | "Draw a box labelled Login" | 1 node, `kind: rectangle`, label matches, within bounds |
| 2 | "Draw two boxes and connect them" | 2 nodes, 1 edge, both endpoints resolve to real ids |
| 3 | "Draw a five-step signup flow" | 5 nodes, 4 edges, y strictly increasing, zero overlaps |
| 4 | "Add a database to the right of the auth service" | `x > anchor.x + anchor.width`, y within tolerance of anchor |
| 5 | "Connect the login box to the database" (both exist) | edge between the correct two ids, **no new nodes created** |
| 6 | "Rename the login box to Sign In" | same id, new label, **geometry unchanged** |
| 7 | "Delete the middle step" (3 exist, chained) | 2 nodes remain, **no dangling edges** |
| 8 | "Make the auth service red" | `strokeColor` set, **geometry unchanged** |
| 9 | "Connect the box to the database" (**two** boxes exist) | macro returns `ok: false` with a hint, **zero mutations committed** |
| 10 | "Add a node below the auth service" (slot occupied) | placed without overlap; nudge applied |

Case 9 is the one to watch — it tests that ambiguity produces a question rather than a guess, which is the difference between a tool that's trustworthy on a shared document and one that isn't.

**Plus idempotence:** the same prompt twice must not silently duplicate. This currently fails — nothing prevents it.

---

## 13. Migration phases

*Ordered by risk-adjusted impact. Each phase ships independently and reverts independently.*

**One disagreement with the brief.** It says removing coordinates from schemas should be phase one. Agreed on ordering — but not as a standalone step: with the schemas stripped and no resolver behind them, the agent cannot place anything at all. **Phase 1 must ship the resolver together with the schema change.** Still first, just not alone.

| Phase | Content | Why here | Rollback |
|---|---|---|---|
| **0** | Origin tag on agent writes + single `doc.transact` + server-injected `roomId` | Small, independent of the redesign, closes a security hole. Nothing else depends on it, so it can land immediately. | Revert commit — no schema or API change |
| **1** | Coordinate-free schemas + placement resolver + size-from-label + handle scheme + **thin eval harness** | The core change. Eval harness ships here so every later phase is measured against a baseline. | Feature-flag back to the old tools |
| **2** | Macro contract (`resolve`/`validate`/`commit`), invariants, `describe_scene` | Formalises what phase 1 does ad-hoc; adds the self-correction loop | Flag — macros wrap the phase-1 resolver |
| **3** | `checkpointer`, `recursionLimit`, run registry, working cancel | Configuration only (§3.1). Cheap, high user-visible value. | Drop the config |
| **4** | Step events on the stream + client rendering + awareness presence | Purely additive; no behaviour change | Remove the writers |
| **5** | Revert-last-run | Depends on `runId` from phase 3 and `createdBy` on elements | Additive |
| **—** | *Deferred:* illustrative path, durable checkpointer, canvas persistence, graph auto-layout | See §3.2, §3.3, §7 | — |

Phase 0 is worth landing before anything else regardless of whether the rest proceeds — untagged, untransacted writes and a model-supplied `roomId` are problems in the current system, not just the proposed one.

---

## 14. Open questions

1. **Thread scope** — per run, or per conversation? (§10.5. Recommendation: per conversation.)
2. **Canvas bounds** — currently prompt-only (`0–1200 × 0–800`) and unenforced. A fixed constant, or derived from the user's viewport? Viewport-derived is friendlier but makes placement non-deterministic across clients, which complicates evals.
3. **`create_flow` and existing nodes** — if a flow connects to something already on the canvas, may it reposition that element, or only place its own new ones? (Leaning: only its own — see the hostility argument in §7.)
4. **`createdBy` on elements** — revert-last-run needs to know which elements a run created. Field on the element, or a separate run log? A field is simpler but adds a domain type change; a log is cleaner but needs somewhere to live, and there's no persistence (§3.2).

---

## 15. Non-goals

Explicitly out of scope, so nobody has to wonder:

- Grouping and frames
- Z-order / element ordering
- Rotation
- Multi-renderer support (the escape hatch is Excalidraw-shaped today — §2.2)
- Per-field CRDT granularity (§10.4)
- Authentication (Hocuspocus has none)
- Image generation and the illustrative path (§3.3)
- Durable persistence, for the agent or the canvas (§3.2)
- Graph auto-layout (§7)
- Replacing Excalidraw's native undo (§3.4)

---

## Appendix: considered and cut

*Proposed in the original brief, deliberately not built. Recorded with reasons so the decision can be revisited on evidence rather than re-argued from scratch.*

| Cut | Reason |
|---|---|
| Custom LangGraph `StateGraph` authoring | `ReactAgent` already exposes `checkpointer`, `store`, `signal`, `recursionLimit`. Authoring a graph with one linear path is more code for identical behaviour. Revisit at the first real branch. |
| Intent-classification node | Its only branch target is the deferred illustrative path. Costs a full model round-trip to route to one destination. |
| Separate SSE channel | `createUIMessageStream` already carries typed `data-*` parts on the existing connection. |
| `POST /api/agent/approve` + interrupts | No approval requirement exists. Build it when someone needs to approve something. |
| `dagre` / `elkjs` layout pass | `create_flow` is chained relative placement. A whole-graph layout also rewrites user-placed elements — hostile on a shared canvas. |
| `rbush` spatial index | A linear scan is faster than index construction at this scale. |
| Durable checkpointer | The canvas itself isn't durable. Fix that first, or resume runs against documents that no longer exist. |
