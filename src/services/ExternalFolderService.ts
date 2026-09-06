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
    source.unavailable = true;
    new Notice("External folders are saved but not scanned in this community build.");
    return [];
  }
}

export interface ExternalFileEntry {
  path: string;
  name: string;
  modifiedTime?: number;
  createdTime?: number;
}
