import { describe, expect, it } from "vitest";
import { localFileUrl } from "../src/utils/fileUrl";

describe("localFileUrl", () => {
  it("formats unix-style absolute paths", () => {
    expect(localFileUrl("/Users/name/Pictures/Summer Trip/photo #1.jpg")).toBe(
      "file:///Users/name/Pictures/Summer%20Trip/photo%20%231.jpg"
    );
  });

  it("formats windows-style absolute paths", () => {
    expect(localFileUrl("C:\\Users\\name\\Pictures\\photo 1.jpg")).toBe("file:///C:/Users/name/Pictures/photo%201.jpg");
  });

  it("leaves vault-relative paths unchanged", () => {
    expect(localFileUrl("Photos/photo 1.jpg")).toBe("Photos/photo 1.jpg");
  });
});
