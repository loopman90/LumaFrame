import { Notice } from "obsidian";
import type { MediaSource } from "../models/MediaSource";

export class ExternalFolderService {
  isAvailable(): boolean {
    return false;
  }

  async chooseFolder(): Promise<string | null> {
    new Notice("External folders are not available in the community build. Add a vault folder instead.");
    return null;
  }

  async listFiles(source: MediaSource): Promise<ExternalFileEntry[]> {
    source.unavailable = true;
    new Notice("External folders are saved but not scanned in the community build.");
    return [];
  }
}

export interface ExternalFileEntry {
  path: string;
  name: string;
  modifiedTime?: number;
  createdTime?: number;
}
