import type { GalleryPreset } from "./GalleryPreset";
import type { GalleryProfile } from "./GalleryProfile";
import type { LumaFrameSettings } from "./PluginSettings";

export const DEFAULT_PRESETS: GalleryPreset[] = [
  {
    id: "preset-classic",
    name: "Classic Photo Frame",
    appearance: { fit: "fit", background: "black", customBackgroundColor: "#000000", portraitBackground: "black" },
    transitions: { transitionId: "crossfade", randomCategory: "all", customTransitionIds: [], durationMs: 800 },
    overlays: { showInfo: false, captionSource: "off", clockPosition: "hidden", clock24Hour: true, clockShowSeconds: false, clockShowDate: false },
    motion: { kenBurns: "off", reduceMotion: false }
  },
  {
    id: "preset-ambient",
    name: "Ambient",
    appearance: { fit: "fit", background: "blurred-media", customBackgroundColor: "#000000", portraitBackground: "dark-blurred-media" },
    transitions: { transitionId: "soft-zoom", randomCategory: "ambient", customTransitionIds: [], durationMs: 1200 },
    overlays: { showInfo: false, captionSource: "off", clockPosition: "hidden", clock24Hour: true, clockShowSeconds: false, clockShowDate: false },
    motion: { kenBurns: "subtle", reduceMotion: false }
  },
  {
    id: "preset-cinematic",
    name: "Cinematic Ambient",
    appearance: { fit: "fit", background: "dark-blurred-media", customBackgroundColor: "#050505", portraitBackground: "dark-blurred-media" },
    transitions: { transitionId: "cinematic-reveal", randomCategory: "cinematic", customTransitionIds: [], durationMs: 1600 },
    overlays: { showInfo: false, captionSource: "off", clockPosition: "hidden", clock24Hour: true, clockShowSeconds: false, clockShowDate: false },
    motion: { kenBurns: "subtle", reduceMotion: false }
  },
  {
    id: "preset-clean-gallery",
    name: "Clean Gallery",
    appearance: { fit: "fit", background: "white", customBackgroundColor: "#ffffff", portraitBackground: "white" },
    transitions: { transitionId: "fade", randomCategory: "simple", customTransitionIds: [], durationMs: 600 },
    overlays: { showInfo: false, captionSource: "filename", clockPosition: "hidden", clock24Hour: true, clockShowSeconds: false, clockShowDate: false },
    motion: { kenBurns: "off", reduceMotion: false }
  },
  {
    id: "preset-minimal",
    name: "Minimal",
    appearance: { fit: "fit", background: "black", customBackgroundColor: "#000000", portraitBackground: "black" },
    transitions: { transitionId: "fade", randomCategory: "simple", customTransitionIds: [], durationMs: 700 },
    overlays: { showInfo: false, captionSource: "off", clockPosition: "hidden", clock24Hour: true, clockShowSeconds: false, clockShowDate: false },
    motion: { kenBurns: "off", reduceMotion: true }
  },
  {
    id: "preset-dreamy",
    name: "Dreamy",
    appearance: { fit: "fit", background: "moving-blur", customBackgroundColor: "#000000", portraitBackground: "moving-blur" },
    transitions: { transitionId: "dream-blur", randomCategory: "ambient", customTransitionIds: [], durationMs: 1800 },
    overlays: { showInfo: false, captionSource: "off", clockPosition: "hidden", clock24Hour: true, clockShowSeconds: false, clockShowDate: false },
    motion: { kenBurns: "normal", reduceMotion: false }
  },
  {
    id: "preset-dynamic",
    name: "Dynamic",
    appearance: { fit: "fit", background: "gradient", customBackgroundColor: "#000000", portraitBackground: "blurred-media" },
    transitions: { transitionId: "random", randomCategory: "dynamic", customTransitionIds: [], durationMs: 950 },
    overlays: { showInfo: false, captionSource: "filename", clockPosition: "hidden", clock24Hour: true, clockShowSeconds: false, clockShowDate: false },
    motion: { kenBurns: "subtle", reduceMotion: false }
  }
];

export const DEFAULT_PROFILE: GalleryProfile = {
  id: "profile-default",
  name: "Default",
  sourceIds: [],
  modeId: "shuffle",
  presetId: "preset-classic",
  imageDuration: 10,
  rememberPosition: true,
  rememberShuffle: true,
  startPaused: false
};

export const DEFAULT_SETTINGS: LumaFrameSettings = {
  schemaVersion: 1,
  onboardingComplete: false,
  simpleSettings: true,
  sources: [],
  playlists: [],
  presets: DEFAULT_PRESETS,
  profiles: [DEFAULT_PROFILE],
  defaultProfileId: DEFAULT_PROFILE.id,
  favorites: {},
  hiddenMedia: {},
  mediaStats: {},
  shuffleStates: {},
  mediaNoteFolder: "LumaFrame Notes",
  videoMutedMode: "always-muted",
  videoVolume: 50,
  autoHideControls: true,
  allowMultipleSessions: false,
  rememberActiveProfilePerSession: true,
  autoFullscreen: false,
  keepDisplayAwake: false,
  ignoreSmallMedia: false,
  minimumWidth: 500,
  minimumHeight: 500,
  includePortraitImages: true,
  includeLandscapeImages: true,
  includeVerticalVideo: true,
  includeHorizontalVideo: true
};
