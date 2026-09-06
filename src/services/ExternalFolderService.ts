import { Notice, Platform } from "obsidian";
import type { MediaSource } from "../models/MediaSource";

export class ExternalFolderService {
  isAvailable(): boolean {
    return Platform.isDesktopApp;
  }

  async chooseFolder(): Promise<string | null> {
    new Notice("Folders outside your vault are available on desktop. Add the folder path in settings.");
    return null;
  }

  async listFiles(source: MediaSource): Promise<ExternalFileEntry[]> {
    if (!Platform.isDesktopApp) return [];
    const fs = require("fs/promises") as typeof import("fs/promises");
    const path = require("path") as typeof import("path");
    const root = source.path;
    const entries: ExternalFileEntry[] = [];

    async function walk(folder: string): Promise<void> {
      let dirents: import("fs").Dirent[];
      try {
        dirents = await fs.readdir(folder, { withFileTypes: true });
      } catch {
        source.unavailable = true;
        return;
      }

      for (const dirent of dirents) {
        const absolutePath = path.join(folder, dirent.name);
        if (dirent.isDirectory()) {
          if (source.includeSubfolders) await walk(absolutePath);
          continue;
        }
        if (!dirent.isFile()) continue;
        try {
          const stat = await fs.stat(absolutePath);
          entries.push({
            path: absolutePath,
            name: dirent.name,
            modifiedTime: stat.mtimeMs,
            createdTime: stat.birthtimeMs
          });
        } catch {
          // Missing external files are skipped and the next refresh can recover.
        }
      }
    }

    await walk(root);
    return entries;
  }
}

export interface ExternalFileEntry {
  path: string;
  name: string;
  modifiedTime?: number;
  createdTime?: number;
}
