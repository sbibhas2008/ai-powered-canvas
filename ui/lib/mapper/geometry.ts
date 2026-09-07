import type { Position, Size } from "@/lib/domain/types";

/**
 * Find where a ray from `center` toward `target` exits an axis-aligned rectangle.
 * The rectangle is defined by its top-left corner and size.
 */
export function rectangleIntersection(
  rectPosition: Position,
  rectSize: Size,
  center: Position,
  target: Position,
): Position {
  const cx = center.x;
  const cy = center.y;
  const dx = target.x - cx;
  const dy = target.y - cy;

  const hw = rectSize.width / 2;
  const hh = rectSize.height / 2;
  const rx = rectPosition.x;
  const ry = rectPosition.y;

  const candidates: number[] = [];

  if (dx !== 0) {
    const tLeft = (rx - cx) / dx;
    if (tLeft > 0) {
      const yAtT = cy + tLeft * dy;
      if (yAtT >= ry && yAtT <= ry + rectSize.height) {
        candidates.push(tLeft);
      }
    }
    const tRight = (rx + rectSize.width - cx) / dx;
    if (tRight > 0) {
      const yAtT = cy + tRight * dy;
      if (yAtT >= ry && yAtT <= ry + rectSize.height) {
        candidates.push(tRight);
      }
    }
  }

  if (dy !== 0) {
    const tTop = (ry - cy) / dy;
    if (tTop > 0) {
      const xAtT = cx + tTop * dx;
      if (xAtT >= rx && xAtT <= rx + rectSize.width) {
        candidates.push(tTop);
      }
    }
    const tBottom = (ry + rectSize.height - cy) / dy;
    if (tBottom > 0) {
      const xAtT = cx + tBottom * dx;
      if (xAtT >= rx && xAtT <= rx + rectSize.width) {
        candidates.push(tBottom);
      }
    }
  }

  if (candidates.length === 0) {
    return center;
  }

  const t = Math.min(...candidates);
  return {
    x: cx + t * dx,
    y: cy + t * dy,
  };
}

/**
 * Find where a ray from `center` toward `target` exits an axis-aligned ellipse.
 * The ellipse is defined by its bounding box (top-left corner and size).
 */
export function ellipseIntersection(
  ellipsePosition: Position,
  ellipseSize: Size,
  center: Position,
  target: Position,
): Position {
  const cx = center.x;
  const cy = center.y;
  const dx = target.x - cx;
  const dy = target.y - cy;

  const ecx = ellipsePosition.x + ellipseSize.width / 2;
  const ecy = ellipsePosition.y + ellipseSize.height / 2;
  const a = ellipseSize.width / 2;
  const b = ellipseSize.height / 2;

  const ex = cx - ecx;
  const ey = cy - ecy;

  const A = (dx * dx) / (a * a) + (dy * dy) / (b * b);
  const B = (2 * ex * dx) / (a * a) + (2 * ey * dy) / (b * b);
  const C = (ex * ex) / (a * a) + (ey * ey) / (b * b) - 1;

  const discriminant = B * B - 4 * A * C;
  if (discriminant < 0 || A === 0) {
    return center;
  }

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-B + sqrtD) / (2 * A);
  const t2 = (-B - sqrtD) / (2 * A);

  const positiveTs = [t1, t2].filter((t) => t > 1e-9);
  if (positiveTs.length === 0) {
    return center;
  }

  const t = Math.min(...positiveTs);
  return {
    x: cx + t * dx,
    y: cy + t * dy,
  };
}

/**
 * Get the center point of a node.
 */
export function nodeCenter(position: Position, size: Size): Position {
  return {
    x: position.x + size.width / 2,
    y: position.y + size.height / 2,
  };
}
