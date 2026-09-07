# Future Work

## Agent Features

- **Chat history / memory** — Pass previous messages to `AgentExecutor` so the agent retains context across turns (e.g., "now make it blue" refers to the last shape drawn).
- **Streaming tool-call visualization** — Stream LangChain agent steps back to the chat panel so users see tool invocations in real time (e.g., "Calling draw_shape... Done").
- **`read_canvas` tool** — Let the agent read the current `CanvasState` (nodes + edges) from the Yjs doc before deciding what to draw. Returns `{ nodes: Record<string, Node>, edges: Record<string, Edge> }`. Enables relative positioning workflows like "add a node to the right of the red rectangle".
- **`update_style` tool** — Modify stroke color, fill color, stroke width, opacity, or stroke style of existing elements by ID.
- **`delete_element` tool** — Remove one or more nodes/edges by ID.
- **`move_element` tool** — Reposition an existing node to new x/y coordinates.
- **`create_edge` tool** — Connect two nodes with an arrow, optionally with a label.
- **`add_label` tool** — Attach or update the text label on an existing shape.
- **Multi-step agentic loops** — Increase `maxSteps` so the agent can chain multiple tool calls in one turn (e.g., "draw a rectangle, then connect it to the ellipse").

## Canvas State Awareness

- **Agent reads canvas on each turn** — Automatically call `read_canvas` before the LLM invocation so the model has full context of what's on the canvas without the user explicitly asking.
- **Spatial reasoning** — Agent calculates relative positions (e.g., "place it below the existing shapes") by inspecting current node positions.

## Infrastructure

- **Supabase Auth integration** — Add `onAuthenticate` hook to Hocuspocus for JWT validation.
- **Document persistence** — Implement `onLoadDocument` / `onStoreDocument` with Supabase Postgres for durable canvas state.
- **Rate limiting per room** — Prevent a single user from flooding one room with agent requests.
- **Agent request queue** — Serialize agent writes to a room to avoid Yjs merge conflicts from concurrent tool executions.

## UX Improvements

- **Tool call rendering in chat** — Show a compact card in the chat panel when a tool is invoked (e.g., "Drew a red rectangle at (100, 200)").
- **Undo support** — Agent-created elements should be undoable via the standard undo stack.
- **Canvas snapshot before/after** — Show a diff or thumbnail of what changed after an agent action.
