import { describe, expect, it } from "vitest";
import { mediaKindForPath, normalizeExtension } from "../src/utils/mediaTypes";

describe("mediaTypes", () => {
  it("normalizes extensions case-insensitively", () => {
    expect(normalizeExtension("Photos/IMG_001.JPG")).toBe("jpg");
    expect(normalizeExtension("movie.MP4")).toBe("mp4");
  });

  it("detects supported media kinds", () => {
    expect(mediaKindForPath("a.jpeg")).toBe("image");
    expect(mediaKindForPath("a.gif")).toBe("gif");
    expect(mediaKindForPath("a.webm")).toBe("video");
    expect(mediaKindForPath("a.txt")).toBeNull();
  });
});
