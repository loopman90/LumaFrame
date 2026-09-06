import type { PlaybackMode } from "../playback/PlaybackModeRegistry";

export interface QuickControlHandlers {
  onModeChange(modeId: string): void;
  onPrevious(): void;
  onTogglePlay(): void;
  onNext(): void;
  onFavorite(): void;
  onGallery(): void;
  onFullscreen(): void;
  onSettings(): void;
}

export class QuickControls {
  readonly element: HTMLElement;
  private readonly modeSelect: HTMLSelectElement;
  private readonly playButton: HTMLButtonElement;
  private readonly favoriteButton: HTMLButtonElement;

  constructor(modes: PlaybackMode[], private readonly handlers: QuickControlHandlers) {
    this.element = createDiv({ cls: "lumaframe-quick-ui", attr: { "aria-label": "Quick controls" } });
    const trafficLights = this.element.createDiv({ cls: "lumaframe-quick-lights", attr: { "aria-hidden": "true" } });
    trafficLights.createSpan({ cls: "lumaframe-quick-light lumaframe-quick-light-red" });
    trafficLights.createSpan({ cls: "lumaframe-quick-light lumaframe-quick-light-yellow" });
    trafficLights.createSpan({ cls: "lumaframe-quick-light lumaframe-quick-light-green" });

    const modeGroup = this.element.createDiv({ cls: "lumaframe-quick-mode" });
    modeGroup.createSpan({ text: "Mode" });
    this.modeSelect = modeGroup.createEl("select", { attr: { "aria-label": "Playback mode" } });
    for (const mode of modes) {
      this.modeSelect.createEl("option", { text: mode.name, value: mode.id });
    }
    this.modeSelect.addEventListener("change", () => handlers.onModeChange(this.modeSelect.value));

    const buttons = this.element.createDiv({ cls: "lumaframe-quick-buttons" });
    this.createButton(buttons, "Previous", "←", () => handlers.onPrevious());
    this.playButton = this.createButton(buttons, "Pause", "⏸", () => handlers.onTogglePlay());
    this.createButton(buttons, "Next", "→", () => handlers.onNext());
    this.favoriteButton = this.createButton(buttons, "Favorite", "☆", () => handlers.onFavorite());
    this.createButton(buttons, "Gallery", "▦", () => handlers.onGallery());
    this.createButton(buttons, "Fullscreen", "⛶", () => handlers.onFullscreen());
    this.createButton(buttons, "Settings", "⚙", () => handlers.onSettings());
  }

  setMode(modeId: string): void {
    this.modeSelect.value = modeId;
  }

  setPaused(paused: boolean): void {
    this.playButton.setText(paused ? "▶" : "⏸");
    this.playButton.setAttr("aria-label", paused ? "Play" : "Pause");
  }

  setFavorite(favorite: boolean): void {
    this.favoriteButton.setText(favorite ? "★" : "☆");
    this.favoriteButton.setAttr("aria-label", favorite ? "Unfavorite" : "Favorite");
  }

  private createButton(parent: HTMLElement, label: string, text: string, onClick: () => void): HTMLButtonElement {
    const button = parent.createEl("button", {
      text,
      cls: "lumaframe-quick-button",
      attr: {
        "aria-label": label,
        title: label,
        type: "button"
      }
    });
    button.addEventListener("click", onClick);
    return button;
  }
}
