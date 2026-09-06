export interface PlaybackControlHandlers {
  onPrevious(): void;
  onTogglePlay(): void;
  onNext(): void;
  onFavorite(): void;
  onGallery(): void;
  onFullscreen(): void;
  onMore(): void;
}

export class PlaybackControls {
  readonly element: HTMLElement;
  private playButton: HTMLButtonElement;
  private favoriteButton: HTMLButtonElement;

  constructor(private readonly handlers: PlaybackControlHandlers) {
    this.element = createEl("div", { cls: "lumaframe-controls", attr: { "aria-label": "LumaFrame controls" } });
    this.createButton("Previous", "←", () => handlers.onPrevious());
    this.playButton = this.createButton("Pause", "⏸", () => handlers.onTogglePlay());
    this.createButton("Next", "→", () => handlers.onNext());
    this.favoriteButton = this.createButton("Favorite", "☆", () => handlers.onFavorite());
    this.createButton("Gallery", "▦", () => handlers.onGallery());
    this.createButton("Fullscreen", "⛶", () => handlers.onFullscreen());
    this.createButton("More", "⋯", () => handlers.onMore());
  }

  setPaused(paused: boolean): void {
    this.playButton.setText(paused ? "▶" : "⏸");
    this.playButton.setAttr("aria-label", paused ? "Play" : "Pause");
  }

  setFavorite(favorite: boolean): void {
    this.favoriteButton.setText(favorite ? "★" : "☆");
    this.favoriteButton.setAttr("aria-label", favorite ? "Unfavorite" : "Favorite");
  }

  private createButton(label: string, text: string, onClick: () => void): HTMLButtonElement {
    const button = this.element.createEl("button", {
      text,
      cls: "lumaframe-control-button",
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
