export function deepEqual(a: object | null, b: object | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;

  const objA = a as Record<string, object | null>;
  const objB = b as Record<string, object | null>;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const valA = objA[key];
    const valB = objB[key];

    if (typeof valA === "object" && typeof valB === "object") {
      if (!deepEqual(valA, valB)) return false;
    } else if (valA !== valB) {
      return false;
    }
  }
  return true;
}
