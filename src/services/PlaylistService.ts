import type { Playlist } from "../models/Playlist";
import { createId } from "../utils/id";

export class PlaylistService {
  create(name = "New Playlist"): Playlist {
    return {
      id: createId("playlist"),
      name,
      items: []
    };
  }

  addMedia(playlist: Playlist, mediaId: string): void {
    if (playlist.items.some((item) => item.mediaId === mediaId)) return;
    playlist.items.push({
      id: createId("playlist-item"),
      mediaId,
      addedAt: Date.now()
    });
  }

  removeMedia(playlist: Playlist, mediaId: string): void {
    playlist.items = playlist.items.filter((item) => item.mediaId !== mediaId);
  }

  moveItem(playlist: Playlist, itemId: string, direction: -1 | 1): void {
    const index = playlist.items.findIndex((item) => item.id === itemId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= playlist.items.length) return;
    [playlist.items[index], playlist.items[nextIndex]] = [playlist.items[nextIndex]!, playlist.items[index]!];
  }
}
