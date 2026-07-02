import { Server } from "@hocuspocus/server";

const PORT = Number(process.env.PORT) || 1234;
const startTime = Date.now();

const server = new Server({
  port: PORT,
  websocketOptions: {
    handleProtocols: () => true,
  },

  async onConnect({ documentName }) {
    const uptime = Math.round((Date.now() - startTime) / 1000);
    console.log(`[collab] connect: room=${documentName} uptime=${uptime}s`);
  },

  async onLoadDocument({ documentName }) {
    console.log(`[collab] loadDocument: room=${documentName}`);
    return null;
  },

  async onStoreDocument({ documentName }) {
    console.log(`[collab] storeDocument: ${documentName}`);
  },

  async onDisconnect({ documentName }) {
    console.log(`[collab] disconnect: room=${documentName}`);
  },
});

server.listen();

console.log(`[collab] Hocuspocus running on ws://localhost:${PORT}`);
console.log(`[collab] Started at ${new Date().toISOString()}`);
