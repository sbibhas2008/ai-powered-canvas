import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";
import * as Y from "yjs";

const PORT = Number(process.env.PORT) || 1234;

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws, req) => {
  setupWSConnection(ws, req);
});

wss.on("listening", () => {
  console.log(`[collab-server] y-websocket running on ws://localhost:${PORT}`);
});
