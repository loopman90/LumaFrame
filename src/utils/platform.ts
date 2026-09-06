import { Platform } from "obsidian";

export function supportsExternalFolders(): boolean {
  return false;
}

export function supportsSecondScreenWindow(): boolean {
  return Platform.isDesktopApp;
}
