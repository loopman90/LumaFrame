import type { App } from "obsidian";

interface SettingsPane {
  open(): void;
  openTabById(id: string): void;
}

interface AppWithSettings extends App {
  setting?: SettingsPane;
}

export function openPluginSettings(app: App, pluginId: string): void {
  const settings = (app as AppWithSettings).setting;
  if (!settings) return;
  settings.open();
  settings.openTabById(pluginId);
}
