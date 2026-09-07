import { describe, it, expect } from "vitest";
import {
  rectangleIntersection,
  ellipseIntersection,
  nodeCenter,
} from "./geometry";

describe("nodeCenter", () => {
  it("returns the center of a node", () => {
    const center = nodeCenter({ x: 100, y: 200 }, { width: 200, height: 100 });

    expect(center).toEqual({ x: 200, y: 250 });
  });

  it("handles zero-position nodes", () => {
    const center = nodeCenter({ x: 0, y: 0 }, { width: 50, height: 50 });

    expect(center).toEqual({ x: 25, y: 25 });
  });
});

describe("rectangleIntersection", () => {
  const rect = { x: 100, y: 100, width: 200, height: 100 };

  it("exits the right edge when target is to the right", () => {
    const center = { x: 200, y: 150 };
    const target = { x: 500, y: 150 };

    const point = rectangleIntersection(
      { x: rect.x, y: rect.y },
      { width: rect.width, height: rect.height },
      center,
      target,
    );

    expect(point.x).toBeCloseTo(300);
    expect(point.y).toBeCloseTo(150);
  });

  it("exits the left edge when target is to the left", () => {
    const center = { x: 200, y: 150 };
    const target = { x: 0, y: 150 };

    const point = rectangleIntersection(
      { x: rect.x, y: rect.y },
      { width: rect.width, height: rect.height },
      center,
      target,
    );

    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(150);
  });

  it("exits the bottom edge when target is below", () => {
    const center = { x: 200, y: 150 };
    const target = { x: 200, y: 500 };

    const point = rectangleIntersection(
      { x: rect.x, y: rect.y },
      { width: rect.width, height: rect.height },
      center,
      target,
    );

    expect(point.x).toBeCloseTo(200);
    expect(point.y).toBeCloseTo(200);
  });

  it("exits the top edge when target is above", () => {
    const center = { x: 200, y: 150 };
    const target = { x: 200, y: 0 };

    const point = rectangleIntersection(
      { x: rect.x, y: rect.y },
      { width: rect.width, height: rect.height },
      center,
      target,
    );

    expect(point.x).toBeCloseTo(200);
    expect(point.y).toBeCloseTo(100);
  });

  it("exits a corner when target is diagonal", () => {
    const center = { x: 200, y: 150 };
    const target = { x: 500, y: 0 };

    const point = rectangleIntersection(
      { x: rect.x, y: rect.y },
      { width: rect.width, height: rect.height },
      center,
      target,
    );

    expect(point.x).toBe(300);
    expect(point.y).toBe(100);
  });

  it("returns center when target is at center (zero direction)", () => {
    const center = { x: 200, y: 150 };

    const point = rectangleIntersection(
      { x: rect.x, y: rect.y },
      { width: rect.width, height: rect.height },
      center,
      center,
    );

    expect(point).toEqual(center);
  });
});

describe("ellipseIntersection", () => {
  const ellipse = { x: 100, y: 100, width: 200, height: 100 };

  it("exits to the right when target is to the right", () => {
    const center = { x: 200, y: 150 };
    const target = { x: 500, y: 150 };

    const point = ellipseIntersection(
      { x: ellipse.x, y: ellipse.y },
      { width: ellipse.width, height: ellipse.height },
      center,
      target,
    );

    expect(point.x).toBeCloseTo(300);
    expect(point.y).toBeCloseTo(150);
  });

  it("exits to the left when target is to the left", () => {
    const center = { x: 200, y: 150 };
    const target = { x: 0, y: 150 };

    const point = ellipseIntersection(
      { x: ellipse.x, y: ellipse.y },
      { width: ellipse.width, height: ellipse.height },
      center,
      target,
    );

    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(150);
  });

  it("exits upward when target is above", () => {
    const center = { x: 200, y: 150 };
    const target = { x: 200, y: 0 };

    const point = ellipseIntersection(
      { x: ellipse.x, y: ellipse.y },
      { width: ellipse.width, height: ellipse.height },
      center,
      target,
    );

    expect(point.x).toBeCloseTo(200);
    expect(point.y).toBeCloseTo(100);
  });

  it("exits downward when target is below", () => {
    const center = { x: 200, y: 150 };
    const target = { x: 200, y: 500 };

    const point = ellipseIntersection(
      { x: ellipse.x, y: ellipse.y },
      { width: ellipse.width, height: ellipse.height },
      center,
      target,
    );

    expect(point.x).toBeCloseTo(200);
    expect(point.y).toBeCloseTo(200);
  });

  it("returns center when target is at center", () => {
    const center = { x: 200, y: 150 };

    const point = ellipseIntersection(
      { x: ellipse.x, y: ellipse.y },
      { width: ellipse.width, height: ellipse.height },
      center,
      center,
    );

    expect(point).toEqual(center);
  });

  it("works with a circle (equal width and height)", () => {
    const circle = { x: 0, y: 0, width: 100, height: 100 };
    const center = { x: 50, y: 50 };
    const target = { x: 200, y: 50 };

    const point = ellipseIntersection(
      { x: circle.x, y: circle.y },
      { width: circle.width, height: circle.height },
      center,
      target,
    );

    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(50);
  });
});
