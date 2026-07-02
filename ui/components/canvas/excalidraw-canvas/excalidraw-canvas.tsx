"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

export const ExcalidrawCanvas = dynamic(
  async () => {
    const { Excalidraw } = await import("@excalidraw/excalidraw");
    return { default: Excalidraw };
  },
  { ssr: false },
);
