import { Platform } from "obsidian";

export function supportsSecondScreenWindow(): boolean {
  return Platform.isDesktopApp;
}
