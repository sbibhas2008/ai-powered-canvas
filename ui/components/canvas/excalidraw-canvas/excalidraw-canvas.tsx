"use client";

import dynamic from "next/dynamic";

export const ExcalidrawCanvas = dynamic(
  async () => {
    const { Excalidraw } = await import("@excalidraw/excalidraw");
    return { default: Excalidraw };
  },
  { ssr: false },
);
