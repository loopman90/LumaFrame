import type { GalleryPreset } from "./GalleryPreset";
import type { GalleryProfile } from "./GalleryProfile";
import type { MediaSource } from "./MediaSource";
import type { Playlist } from "./Playlist";

export interface MediaStats {
  showCount: number;
  lastShown?: number;
}

export interface ShuffleState {
  queue: string[];
  queuePosition: number;
  updatedAt: number;
}

export interface LumaFrameSettings {
  schemaVersion: number;
  onboardingComplete: boolean;
  simpleSettings: boolean;
  sources: MediaSource[];
  playlists: Playlist[];
  presets: GalleryPreset[];
  profiles: GalleryProfile[];
  defaultProfileId: string;
  favorites: Record<string, boolean>;
  hiddenMedia: Record<string, boolean>;
  mediaStats: Record<string, MediaStats>;
  shuffleStates: Record<string, ShuffleState>;
  mediaNoteFolder: string;
  videoMutedMode: "always-muted" | "remember" | "always-enabled";
  videoVolume: number;
  autoHideControls: boolean;
  allowMultipleSessions: boolean;
  rememberActiveProfilePerSession: boolean;
  autoFullscreen: boolean;
  keepDisplayAwake: boolean;
  ignoreSmallMedia: boolean;
  minimumWidth: number;
  minimumHeight: number;
  includePortraitImages: boolean;
  includeLandscapeImages: boolean;
  includeVerticalVideo: boolean;
  includeHorizontalVideo: boolean;
}
