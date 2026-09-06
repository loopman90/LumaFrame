import { Menu, Notice, Plugin, TAbstractFile, TFile, TFolder } from "obsidian";
import { DEFAULT_PROFILE, DEFAULT_SETTINGS } from "./models/defaults";
import type { GalleryProfile } from "./models/GalleryProfile";
import type { LumaFrameSettings } from "./models/PluginSettings";
import { createPlaybackModeRegistry } from "./playback/modes";
import type { PlaybackModeRegistry } from "./playback/PlaybackModeRegistry";
import { ExternalFolderService } from "./services/ExternalFolderService";
import { MediaLibrary } from "./services/MediaLibrary";
import { MediaScanner } from "./services/MediaScanner";
import { SettingsStore } from "./services/SettingsStore";
import { SourceService } from "./services/SourceService";
import { PlaylistService } from "./services/PlaylistService";
import { createTransitionRegistry } from "./transitions/TransitionRegistry";
import type { TransitionRegistry } from "./transitions/TransitionRegistry";
import { OnboardingWizard } from "./ui/OnboardingWizard";
import { LumaFrameSettingsTab } from "./settings/LumaFrameSettingsTab";
import { GalleryGridView, LUMAFRAME_GALLERY_VIEW_TYPE } from "./views/GalleryGridView";
import { LumaFrameView, LUMAFRAME_VIEW_TYPE } from "./views/LumaFrameView";
import { isSupportedMediaPath } from "./utils/mediaTypes";

export default class LumaFramePlugin extends Plugin {
  settings: LumaFrameSettings = DEFAULT_SETTINGS;
  mediaLibrary!: MediaLibrary;
  playbackModes: PlaybackModeRegistry = createPlaybackModeRegistry();
  transitions: TransitionRegistry = createTransitionRegistry();
  playlistService = new PlaylistService();
  private settingsStore!: SettingsStore;
  private refreshQueued = false;
  private readonly sourceService = new SourceService();

  async onload(): Promise<void> {
    this.settingsStore = new SettingsStore(this);
    this.settings = await this.settingsStore.load();
    this.mediaLibrary = new MediaLibrary(new MediaScanner(this.app, new ExternalFolderService()));

    this.registerView(LUMAFRAME_VIEW_TYPE, (leaf) => new LumaFrameView(leaf, this));
    this.registerView(LUMAFRAME_GALLERY_VIEW_TYPE, (leaf) => new GalleryGridView(leaf, this));
    this.addSettingTab(new LumaFrameSettingsTab(this));
    this.addRibbonIcon("image", "Open LumaFrame", () => void this.openPlayer());
    this.registerCommands();
    this.registerVaultEvents();
    this.registerContextMenus();
    await this.refreshMedia();

    if (!this.settings.onboardingComplete) {
      new OnboardingWizard(this).open();
    }
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(LUMAFRAME_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(LUMAFRAME_GALLERY_VIEW_TYPE);
  }

  async saveSettings(): Promise<void> {
    await this.settingsStore.save(this.settings);
  }

  async refreshMedia(): Promise<void> {
    await this.mediaLibrary.refresh(this.settings);
  }

  defaultProfile(): GalleryProfile {
    let profile = this.settings.profiles.find((candidate) => candidate.id === this.settings.defaultProfileId);
    if (!profile) {
      profile = this.settings.profiles[0] ?? { ...DEFAULT_PROFILE };
      if (this.settings.profiles.length === 0) this.settings.profiles.push(profile);
      this.settings.defaultProfileId = profile.id;
    }
    return profile;
  }

  async openPlayer(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(LUMAFRAME_VIEW_TYPE)[0];
    const leaf = existing ?? this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: LUMAFRAME_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  async openGallery(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(LUMAFRAME_GALLERY_VIEW_TYPE)[0];
    const leaf = existing ?? this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: LUMAFRAME_GALLERY_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  currentQueuePosition(): number {
    const view = this.app.workspace.getLeavesOfType(LUMAFRAME_VIEW_TYPE)[0]?.view;
    return view instanceof LumaFrameView ? view.currentPosition() : 0;
  }

  currentMediaCount(): number {
    const view = this.app.workspace.getLeavesOfType(LUMAFRAME_VIEW_TYPE)[0]?.view;
    return view instanceof LumaFrameView ? view.currentTotal() : this.mediaLibrary.index.visible().length;
  }

  private registerCommands(): void {
    this.addCommand({ id: "open", name: "LumaFrame: Open", callback: () => void this.openPlayer() });
    this.addCommand({ id: "open-gallery", name: "LumaFrame: Open Gallery", callback: () => void this.openGallery() });
    this.addCommand({ id: "play-pause", name: "LumaFrame: Play/Pause", callback: () => this.activePlayer()?.playPause() });
    this.addCommand({ id: "next", name: "LumaFrame: Next", callback: () => this.activePlayer()?.next() });
    this.addCommand({ id: "previous", name: "LumaFrame: Previous", callback: () => this.activePlayer()?.previous() });
    this.addCommand({ id: "toggle-fullscreen", name: "LumaFrame: Toggle Fullscreen", callback: () => new Notice("Press F in LumaFrame to toggle fullscreen.") });
    this.addCommand({ id: "toggle-mute", name: "LumaFrame: Toggle Mute", callback: () => new Notice("Video sound is controlled in LumaFrame settings.") });
    this.addCommand({ id: "toggle-info", name: "LumaFrame: Toggle Info", callback: () => this.activePlayer()?.toggleInfo() });
    this.addCommand({ id: "favorite-current-media", name: "LumaFrame: Favorite Current Media", callback: () => this.activePlayer()?.toggleCurrentFavorite() });
    this.addCommand({ id: "hide-current-media", name: "LumaFrame: Hide Current Media", callback: () => this.activePlayer()?.hideCurrentMedia() });
    this.addCommand({ id: "shuffle", name: "LumaFrame: Shuffle", callback: () => this.activePlayer()?.shuffle() });
    this.addCommand({ id: "open-profile", name: "LumaFrame: Open Profile", callback: () => void this.openPlayer() });
    this.addCommand({ id: "new-session", name: "LumaFrame: New Session", callback: () => void this.openPlayer() });
  }

  private registerVaultEvents(): void {
    this.registerEvent(this.app.vault.on("create", (file) => this.refreshIfMedia(file)));
    this.registerEvent(this.app.vault.on("rename", (file) => this.refreshIfMedia(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.refreshIfMedia(file)));
  }

  private registerContextMenus(): void {
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TAbstractFile) => {
        if (file instanceof TFolder) {
          menu.addItem((item) =>
            item
              .setTitle("Add as LumaFrame Source")
              .setIcon("image-plus")
              .onClick(async () => {
                if (this.settings.sources.some((source) => source.type === "vault" && source.path === file.path)) {
                  new Notice("This folder is already a LumaFrame Source.");
                  return;
                }
                const source = this.sourceService.createVaultSource(file.path);
                this.settings.sources.push(source);
                this.defaultProfile().sourceIds = [...new Set([...this.defaultProfile().sourceIds, source.id])];
                await this.saveSettings();
                await this.refreshMedia();
                new Notice("Added to LumaFrame.");
              })
          );
          return;
        }

        if (!(file instanceof TFile) || !isSupportedMediaPath(file.path)) return;
        const mediaId = this.findMediaId(file.path);
        menu.addSeparator();
        menu.addItem((item) => item.setTitle("Open in LumaFrame").setIcon("image").onClick(() => void this.openPlayer()));
        menu.addItem((item) =>
          item
            .setTitle(mediaId && this.settings.favorites[mediaId] ? "Unfavorite in LumaFrame" : "Favorite in LumaFrame")
            .setIcon("star")
            .onClick(async () => {
              const id = mediaId ?? this.createLooseMediaId(file.path);
              this.settings.favorites[id] = !this.settings.favorites[id];
              await this.saveSettings();
            })
        );
        menu.addItem((item) =>
          item
            .setTitle("Hide from LumaFrame")
            .setIcon("eye-off")
            .onClick(async () => {
              const id = mediaId ?? this.createLooseMediaId(file.path);
              this.settings.hiddenMedia[id] = true;
              await this.saveSettings();
              await this.refreshMedia();
            })
        );
      })
    );
  }

  private refreshIfMedia(file: TAbstractFile): void {
    if (!(file instanceof TFile) || !isSupportedMediaPath(file.path)) return;
    if (this.refreshQueued) return;
    this.refreshQueued = true;
    window.setTimeout(() => {
      this.refreshQueued = false;
      void this.refreshMedia();
    }, 500);
  }

  private activePlayer(): LumaFrameView | null {
    const view = this.app.workspace.getLeavesOfType(LUMAFRAME_VIEW_TYPE)[0]?.view;
    return view instanceof LumaFrameView ? view : null;
  }

  private findMediaId(path: string): string | undefined {
    return this.mediaLibrary.index.all().find((item) => item.path === path)?.id;
  }

  private createLooseMediaId(path: string): string {
    const source = this.settings.sources.find((candidate) => path === candidate.path || path.startsWith(`${candidate.path}/`));
    return `${source?.id ?? "vault"}:${path}`;
  }
}
