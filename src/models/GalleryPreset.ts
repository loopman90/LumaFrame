export type FitMode = "fit" | "fill" | "smart-fit" | "original" | "width" | "height";
export type BackgroundMode =
  | "black"
  | "white"
  | "custom-color"
  | "obsidian-theme"
  | "blurred-media"
  | "dark-blurred-media"
  | "moving-blur"
  | "gradient"
  | "extended-edges";
export type KenBurnsMode = "off" | "subtle" | "normal" | "cinematic";
export type ClockPosition = "hidden" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface AppearanceSettings {
  fit: FitMode;
  background: BackgroundMode;
  customBackgroundColor: string;
  portraitBackground: BackgroundMode;
}

export interface TransitionSettings {
  transitionId: string;
  randomCategory: "all" | "simple" | "ambient" | "cinematic" | "dynamic" | "custom";
  customTransitionIds: string[];
  durationMs: number;
}

export interface OverlaySettings {
  showInfo: boolean;
  captionSource: "off" | "filename" | "note" | "frontmatter" | "manual" | "metadata";
  clockPosition: ClockPosition;
  clock24Hour: boolean;
  clockShowSeconds: boolean;
  clockShowDate: boolean;
}

export interface MotionSettings {
  kenBurns: KenBurnsMode;
  reduceMotion: boolean;
}

export interface GalleryPreset {
  id: string;
  name: string;
  appearance: AppearanceSettings;
  transitions: TransitionSettings;
  overlays: OverlaySettings;
  motion: MotionSettings;
}
