import type { MediaItem } from "../models/MediaItem";
import type { MediaStats } from "../models/PluginSettings";
import { avoidBoundaryRepeat, shuffled } from "../utils/shuffle";
import { PlaybackModeRegistry, type PlaybackMode } from "./PlaybackModeRegistry";

function byName(media: MediaItem[]): MediaItem[] {
  return [...media].sort((a, b) => a.name.localeCompare(b.name));
}

function previousItem(media: MediaItem[], previousMediaId?: string): MediaItem | undefined {
  return previousMediaId ? media.find((item) => item.id === previousMediaId) : undefined;
}

function itemStats(item: MediaItem, stats: Record<string, MediaStats>): MediaStats {
  return stats[item.id] ?? { showCount: item.showCount ?? 0, lastShown: item.lastShown };
}

const sequentialMode: PlaybackMode = {
  id: "sequential",
  name: "Sequential",
  description: "Plays media alphabetically.",
  createQueue: byName
};

const reverseMode: PlaybackMode = {
  id: "reverse",
  name: "Reverse",
  description: "Plays media in reverse order.",
  createQueue: (media) => byName(media).reverse()
};

const shuffleMode: PlaybackMode = {
  id: "shuffle",
  name: "Shuffle",
  description: "Creates a shuffled queue without repeats until it is exhausted.",
  createQueue: (media, context) => avoidBoundaryRepeat(shuffled(media), previousItem(media, context.previousMediaId))
};

const smartShuffleMode: PlaybackMode = {
  id: "smart-shuffle",
  name: "Smart Shuffle",
  description: "Keeps visually similar media from bunching together.",
  createQueue: (media, context) => {
    const pool = shuffled(media);
    const queue: MediaItem[] = [];
    while (pool.length > 0) {
      const last = queue[queue.length - 1];
      const index = pool.findIndex((candidate) => !last || sourceFolder(candidate) !== sourceFolder(last));
      queue.push(pool.splice(index >= 0 ? index : 0, 1)[0] as MediaItem);
    }
    return avoidBoundaryRepeat(queue, previousItem(media, context.previousMediaId));
  }
};

const favoritesMode: PlaybackMode = {
  id: "favorites-only",
  name: "Favorites Only",
  description: "Plays only favorited media.",
  createQueue: (media, context) => shuffled(media.filter((item) => item.favorite || context.settings.favorites[item.id]))
};

const recentlyAddedMode: PlaybackMode = {
  id: "recently-added",
  name: "Recently Added",
  description: "Prefers newer files based on local metadata.",
  createQueue: (media) =>
    [...media]
      .filter((item) => {
        const time = item.createdTime ?? item.modifiedTime;
        return time ? Date.now() - time < 30 * 24 * 60 * 60 * 1000 : false;
      })
      .sort((a, b) => (b.createdTime ?? b.modifiedTime ?? 0) - (a.createdTime ?? a.modifiedTime ?? 0))
};

const onThisDayMode: PlaybackMode = {
  id: "on-this-day",
  name: "On This Day",
  description: "Shows media captured or created on today's calendar date.",
  createQueue: (media, context) => {
    const month = context.now.getMonth();
    const date = context.now.getDate();
    return shuffled(
      media.filter((item) => {
        const time = item.captureTime ?? item.createdTime ?? item.modifiedTime;
        if (!time) return false;
        const itemDate = new Date(time);
        return itemDate.getMonth() === month && itemDate.getDate() === date;
      })
    );
  }
};

const surpriseMeMode: PlaybackMode = {
  id: "surprise-me",
  name: "Surprise Me",
  description: "Prefers under-seen and older media.",
  createQueue: (media, context) =>
    shuffled(media)
      .map((item) => ({ item, stats: itemStats(item, context.settings.mediaStats) }))
      .sort((a, b) => {
        const shown = a.stats.showCount - b.stats.showCount;
        if (shown !== 0) return shown;
        return (a.stats.lastShown ?? 0) - (b.stats.lastShown ?? 0);
      })
      .map(({ item }) => item)
};

export function createPlaybackModeRegistry(): PlaybackModeRegistry {
  const registry = new PlaybackModeRegistry();
  [
    sequentialMode,
    reverseMode,
    shuffleMode,
    smartShuffleMode,
    favoritesMode,
    recentlyAddedMode,
    onThisDayMode,
    surpriseMeMode
  ].forEach((mode) => registry.register(mode));
  return registry;
}

function sourceFolder(item: MediaItem): string {
  const parts = item.path.split(/[\\/]/);
  parts.pop();
  return `${item.sourceId}:${parts.join("/")}`;
}
