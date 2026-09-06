import { describe, expect, it } from "vitest";
import { PlaylistService } from "../src/services/PlaylistService";

describe("PlaylistService", () => {
  it("adds media once and preserves order", () => {
    const service = new PlaylistService();
    const playlist = service.create("Favorites");
    service.addMedia(playlist, "a");
    service.addMedia(playlist, "b");
    service.addMedia(playlist, "a");
    expect(playlist.items.map((item) => item.mediaId)).toEqual(["a", "b"]);
  });

  it("moves items up and down", () => {
    const service = new PlaylistService();
    const playlist = service.create("Favorites");
    service.addMedia(playlist, "a");
    service.addMedia(playlist, "b");
    service.moveItem(playlist, playlist.items[1]!.id, -1);
    expect(playlist.items.map((item) => item.mediaId)).toEqual(["b", "a"]);
  });
});
