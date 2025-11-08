function isDeepEqual(arg1: unknown, arg2: unknown) {
  if (Array.isArray(arg1) && Array.isArray(arg2)) {
    if (arg1.length !== arg2.length) {
      return false;
    }

    for (const elem1 of arg1) {
      let matched = false;
      for (const elem2 of arg2) {
        if (isDeepEqual(elem1, elem2)) {
          matched = true;
          break;
        }
      }
      if (!matched) {
        return false;
      }
    }
    return true;
  } else if (
    typeof arg1 === "object" &&
    typeof arg2 === "object" &&
    arg1 !== null &&
    arg2 !== null
  ) {
    // a key is valid if the value is not undefined.
    const keys1 = Object.entries(arg1)
      .filter(([_, v]) => v !== undefined)
      .map(([k, _]) => k);
    const keys2 = Object.entries(arg2)
      .filter(([_, v]) => v !== undefined)
      .map(([k, _]) => k);
    if (keys1.length !== keys2.length) {
      return false;
    }
    for (const key of keys1) {
      if (
        !keys2.includes(key) ||
        !isDeepEqual(
          (arg1 as Record<string, unknown>)[key],
          (arg2 as Record<string, unknown>)[key],
        )
      ) {
        return false;
      }
    }
    return true;
  } else {
    return arg1 === arg2;
  }
}

/**
 * Returns true if every element of `left` appears in `right` (deep equality).
 *
 * Semantics: set-like membership (duplicates on `left` do not require matching
 * multiplicity in `right`).
 */
export function isSubset(left: unknown[], right: unknown[]): boolean {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return false;
  }

  for (const l of left) {
    let found = false;
    for (const r of right) {
      if (isDeepEqual(l, r)) {
        found = true;
        break;
      }
    }
    if (!found) {
      return false;
    }
  }
  return true;
}
