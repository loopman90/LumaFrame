import type LumaFramePlugin from "../main";
import { DEFAULT_SETTINGS } from "../models/defaults";
import type { LumaFrameSettings } from "../models/PluginSettings";

export class SettingsStore {
  constructor(private readonly plugin: LumaFramePlugin) {}

  async load(): Promise<LumaFrameSettings> {
    const saved = (await this.plugin.loadData()) as Partial<LumaFrameSettings> | null;
    return migrateSettings(saved);
  }

  async save(settings: LumaFrameSettings): Promise<void> {
    await this.plugin.saveData(settings);
  }
}

export function migrateSettings(saved: Partial<LumaFrameSettings> | null): LumaFrameSettings {
  const merged: LumaFrameSettings = {
    ...DEFAULT_SETTINGS,
    ...saved,
    sources: saved?.sources ?? DEFAULT_SETTINGS.sources,
    playlists: saved?.playlists ?? DEFAULT_SETTINGS.playlists,
    presets: saved?.presets?.length ? saved.presets : DEFAULT_SETTINGS.presets,
    profiles: saved?.profiles?.length ? saved.profiles : DEFAULT_SETTINGS.profiles,
    favorites: saved?.favorites ?? DEFAULT_SETTINGS.favorites,
    hiddenMedia: saved?.hiddenMedia ?? DEFAULT_SETTINGS.hiddenMedia,
    mediaStats: saved?.mediaStats ?? DEFAULT_SETTINGS.mediaStats,
    shuffleStates: saved?.shuffleStates ?? DEFAULT_SETTINGS.shuffleStates
  };

  if (merged.schemaVersion < 1) {
    merged.schemaVersion = 1;
  }

  return merged;
}
