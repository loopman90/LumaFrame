import type { GalleryProfile } from "../models/GalleryProfile";
import { createId } from "../utils/id";

export class ProfileService {
  create(name = "New Profile", sourceIds: string[] = []): GalleryProfile {
    return {
      id: createId("profile"),
      name,
      sourceIds,
      modeId: "shuffle",
      presetId: "preset-classic",
      imageDuration: 10,
      rememberPosition: true,
      rememberShuffle: true,
      startPaused: false
    };
  }
}
