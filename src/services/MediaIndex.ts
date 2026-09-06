import type { MediaItem } from "../models/MediaItem";
import type { LumaFrameSettings } from "../models/PluginSettings";

export class MediaIndex {
  private readonly items = new Map<string, MediaItem>();

  replace(items: MediaItem[], settings: LumaFrameSettings): void {
    this.items.clear();
    items.forEach((item) => {
      const favorite = settings.favorites[item.id] ?? item.favorite ?? false;
      const hidden = settings.hiddenMedia[item.id] ?? item.hidden ?? false;
      const stats = settings.mediaStats[item.id];
      this.items.set(item.id, {
        ...item,
        favorite,
        hidden,
        showCount: stats?.showCount ?? item.showCount ?? 0,
        lastShown: stats?.lastShown ?? item.lastShown
      });
    });
  }

  all(): MediaItem[] {
    return [...this.items.values()];
  }

  visible(): MediaItem[] {
    return this.all().filter((item) => !item.hidden);
  }

  get(id: string): MediaItem | undefined {
    return this.items.get(id);
  }

  remove(id: string): void {
    this.items.delete(id);
  }
}
