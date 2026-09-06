import { Modal, Setting } from "obsidian";

export class TextPromptModal extends Modal {
  private value: string;

  constructor(
    app: import("obsidian").App,
    private readonly title: string,
    initialValue: string,
    private readonly placeholder: string,
    private readonly confirmText: string,
    private readonly onSubmit: (value: string) => Promise<void> | void
  ) {
    super(app);
    this.value = initialValue;
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: this.title });
    new Setting(this.contentEl).addText((text) =>
      text
        .setPlaceholder(this.placeholder)
        .setValue(this.value)
        .onChange((value) => {
          this.value = value;
        })
    );
    new Setting(this.contentEl)
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()))
      .addButton((button) =>
        button
          .setButtonText(this.confirmText)
          .setCta()
          .onClick(async () => {
            const trimmed = this.value.trim();
            if (!trimmed) return;
            await this.onSubmit(trimmed);
            this.close();
          })
      );
  }
}
