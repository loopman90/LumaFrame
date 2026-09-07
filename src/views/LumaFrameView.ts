import { ItemView, Notice, TFolder, WorkspaceLeaf, normalizePath } from "obsidian";
import type LumaFramePlugin from "../main";
import type { GalleryPreset } from "../models/GalleryPreset";
import type { GalleryProfile } from "../models/GalleryProfile";
import type { GallerySession } from "../models/GallerySession";
import type { MediaItem } from "../models/MediaItem";
import { PlaybackController } from "../playback/PlaybackController";
import type { PlaybackModeId } from "../playback/PlaybackModeRegistry";
import { MediaRenderer } from "../renderers/MediaRenderer";
import { TransitionManager } from "../transitions/TransitionManager";
import { createId } from "../utils/id";
import { MediaOverlay } from "../ui/MediaOverlay";
import { PlaybackControls } from "../ui/PlaybackControls";
import { QuickControls } from "../ui/QuickControls";
import { DEFAULT_MEDIA_FOLDER } from "../utils/defaultMediaFolder";
import { isSupportedMediaPath } from "../utils/mediaTypes";
import { openPluginSettings } from "../utils/obsidianSettings";

export const LUMAFRAME_VIEW_TYPE = "lumaframe-player";

export class LumaFrameView extends ItemView {
  private mediaLayer!: HTMLElement;
  private emptyState!: HTMLElement;
  private controls!: PlaybackControls;
  private quickControls!: QuickControls;
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
    this.quickControls = new QuickControls(this.plugin.playbackModes.all(), {
      onModeChange: (modeId) => void this.changeMode(modeId),
      onPrevious: () => this.controller?.previous(),
      onTogglePlay: () => this.controller?.togglePaused(),
      onNext: () => this.controller?.next(),
      onFavorite: () => this.toggleFavorite(),
      onGallery: () => void this.plugin.openGallery(),
      onFullscreen: () => void this.toggleFullscreen(root),
      onSettings: () => openPluginSettings(this.app, this.plugin.manifest.id),
      onHide: () => this.quickControls.element.addClass("lumaframe-quick-ui-collapsed"),
      onTransitionDurationChange: (durationMs) => void this.changeTransitionDuration(durationMs)
    });
    root.appendChild(this.quickControls.element);
    this.controls = new PlaybackControls({
      onPrevious: () => this.controller?.previous(),
      onTogglePlay: () => this.controller?.togglePaused(),
      onNext: () => this.controller?.next(),
      onFavorite: () => this.toggleFavorite(),
      onGallery: () => void this.plugin.openGallery(),
      onFullscreen: () => void this.toggleFullscreen(root),
      onMore: () => this.quickControls.element.toggleClass("lumaframe-quick-ui-collapsed", !this.quickControls.element.hasClass("lumaframe-quick-ui-collapsed"))
    });
    root.appendChild(this.controls.element);
    this.registerDomEvent(root, "mousemove", () => this.showControlsBriefly());
    this.registerDomEvent(root, "touchstart", () => this.showControlsBriefly());
    this.registerDomEvent(this.emptyState, "dragover", (event) => this.handleEmptyDragOver(event));
    this.registerDomEvent(this.emptyState, "dragleave", () => this.emptyState.removeClass("lumaframe-empty-dragging"));
    this.registerDomEvent(this.emptyState, "drop", (event) => {
      void this.handleEmptyDrop(event);
    });
    this.registerDomEvent(window, "keydown", (event) => this.handleKeydown(event));
    await this.startDefaultProfile();
  }

  async onClose(): Promise<void> {
    this.controller?.stop();
    this.transitionManager?.cancel();
    if (this.hideControlsTimer !== null) window.clearTimeout(this.hideControlsTimer);
  }

  async startDefaultProfile(startMediaId?: string): Promise<void> {
    await this.plugin.refreshMedia();
    const profile = this.plugin.settings.profiles.find((candidate) => candidate.id === this.plugin.settings.defaultProfileId);
    const preset = this.plugin.settings.presets.find((candidate) => candidate.id === profile?.presetId);
    if (!profile || !preset) {
      this.showEmpty("Drop images here", "Add photos, GIFs or videos to your LumaFrame Media vault folder.");
      return;
    }
    const media = this.mediaForProfile(profile);
    if (media.length === 0) {
      this.showEmpty("Drop images here", "Add photos, GIFs or videos to your LumaFrame Media vault folder.");
      return;
    }
    this.emptyState.hide();
    this.createController(profile, preset, media, startMediaId);
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

  private createController(profile: GalleryProfile, preset: GalleryPreset, media: MediaItem[], startMediaId?: string): void {
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
      onPausedChanged: (paused) => {
        this.controls.setPaused(paused);
        this.quickControls.setPaused(paused);
      },
      onStatsChanged: async () => this.plugin.saveSettings(),
      onQueueChanged: async () => this.plugin.saveSettings()
    });
    this.quickControls.setMode(profile.modeId);
    this.quickControls.setTransitionDuration(preset.transitions.durationMs);
    this.controller.start(media, startMediaId);
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
    this.quickControls.setFavorite(Boolean(this.plugin.settings.favorites[item.id]));
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
    const panel = this.emptyState.createDiv({ cls: "lumaframe-empty-panel" });
    panel.createDiv({ cls: "lumaframe-empty-icon", text: "+" });
    panel.createEl("h2", { text: title });
    panel.createEl("p", { text: body });
    panel.createDiv({ cls: "lumaframe-empty-folder", text: DEFAULT_MEDIA_FOLDER });
    const actions = panel.createDiv({ cls: "lumaframe-empty-actions" });
    const refreshButton = actions.createEl("button", { text: "Refresh", cls: "mod-cta" });
    const openButton = actions.createEl("button", { text: "Open folder" });
    const sourcesButton = actions.createEl("button", { text: "Manage Sources" });
    panel.createDiv({ cls: "lumaframe-empty-hint", text: "Dropped files are copied into your vault. LumaFrame never uploads media." });
    this.registerDomEvent(refreshButton, "click", () => {
      void this.startDefaultProfile();
    });
    this.registerDomEvent(openButton, "click", () => {
      this.openDefaultMediaFolder();
    });
    this.registerDomEvent(sourcesButton, "click", () => {
      openPluginSettings(this.app, this.plugin.manifest.id);
    });
  }

  private handleEmptyDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    this.emptyState.addClass("lumaframe-empty-dragging");
  }

  private async handleEmptyDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.emptyState.removeClass("lumaframe-empty-dragging");
    const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => isSupportedMediaPath(file.name));
    if (files.length === 0) {
      new Notice("Drop supported images, GIFs or videos to add them to LumaFrame.");
      return;
    }

    await this.plugin.ensureDefaultMediaFolder();
    let added = 0;
    for (const file of files) {
      const targetPath = this.nextAvailableMediaPath(file.name);
      await this.app.vault.createBinary(targetPath, await file.arrayBuffer());
      added += 1;
    }

    new Notice(`Added ${added} file${added === 1 ? "" : "s"} to ${DEFAULT_MEDIA_FOLDER}.`);
    await this.startDefaultProfile();
  }

  private nextAvailableMediaPath(fileName: string): string {
    const safeName = normalizePath(fileName).split("/").pop() ?? "media";
    const dotIndex = safeName.lastIndexOf(".");
    const name = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName;
    const extension = dotIndex > 0 ? safeName.slice(dotIndex) : "";
    let index = 1;
    let targetPath = normalizePath(`${DEFAULT_MEDIA_FOLDER}/${safeName}`);
    while (this.app.vault.getAbstractFileByPath(targetPath)) {
      index += 1;
      targetPath = normalizePath(`${DEFAULT_MEDIA_FOLDER}/${name} ${index}${extension}`);
    }
    return targetPath;
  }

  private openDefaultMediaFolder(): void {
    const folder = this.app.vault.getAbstractFileByPath(DEFAULT_MEDIA_FOLDER);
    if (!(folder instanceof TFolder)) {
      new Notice(`${DEFAULT_MEDIA_FOLDER} is not available yet. Reload LumaFrame to create it.`);
      return;
    }
    const explorer = this.app.workspace.getLeavesOfType("file-explorer")[0]?.view as { revealInFolder?: (folder: TFolder) => void } | undefined;
    if (explorer?.revealInFolder) {
      explorer.revealInFolder(folder);
      return;
    }
    new Notice(`Open ${DEFAULT_MEDIA_FOLDER} from the Files pane in your vault.`);
  }

  private toggleFavorite(): void {
    const item = this.controller?.current();
    if (!item) return;
    const favorite = !this.plugin.settings.favorites[item.id];
    this.plugin.settings.favorites[item.id] = favorite;
    this.controls.setFavorite(favorite);
    this.quickControls.setFavorite(favorite);
    void this.plugin.saveSettings();
  }

  private async changeMode(modeId: string): Promise<void> {
    const profile = this.plugin.defaultProfile();
    const nextModeId = modeId as PlaybackModeId;
    if (!this.plugin.playbackModes.get(nextModeId) || profile.modeId === nextModeId) return;
    profile.modeId = nextModeId;
    delete this.plugin.settings.shuffleStates[profile.id];
    await this.plugin.saveSettings();
    await this.startDefaultProfile(this.controller?.current()?.id);
  }

  private async changeTransitionDuration(durationMs: number): Promise<void> {
    const profile = this.plugin.defaultProfile();
    const preset = this.plugin.settings.presets.find((candidate) => candidate.id === profile.presetId);
    if (!preset) return;
    preset.transitions.durationMs = Math.max(100, Math.min(3000, Math.round(durationMs / 100) * 100));
    await this.plugin.saveSettings();
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
