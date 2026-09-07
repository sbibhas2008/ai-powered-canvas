"use client";

import { ChatPanel } from "@/components/chat/chat-panel";
import { Canvas } from "@/components/canvas/canvas";
import { DEFAULT_ROOM_ID } from "@/lib/sync/room";

export default function App() {
  const roomId = DEFAULT_ROOM_ID;

  return (
    <div className="flex h-screen w-screen">
      <Canvas roomId={roomId} />
      <ChatPanel roomId={roomId} />
    </div>
  );
}
