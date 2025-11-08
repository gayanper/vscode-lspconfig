import * as assert from "assert";
import { isSubset } from "../utils";

suite("Utils.isSubset Test Suite", () => {
  test("primitives: left subset of right", () => {
    const left = [1, 2];
    const right = [2, 3, 1];
    assert.strictEqual(isSubset(left, right), true);
  });

  test("primitives: left has new element", () => {
    const left = [1, 4];
    const right = [1, 2, 3];
    assert.strictEqual(isSubset(left, right), false);
  });

  test("nested objects and arrays: deep equality", () => {
    const left = [{ a: 1, b: [2, 3] }, [1, { x: 5 }]];
    const right = [[1, { x: 5 }], { b: [2, 3], a: 1 }, { extra: true }];
    assert.strictEqual(isSubset(left, right), true);
  });

  test("duplicates on left do not require multiplicity on right", () => {
    const left = [1, 1, 2];
    const right = [1, 2];
    assert.strictEqual(isSubset(left, right), true);
  });

  test("empty left is subset of anything", () => {
    const left: unknown[] = [];
    const right = [1, 2, 3];
    assert.strictEqual(isSubset(left, right), true);
  });

  test("keys with undefined values are ignored", () => {
    const left = [{ k: undefined, j: 10 }];
    const right = [{ j: 10 }];
    assert.strictEqual(isSubset(left, right), true);
  });

  test("non-arrays return false", () => {
    // @ts-expect-error: intent to pass wrong types to assert behavior
    assert.strictEqual(isSubset(null, [1, 2]), false);
    // @ts-expect-error: intent to pass wrong types to assert behavior
    assert.strictEqual(isSubset([1, 2], null), false);
  });
});
