import { describe, expect, it } from "vitest";
import { avoidBoundaryRepeat, shuffled } from "../src/utils/shuffle";

describe("shuffle", () => {
  it("keeps all items in a shuffled queue", () => {
    const items = [1, 2, 3, 4];
    expect(shuffled(items, () => 0.5).sort()).toEqual(items);
  });

  it("avoids repeating across a queue boundary when possible", () => {
    const previous = { id: "a" };
    const queue = avoidBoundaryRepeat([{ id: "a" }, { id: "b" }], previous);
    expect(queue[0]?.id).toBe("b");
  });
});
