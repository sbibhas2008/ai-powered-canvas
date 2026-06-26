"use client";

import { ChatPanel } from "@/components/chat/chat-panel";
import { Canvas } from "@/components/canvas/canvas";

export default function App() {
  return (
    <div className="flex h-screen w-screen">
      <Canvas roomId="default-room" />
      <ChatPanel />
    </div>
  );
}
