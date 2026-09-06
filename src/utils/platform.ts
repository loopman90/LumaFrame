import { Platform } from "obsidian";

export function supportsExternalFolders(): boolean {
  return Platform.isDesktop && Platform.isDesktopApp;
}

export function supportsSecondScreenWindow(): boolean {
  return Platform.isDesktopApp;
}
