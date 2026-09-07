"use client";

import { useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useCanvasSync } from "@/lib/sync/useCanvasSync";
import { ExcalidrawCanvas } from "../excalidraw-canvas";

interface CanvasProps {
  roomId: string;
}

export function Canvas({ roomId }: CanvasProps) {
  const [canvasApi, setCanvasApi] = useState<ExcalidrawImperativeAPI | null>(
    null,
  );

  const { handleLocalChange } = useCanvasSync({ roomId, canvasApi });

  return (
    <div className="relative flex-1 h-full">
      <ExcalidrawCanvas
        excalidrawAPI={setCanvasApi}
        onChange={(elements) => {
          console.log("Local change:", elements);
          handleLocalChange(elements);
        }}
      />
    </div>
  );
}
