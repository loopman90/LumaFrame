import { App, TFile } from "obsidian";
import type { GalleryPreset } from "../models/GalleryPreset";
import type { MediaItem } from "../models/MediaItem";
import type { LumaFrameSettings } from "../models/PluginSettings";
import { localFileUrl } from "../utils/fileUrl";
import { canProbablyPlayVideo } from "../utils/mediaTypes";

export interface RenderedMedia {
  element: HTMLElement;
  video?: HTMLVideoElement;
  playable: boolean;
  errorMessage?: string;
}

export class MediaRenderer {
  constructor(
    private readonly app: App,
    private readonly settings: LumaFrameSettings
  ) {}

  render(item: MediaItem, preset: GalleryPreset): RenderedMedia {
    const url = this.urlForItem(item);
    if (item.type === "video") {
      if (!canProbablyPlayVideo(item.extension)) {
        return {
          element: this.renderUnsupported("This video format can't be played on this device."),
          playable: false,
          errorMessage: "Unsupported video"
        };
      }
      return this.renderVideo(url, item, preset);
    }
    return this.renderImage(url, item, preset);
  }

  private renderImage(url: string, item: MediaItem, preset: GalleryPreset): RenderedMedia {
    const image = createEl("img", {
      cls: ["lumaframe-media-item", "lumaframe-image", `lumaframe-fit-${preset.appearance.fit}`],
      attr: {
        src: url,
        alt: item.name,
        draggable: "false"
      }
    });
    return { element: image, playable: true };
  }

  private renderVideo(url: string, item: MediaItem, preset: GalleryPreset): RenderedMedia {
    const video = createEl("video", {
      cls: ["lumaframe-media-item", "lumaframe-video", `lumaframe-fit-${preset.appearance.fit}`],
      attr: {
        src: url,
        playsinline: "true",
        preload: "metadata",
        "aria-label": item.name
      }
    });
    video.autoplay = true;
    video.controls = false;
    video.muted = this.settings.videoMutedMode !== "always-enabled";
    video.volume = Math.max(0, Math.min(1, this.settings.videoVolume / 100));
    return { element: video, video, playable: true };
  }

  private renderUnsupported(message: string): HTMLElement {
    const wrapper = createDiv({ cls: "lumaframe-unsupported" });
    wrapper.createEl("strong", { text: message });
    wrapper.createSpan({ text: "LumaFrame will automatically continue." });
    return wrapper;
  }

  private urlForItem(item: MediaItem): string {
    const file = this.app.vault.getAbstractFileByPath(item.path);
    if (file instanceof TFile) {
      return this.app.vault.getResourcePath(file);
    }
    return localFileUrl(item.path);
  }
}
