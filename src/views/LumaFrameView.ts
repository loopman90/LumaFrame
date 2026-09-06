import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import type LumaFramePlugin from "../main";
import type { GalleryPreset } from "../models/GalleryPreset";
import type { GalleryProfile } from "../models/GalleryProfile";
import type { GallerySession } from "../models/GallerySession";
import type { MediaItem } from "../models/MediaItem";
import { PlaybackController } from "../playback/PlaybackController";
import { MediaRenderer } from "../renderers/MediaRenderer";
import { TransitionManager } from "../transitions/TransitionManager";
import { createId } from "../utils/id";
import { MediaOverlay } from "../ui/MediaOverlay";
import { PlaybackControls } from "../ui/PlaybackControls";
import { openPluginSettings } from "../utils/obsidianSettings";

export const LUMAFRAME_VIEW_TYPE = "lumaframe-player";

export class LumaFrameView extends ItemView {
  private mediaLayer!: HTMLElement;
  private emptyState!: HTMLElement;
  private controls!: PlaybackControls;
  private overlay!: MediaOverlay;
  private controller: PlaybackController | null = null;
  private transitionManager!: TransitionManager;
  private currentElement: HTMLElement | null = null;
  private hideControlsTimer: number | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: LumaFramePlugin
  ) {
    super(leaf);
  }

  getViewType(): string {
    return LUMAFRAME_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "LumaFrame";
  }

  getIcon(): string {
    return "image";
  }

  async onOpen(): Promise<void> {
    this.transitionManager = new TransitionManager(this.plugin.transitions);
    this.containerEl.addClass("lumaframe-container");
    const root = this.contentEl.createDiv({ cls: "lumaframe lumaframe-player" });
    this.mediaLayer = root.createDiv({ cls: "lumaframe-media-layer" });
    this.emptyState = root.createDiv({ cls: "lumaframe-empty-state" });
    this.overlay = new MediaOverlay();
    root.appendChild(this.overlay.element);
    this.controls = new PlaybackControls({
      onPrevious: () => this.controller?.previous(),
      onTogglePlay: () => this.controller?.togglePaused(),
      onNext: () => this.controller?.next(),
      onFavorite: () => this.toggleFavorite(),
      onGallery: () => void this.plugin.openGallery(),
      onFullscreen: () => void this.toggleFullscreen(root),
      onMore: () => new Notice("More controls will appear as LumaFrame grows.")
    });
    root.appendChild(this.controls.element);
    this.registerDomEvent(root, "mousemove", () => this.showControlsBriefly());
    this.registerDomEvent(root, "touchstart", () => this.showControlsBriefly());
    this.registerDomEvent(window, "keydown", (event) => this.handleKeydown(event));
    await this.startDefaultProfile();
  }

  async onClose(): Promise<void> {
    this.controller?.stop();
    this.transitionManager?.cancel();
    if (this.hideControlsTimer !== null) window.clearTimeout(this.hideControlsTimer);
  }

  async startDefaultProfile(): Promise<void> {
    await this.plugin.refreshMedia();
    const profile = this.plugin.settings.profiles.find((candidate) => candidate.id === this.plugin.settings.defaultProfileId);
    const preset = this.plugin.settings.presets.find((candidate) => candidate.id === profile?.presetId);
    if (!profile || !preset) {
      this.showEmpty("Add your media", "Choose one or more folders containing photos or videos.");
      return;
    }
    const media = this.mediaForProfile(profile);
    if (media.length === 0) {
      this.showEmpty("Add your media", "Choose one or more folders containing photos or videos.");
      return;
    }
    this.emptyState.hide();
    this.createController(profile, preset, media);
  }

  playPause(): void {
    this.controller?.togglePaused();
  }

  next(): void {
    this.controller?.next();
  }

  previous(): void {
    this.controller?.previous();
  }

  toggleCurrentFavorite(): void {
    this.toggleFavorite();
  }

  hideCurrentMedia(): void {
    const item = this.controller?.hideCurrent();
    if (!item) return;
    void this.plugin.saveSettings();
    new Notice("Hidden from LumaFrame.");
  }

  currentPosition(): number {
    return this.controller?.position() ?? 0;
  }

  currentTotal(): number {
    return this.controller?.total() ?? 0;
  }

  shuffle(): void {
    const profile = this.plugin.defaultProfile();
    profile.modeId = "shuffle";
    delete this.plugin.settings.shuffleStates[profile.id];
    void this.plugin.saveSettings();
    void this.startDefaultProfile();
  }

  toggleInfo(): void {
    const profile = this.plugin.defaultProfile();
    const preset = this.plugin.settings.presets.find((candidate) => candidate.id === profile.presetId);
    if (!preset) return;
    preset.overlays.showInfo = !preset.overlays.showInfo;
    void this.plugin.saveSettings();
    const item = this.controller?.current();
    this.overlay.update(item, this.currentPosition(), this.currentTotal(), preset.overlays.showInfo);
  }

  private createController(profile: GalleryProfile, preset: GalleryPreset, media: MediaItem[]): void {
    const session: GallerySession = {
      instanceId: createId("session"),
      profileId: profile.id,
      queue: [],
      queuePosition: 0,
      paused: false,
      renderToken: 0
    };
    this.controller?.stop();
    this.controller = new PlaybackController(session, this.plugin.settings, profile, preset, this.plugin.playbackModes, {
      onMediaChanged: (item) => void this.renderMedia(item, preset),
      onPausedChanged: (paused) => this.controls.setPaused(paused),
      onStatsChanged: async () => this.plugin.saveSettings(),
      onQueueChanged: async () => this.plugin.saveSettings()
    });
    this.controller.start(media);
    if (this.plugin.settings.autoFullscreen) void this.toggleFullscreen(this.contentEl);
  }

  private async renderMedia(item: MediaItem | undefined, preset: GalleryPreset): Promise<void> {
    if (!item || !this.controller) {
      this.showEmpty("No playable media", "LumaFrame couldn't display the media in this Profile.");
      return;
    }
    this.emptyState.hide();
    const renderer = new MediaRenderer(this.app, this.plugin.settings);
    const rendered = renderer.render(item, preset);
    this.mediaLayer.appendChild(rendered.element);
    await this.transitionManager.transition(this.currentElement, rendered.element, preset);
    this.currentElement = rendered.element;
    this.controller.attachVideo(rendered.video ?? null);
    this.controls.setFavorite(Boolean(this.plugin.settings.favorites[item.id]));
    this.overlay.update(item, this.plugin.currentQueuePosition(), this.plugin.currentMediaCount(), preset.overlays.showInfo);
    if (!rendered.playable) window.setTimeout(() => this.controller?.next(), 1500);
  }

  private mediaForProfile(profile: GalleryProfile): MediaItem[] {
    const sourceIds = new Set(profile.sourceIds.length > 0 ? profile.sourceIds : this.plugin.settings.sources.map((source) => source.id));
    const sourceMedia = this.plugin.mediaLibrary.index.visible().filter((item) => sourceIds.has(item.sourceId));
    if (!profile.playlistId) return sourceMedia;
    const playlist = this.plugin.settings.playlists.find((candidate) => candidate.id === profile.playlistId);
    if (!playlist) return sourceMedia;
    const mediaById = new Map(sourceMedia.map((item) => [item.id, item]));
    return playlist.items.map((item) => mediaById.get(item.mediaId)).filter((item): item is MediaItem => item !== undefined);
  }

  private showEmpty(title: string, body: string): void {
    this.mediaLayer.empty();
    this.currentElement = null;
    this.emptyState.empty();
    this.emptyState.show();
    this.emptyState.createEl("h2", { text: title });
    this.emptyState.createEl("p", { text: body });
    const button = this.emptyState.createEl("button", { text: "Manage Sources", cls: "mod-cta" });
    this.registerDomEvent(button, "click", () => {
      openPluginSettings(this.app, this.plugin.manifest.id);
    });
  }

  private toggleFavorite(): void {
    const item = this.controller?.current();
    if (!item) return;
    const favorite = !this.plugin.settings.favorites[item.id];
    this.plugin.settings.favorites[item.id] = favorite;
    this.controls.setFavorite(favorite);
    void this.plugin.saveSettings();
  }

  private async toggleFullscreen(root: HTMLElement): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await root.requestFullscreen().catch(() => new Notice("Fullscreen is not available here."));
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.contentEl.isShown()) return;
    if (event.key === " ") {
      event.preventDefault();
      this.controller?.togglePaused();
    } else if (event.key === "ArrowRight") {
      this.controller?.next();
    } else if (event.key === "ArrowLeft") {
      this.controller?.previous();
    } else if (event.key.toLowerCase() === "f") {
      void this.toggleFullscreen(this.contentEl);
    } else if (event.key.toLowerCase() === "g") {
      void this.plugin.openGallery();
    } else if (event.key.toLowerCase() === "i") {
      new Notice("Information overlay can be enabled in Presets.");
    } else if (event.key.toLowerCase() === "m") {
      new Notice("Video sound is controlled in LumaFrame settings.");
    } else if (event.key.toLowerCase() === "h") {
      this.controls.element.toggleClass("lumaframe-controls-hidden", !this.controls.element.hasClass("lumaframe-controls-hidden"));
    }
  }

  private showControlsBriefly(): void {
    this.controls.element.removeClass("lumaframe-controls-hidden");
    if (!this.plugin.settings.autoHideControls) return;
    if (this.hideControlsTimer !== null) window.clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = window.setTimeout(() => {
      this.controls.element.addClass("lumaframe-controls-hidden");
    }, 3500);
  }
}
