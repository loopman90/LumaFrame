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
}
