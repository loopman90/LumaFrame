import { Notice, Platform } from "obsidian";
import type { MediaSource } from "../models/MediaSource";
import { mediaKindForPath } from "../utils/mediaTypes";

export class ExternalFolderService {
  isAvailable(): boolean {
    return Platform.isDesktopApp;
  }

  async chooseFolder(): Promise<string | null> {
    if (!this.isAvailable()) {
      new Notice("External folders are available on desktop.");
      return null;
    }

    const dialog = await this.dialog();
    if (!dialog) {
      new Notice("External folder picker is not available in this Obsidian environment.");
      return null;
    }

    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0] ?? null;
  }

  async listFiles(source: MediaSource): Promise<ExternalFileEntry[]> {
    if (!this.isAvailable()) {
      source.unavailable = true;
      return [];
    }

    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const rootPath = path.resolve(source.path);
      const files: ExternalFileEntry[] = [];
      await collectMediaFiles(fs, path, rootPath, source.includeSubfolders, files);
      source.unavailable = false;
      return files;
    } catch {
      source.unavailable = true;
      new Notice(`LumaFrame could not read external folder: ${source.name}`);
      return [];
    }
  }

  private async dialog(): Promise<ExternalFolderDialog | null> {
    const electron = await import("electron");
    const candidate = electron as ElectronLike;
    return candidate.remote?.dialog ?? candidate.dialog ?? null;
  }
}

export interface ExternalFileEntry {
  path: string;
  name: string;
  modifiedTime?: number;
  createdTime?: number;
}

interface ExternalFolderDialog {
  showOpenDialog(options: { properties: string[] }): Promise<{ canceled: boolean; filePaths: string[] }>;
}

interface ElectronLike {
  dialog?: ExternalFolderDialog;
  remote?: {
    dialog?: ExternalFolderDialog;
  };
}

type FsPromises = typeof import("fs/promises");
type PathModule = typeof import("path");

async function collectMediaFiles(
  fs: FsPromises,
  path: PathModule,
  folderPath: string,
  includeSubfolders: boolean,
  files: ExternalFileEntry[]
): Promise<void> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      if (includeSubfolders) await collectMediaFiles(fs, path, entryPath, includeSubfolders, files);
      continue;
    }
    if (!entry.isFile() || !mediaKindForPath(entryPath)) continue;
    const stat = await fs.stat(entryPath);
    files.push({
      path: entryPath,
      name: entry.name,
      modifiedTime: stat.mtimeMs,
      createdTime: stat.ctimeMs
    });
  }
}
