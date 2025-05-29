export function isDeepEqual(arg1: unknown, arg2: unknown) {
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
    const keys1 = Object.keys(arg1);
    const keys2 = Object.keys(arg2);
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
