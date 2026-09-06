import { App, TFile } from "obsidian";
import type { MediaItem } from "../models/MediaItem";
import type { MediaSource } from "../models/MediaSource";
import type { LumaFrameSettings } from "../models/PluginSettings";
import { mediaKindForPath, normalizeExtension } from "../utils/mediaTypes";
import { ExternalFolderService } from "./ExternalFolderService";

export class MediaScanner {
  constructor(
    private readonly app: App,
    private readonly externalFolders: ExternalFolderService
  ) {}

  async scan(settings: LumaFrameSettings): Promise<MediaItem[]> {
    const items: MediaItem[] = [];
    for (const source of settings.sources.filter((candidate) => candidate.enabled)) {
      const scanned = source.type === "vault" ? this.scanVaultSource(source) : await this.scanExternalSource(source);
      items.push(...scanned);
    }
    return items;
  }

  private scanVaultSource(source: MediaSource): MediaItem[] {
    const normalizedSourcePath = trimSlashes(source.path);
    return this.app.vault
      .getFiles()
      .filter((file) => belongsToSource(file, normalizedSourcePath, source.includeSubfolders))
      .map((file) => fileToMediaItem(file, source))
      .filter((item): item is MediaItem => item !== null);
  }

  private async scanExternalSource(source: MediaSource): Promise<MediaItem[]> {
    const files = await this.externalFolders.listFiles(source);
    return files
      .map((file) => {
        const kind = mediaKindForPath(file.path);
        if (!kind) return null;
        const extension = normalizeExtension(file.path);
        const item: MediaItem = {
          id: `${source.id}:${file.path}`,
          path: file.path,
          name: file.name,
          sourceId: source.id,
          type: kind,
          extension
        };
        if (file.modifiedTime !== undefined) item.modifiedTime = file.modifiedTime;
        if (file.createdTime !== undefined) item.createdTime = file.createdTime;
        return item;
      })
      .filter((item): item is MediaItem => item !== null);
  }
}

function belongsToSource(file: TFile, sourcePath: string, includeSubfolders: boolean): boolean {
  if (sourcePath === "") return false;
  const normalizedFilePath = trimSlashes(file.path);
  if (includeSubfolders) {
    return normalizedFilePath === sourcePath || normalizedFilePath.startsWith(`${sourcePath}/`);
  }
  const parent = normalizedFilePath.split("/").slice(0, -1).join("/");
  return parent === sourcePath;
}

function fileToMediaItem(file: TFile, source: MediaSource): MediaItem | null {
  const kind = mediaKindForPath(file.path);
  if (!kind) return null;
  const item: MediaItem = {
    id: `${source.id}:${file.path}`,
    path: file.path,
    name: file.name,
    sourceId: source.id,
    type: kind,
    extension: normalizeExtension(file.path)
  };
  item.modifiedTime = file.stat.mtime;
  item.createdTime = file.stat.ctime;
  return item;
}

function trimSlashes(path: string): string {
  return path.replace(/^\/+|\/+$/g, "");
}
