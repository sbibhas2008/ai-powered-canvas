"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useCanvasSync } from "@/lib/sync/useCanvasSync";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false },
);

export default function App() {
  const [canvasApi, setCanvasApi] = useState<ExcalidrawImperativeAPI | null>(
    null,
  );

  const { handleLocalChange } = useCanvasSync({
    roomId: "default-room",
    canvasApi,
  });

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Excalidraw
        excalidrawAPI={setCanvasApi}
        onChange={(elements) => {
          console.log("Local change:", elements);
          handleLocalChange(elements);
        }}
      />
    </div>
  );
}
