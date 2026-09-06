import type { LumaFrameSettings } from "../models/PluginSettings";
import { MediaIndex } from "./MediaIndex";
import { MediaScanner } from "./MediaScanner";

export class MediaLibrary {
  readonly index = new MediaIndex();

  constructor(private readonly scanner: MediaScanner) {}

  async refresh(settings: LumaFrameSettings): Promise<void> {
    const items = await this.scanner.scan(settings);
    this.index.replace(items, settings);
  }
}
