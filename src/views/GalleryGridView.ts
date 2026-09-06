import { ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import type LumaFramePlugin from "../main";
import type { MediaItem } from "../models/MediaItem";

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
    this.action(actions, "⊘", "Hide from LumaFrame", async () => {
      this.plugin.settings.hiddenMedia[item.id] = true;
      await this.plugin.saveSettings();
      await this.plugin.refreshMedia();
      this.render();
    });
  }

  private action(parent: HTMLElement, label: string, title: string, onClick: () => void): void {
    const button = parent.createEl("button", { text: label, attr: { "aria-label": title, title, type: "button" } });
    this.registerDomEvent(button, "click", onClick);
  }
}
