import { Server } from "@hocuspocus/server";

const PORT = Number(process.env.PORT) || 1234;

const server = new Server({
  port: PORT,

  async onConnect({ documentName }) {
    console.log(`[collab-server] Client connected: ${documentName}`);
  },

  async onLoadDocument({ documentName }) {
    console.log(`[collab-server] Loading document: ${documentName}`);
    return null;
  },

  async onStoreDocument({ documentName }) {
    console.log(`[collab-server] Storing document: ${documentName}`);
  },

  async onDisconnect({ documentName }) {
    console.log(`[collab-server] Client disconnected: ${documentName}`);
  },
});

server.listen();

console.log(`[collab-server] Hocuspocus running on ws://localhost:${PORT}`);
