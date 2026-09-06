import type { MediaItem } from "../models/MediaItem";
import type { LumaFrameSettings } from "../models/PluginSettings";

export type PlaybackModeId =
  | "sequential"
  | "reverse"
  | "shuffle"
  | "smart-shuffle"
  | "favorites-only"
  | "recently-added"
  | "on-this-day"
  | "surprise-me";

export interface PlaybackContext {
  settings: LumaFrameSettings;
  previousMediaId?: string;
  now: Date;
}

export interface PlaybackMode {
  id: PlaybackModeId;
  name: string;
  description: string;
  createQueue(media: MediaItem[], context: PlaybackContext): MediaItem[];
}

export class PlaybackModeRegistry {
  private readonly modes = new Map<PlaybackModeId, PlaybackMode>();

  register(mode: PlaybackMode): void {
    this.modes.set(mode.id, mode);
  }

  get(id: PlaybackModeId): PlaybackMode {
    return this.modes.get(id) ?? this.modes.get("shuffle") ?? fallbackMode;
  }

  all(): PlaybackMode[] {
    return [...this.modes.values()];
  }
}

const fallbackMode: PlaybackMode = {
  id: "sequential",
  name: "Sequential",
  description: "Plays media in order.",
  createQueue: (media) => [...media].sort((a, b) => a.name.localeCompare(b.name))
};
