import type { PlaybackModeId } from "../playback/PlaybackModeRegistry";

export interface GalleryProfile {
  id: string;
  name: string;
  sourceIds: string[];
  playlistId?: string;
  modeId: PlaybackModeId;
  presetId: string;
  imageDuration: number;
  rememberPosition: boolean;
  rememberShuffle: boolean;
  startPaused: boolean;
}
