export interface ArrowBinding {
  elementId: string;
  focus: number;
  gap: number;
  fixedPoint: null;
}

export interface ArrowGeometry {
  x: number;
  y: number;
  points: [number, number][];
}

export interface BoundElementRef {
  id: string;
  type: "text" | "arrow";
}
