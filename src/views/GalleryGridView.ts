import { ItemView, Menu, Notice, TFile, WorkspaceLeaf, normalizePath } from "obsidian";
import type LumaFramePlugin from "../main";
import type { MediaItem } from "../models/MediaItem";
import { ConfirmModal } from "../ui/ConfirmModal";
import { TextPromptModal } from "../ui/TextPromptModal";

export const LUMAFRAME_GALLERY_VIEW_TYPE = "lumaframe-gallery";

export class GalleryGridView extends ItemView {
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: LumaFramePlugin
  ) {
    super(leaf);
  }

  getViewType(): string {
    return LUMAFRAME_GALLERY_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "LumaFrame Gallery";
  }

  getIcon(): string {
    return "image-file";
  }

  async onOpen(): Promise<void> {
    await this.plugin.refreshMedia();
    this.render();
  }

  render(): void {
    this.contentEl.empty();
    const root = this.contentEl.createDiv({ cls: "lumaframe lumaframe-gallery" });
    const header = root.createDiv({ cls: "lumaframe-gallery-header" });
    header.createEl("h2", { text: "LumaFrame Gallery" });
    header.createEl("span", { text: `${this.plugin.mediaLibrary.index.visible().length} media files` });
    const grid = root.createDiv({ cls: "lumaframe-gallery-grid" });
    for (const item of this.plugin.mediaLibrary.index.visible()) {
      this.renderItem(grid, item);
    }
  }

  private renderItem(grid: HTMLElement, item: MediaItem): void {
    const card = grid.createDiv({ cls: "lumaframe-gallery-card" });
    const file = this.app.vault.getAbstractFileByPath(item.path);
    const url = file instanceof TFile ? this.app.vault.getResourcePath(file) : item.path;
    if (item.type === "video") {
      card.createEl("video", { cls: "lumaframe-gallery-thumb", attr: { src: url, muted: "true", preload: "metadata" } });
    } else {
      card.createEl("img", { cls: "lumaframe-gallery-thumb", attr: { src: url, alt: item.name, loading: "lazy" } });
    }
    const footer = card.createDiv({ cls: "lumaframe-gallery-card-footer" });
    footer.createEl("span", { text: item.name });
    const actions = footer.createDiv({ cls: "lumaframe-gallery-actions" });
    this.action(actions, this.plugin.settings.favorites[item.id] ? "★" : "☆", "Favorite", async () => {
      this.plugin.settings.favorites[item.id] = !this.plugin.settings.favorites[item.id];
      await this.plugin.saveSettings();
      this.render();
    });
    this.action(actions, "▶", "Start playback from item", async () => {
      await this.plugin.openPlayer();
      new Notice("Playback opened.");
    });
    this.action(actions, "＋", "Add to Playlist", () => this.openPlaylistMenu(actions, item));
    this.action(actions, "✎", "Create Note", () => this.createMediaNote(item));
    this.action(actions, "✐", "Rename", () => this.renameVaultFile(item));
    this.action(actions, "↗", "Open in Obsidian", () => this.openInObsidian(item));
    this.action(actions, "⊘", "Hide from LumaFrame", async () => {
      this.plugin.settings.hiddenMedia[item.id] = true;
      await this.plugin.saveSettings();
      await this.plugin.refreshMedia();
      this.render();
    });
    this.action(actions, "⌫", "Delete original file", () => this.deleteVaultFile(item));
  }

  private action(parent: HTMLElement, label: string, title: string, onClick: () => void): void {
    const button = parent.createEl("button", { text: label, attr: { "aria-label": title, title, type: "button" } });
    this.registerDomEvent(button, "click", onClick);
  }

  private openPlaylistMenu(anchor: HTMLElement, item: MediaItem): void {
    const menu = new Menu();
    if (this.plugin.settings.playlists.length === 0) {
      menu.addItem((menuItem) => menuItem.setTitle("Create Playlist").setIcon("list-plus").onClick(() => this.createPlaylistWithItem(item)));
    }
    for (const playlist of this.plugin.settings.playlists) {
      menu.addItem((menuItem) =>
        menuItem
          .setTitle(playlist.name)
          .setIcon("list-plus")
          .onClick(async () => {
            this.plugin.playlistService.addMedia(playlist, item.id);
            await this.plugin.saveSettings();
            new Notice("Added to playlist.");
          })
      );
    }
    const rect = anchor.getBoundingClientRect();
    menu.showAtPosition({ x: rect.left, y: rect.bottom });
  }

  private createPlaylistWithItem(item: MediaItem): void {
    new TextPromptModal(this.app, "New Playlist", "Favorites", "Playlist name", "Create", async (name) => {
      const playlist = this.plugin.playlistService.create(name);
      this.plugin.playlistService.addMedia(playlist, item.id);
      this.plugin.settings.playlists.push(playlist);
      await this.plugin.saveSettings();
      new Notice("Playlist created.");
    }).open();
  }

  private async createMediaNote(item: MediaItem): Promise<void> {
    const baseName = item.name.replace(/\.[^.]+$/, "");
    const folder = normalizePath(this.plugin.settings.mediaNoteFolder);
    if (!this.app.vault.getAbstractFileByPath(folder)) await this.app.vault.createFolder(folder);
    const notePath = normalizePath(`${folder}/${baseName}.md`);
    if (this.app.vault.getAbstractFileByPath(notePath)) {
      await this.app.workspace.openLinkText(notePath, "", false);
      return;
    }
    const embed = item.path.startsWith("/") ? item.path : `![[${item.path}]]`;
    await this.app.vault.create(notePath, `# ${baseName}\n\n${embed}\n\n## Notes\n\n`);
    await this.app.workspace.openLinkText(notePath, "", false);
  }

  private openInObsidian(item: MediaItem): void {
    if (item.path.startsWith("/")) {
      new Notice("This media is outside your vault.");
      return;
    }
    void this.app.workspace.openLinkText(item.path, "", false);
  }

  private deleteVaultFile(item: MediaItem): void {
    if (item.path.startsWith("/")) {
      new Notice("External file deletion is not available yet.");
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(item.path);
    if (!(file instanceof TFile)) return;
    new ConfirmModal(this.app, "Delete photo permanently?", "This removes the original file from disk.", "Delete", async () => {
      await this.app.vault.trash(file, true);
      await this.plugin.refreshMedia();
      this.render();
    }).open();
  }

  private renameVaultFile(item: MediaItem): void {
    if (item.path.startsWith("/")) {
      new Notice("External file rename is not available yet.");
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(item.path);
    if (!(file instanceof TFile)) return;
    new TextPromptModal(this.app, "Rename Media", file.name, "New filename", "Rename", async (name) => {
      const folder = file.parent?.path && file.parent.path !== "/" ? `${file.parent.path}/` : "";
      await this.app.fileManager.renameFile(file, normalizePath(`${folder}${name}`));
      await this.plugin.refreshMedia();
      this.render();
    }).open();
  }
}
