import type { GalleryPreset } from "../models/GalleryPreset";

export function normalizePreset(preset: GalleryPreset): string {
  return JSON.stringify({
    appearance: preset.appearance,
    transitions: preset.transitions,
    overlays: preset.overlays,
    motion: preset.motion
  });
}

export function isPresetModified(saved: GalleryPreset, current: GalleryPreset): boolean {
  return normalizePreset(saved) !== normalizePreset(current);
}
