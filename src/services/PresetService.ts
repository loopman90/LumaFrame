import type { GalleryPreset } from "../models/GalleryPreset";
import { DEFAULT_PRESETS } from "../models/defaults";
import { createId } from "../utils/id";
import { isPresetModified } from "../utils/presetDirty";

export class PresetService {
  defaults(): GalleryPreset[] {
    return structuredClone(DEFAULT_PRESETS);
  }

  displayName(saved: GalleryPreset | undefined, current: GalleryPreset): string {
    return saved && isPresetModified(saved, current) ? `${current.name} · Modified` : current.name;
  }

  cloneAs(preset: GalleryPreset, name: string): GalleryPreset {
    return {
      ...structuredClone(preset),
      id: createId("preset"),
      name
    };
  }
}
