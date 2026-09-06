import { describe, expect, it } from "vitest";
import { DEFAULT_PRESETS } from "../src/models/defaults";
import { isPresetModified } from "../src/utils/presetDirty";

describe("presetDirty", () => {
  it("detects modified preset settings by value", () => {
    const saved = structuredClone(DEFAULT_PRESETS[0]!);
    const changed = structuredClone(DEFAULT_PRESETS[0]!);
    changed.transitions.durationMs = 1200;
    expect(isPresetModified(saved, changed)).toBe(true);
  });
});
