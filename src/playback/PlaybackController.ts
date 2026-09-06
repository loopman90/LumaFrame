import type { GalleryPreset } from "../models/GalleryPreset";
import type { GalleryProfile } from "../models/GalleryProfile";
import type { GallerySession } from "../models/GallerySession";
import type { MediaItem } from "../models/MediaItem";
import type { LumaFrameSettings } from "../models/PluginSettings";
import type { PlaybackModeRegistry } from "./PlaybackModeRegistry";

export interface PlaybackEvents {
  onMediaChanged(item: MediaItem | undefined): void;
  onPausedChanged(paused: boolean): void;
  onStatsChanged(settings: LumaFrameSettings): Promise<void>;
  onQueueChanged(settings: LumaFrameSettings): Promise<void>;
}

export class PlaybackController {
  private timer: number | null = null;
  private activeVideo: HTMLVideoElement | null = null;
  private media: MediaItem[] = [];

  constructor(
    private readonly session: GallerySession,
    private readonly settings: LumaFrameSettings,
    private readonly profile: GalleryProfile,
    private readonly preset: GalleryPreset,
    private readonly modes: PlaybackModeRegistry,
    private readonly events: PlaybackEvents
  ) {}

  start(media: MediaItem[], startMediaId?: string): void {
    this.media = media;
    this.session.paused = this.profile.startPaused;
    if (this.profile.rememberShuffle && this.settings.shuffleStates[this.profile.id]?.queue.length) {
      const saved = this.settings.shuffleStates[this.profile.id]!;
      const available = new Set(media.map((item) => item.id));
      this.session.queue = saved.queue.filter((id) => available.has(id));
      this.session.queuePosition = Math.min(saved.queuePosition, Math.max(this.session.queue.length - 1, 0));
    }
    if (this.session.queue.length === 0) this.rebuildQueue();
    const startPosition = startMediaId ? this.session.queue.indexOf(startMediaId) : this.session.queuePosition;
    this.goTo(startPosition >= 0 ? startPosition : this.session.queuePosition);
    this.events.onPausedChanged(this.session.paused);
  }

  attachVideo(video: HTMLVideoElement | null): void {
    this.cleanupVideo();
    this.activeVideo = video;
    if (!video) return;
    const onEnded = () => this.next();
    video.addEventListener("ended", onEnded, { once: true });
    video.addEventListener("error", () => this.next(), { once: true });
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  }

  togglePaused(): void {
    this.session.paused = !this.session.paused;
    if (this.session.paused) {
      this.clearTimer();
      this.activeVideo?.pause();
    } else {
      void this.activeVideo?.play().catch(() => undefined);
      this.schedule();
    }
    this.events.onPausedChanged(this.session.paused);
  }

  next(): void {
    this.goTo(this.session.queuePosition + 1);
  }

  previous(): void {
    this.goTo(this.session.queuePosition - 1);
  }

  current(): MediaItem | undefined {
    const id = this.session.queue[this.session.queuePosition];
    return id ? this.media.find((item) => item.id === id) : undefined;
  }

  hideCurrent(): MediaItem | undefined {
    const item = this.current();
    if (!item) return undefined;
    this.settings.hiddenMedia[item.id] = true;
    this.session.queue = this.session.queue.filter((id) => id !== item.id);
    if (this.session.queuePosition >= this.session.queue.length) this.session.queuePosition = 0;
    this.persistQueue();
    this.goTo(this.session.queuePosition);
    return item;
  }

  position(): number {
    return this.session.queuePosition;
  }

  total(): number {
    return this.session.queue.length;
  }

  stop(): void {
    this.clearTimer();
    this.cleanupVideo();
  }

  private goTo(position: number): void {
    this.clearTimer();
    this.cleanupVideo();
    if (this.session.queue.length === 0) {
      this.events.onMediaChanged(undefined);
      return;
    }
    if (position >= this.session.queue.length) {
      const previousMediaId = this.session.queue[this.session.queue.length - 1];
      this.rebuildQueue(previousMediaId);
      position = 0;
    }
    if (position < 0) position = this.session.queue.length - 1;
    this.session.queuePosition = position;
    this.persistQueue();
    const item = this.current();
    this.markShown(item);
    this.events.onMediaChanged(item);
    this.schedule();
  }

  private rebuildQueue(previousMediaId?: string): void {
    const mode = this.modes.get(this.profile.modeId);
    const queue = mode.createQueue(this.media, {
      settings: this.settings,
      previousMediaId,
      now: new Date()
    });
    this.session.queue = queue.map((item) => item.id);
    this.session.queuePosition = 0;
    this.persistQueue();
  }

  private schedule(): void {
    if (this.session.paused || this.activeVideo) return;
    this.timer = window.setTimeout(() => this.next(), this.profile.imageDuration * 1000);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private cleanupVideo(): void {
    if (!this.activeVideo) return;
    this.activeVideo.pause();
    this.activeVideo.removeAttribute("src");
    this.activeVideo.load();
    this.activeVideo = null;
  }

  private markShown(item: MediaItem | undefined): void {
    if (!item) return;
    const stats = this.settings.mediaStats[item.id] ?? { showCount: 0 };
    this.settings.mediaStats[item.id] = {
      showCount: stats.showCount + 1,
      lastShown: Date.now()
    };
    void this.events.onStatsChanged(this.settings);
  }

  private persistQueue(): void {
    if (!this.profile.rememberShuffle) return;
    this.settings.shuffleStates[this.profile.id] = {
      queue: [...this.session.queue],
      queuePosition: this.session.queuePosition,
      updatedAt: Date.now()
    };
    void this.events.onQueueChanged(this.settings);
  }
}
