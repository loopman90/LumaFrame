import type { MediaItem } from "../models/MediaItem";

export class MediaOverlay {
  readonly element: HTMLElement;

  constructor() {
    this.element = createEl("div", { cls: "lumaframe-overlay" });
  }

  update(item: MediaItem | undefined, position: number, total: number, visible: boolean): void {
    this.element.empty();
    if (!visible || !item) return;
    this.element.createEl("div", { cls: "lumaframe-overlay-title", text: item.name });
    this.element.createEl("div", { cls: "lumaframe-overlay-meta", text: `${position + 1} / ${total}` });
  }
}
