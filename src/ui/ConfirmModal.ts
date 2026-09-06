import { Modal, Setting } from "obsidian";

export class ConfirmModal extends Modal {
  constructor(
    app: import("obsidian").App,
    private readonly title: string,
    private readonly body: string,
    private readonly confirmText: string,
    private readonly onConfirm: () => Promise<void> | void
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: this.title });
    this.contentEl.createEl("p", { text: this.body });
    new Setting(this.contentEl)
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()))
      .addButton((button) =>
        button
          .setButtonText(this.confirmText)
          .setWarning()
          .onClick(async () => {
            await this.onConfirm();
            this.close();
          })
      );
  }
}
