import { Modal, Setting } from "obsidian";
import type LumaFramePlugin from "../main";
import { openPluginSettings } from "../utils/obsidianSettings";

export class OnboardingWizard extends Modal {
  private step = 0;

  constructor(private readonly plugin: LumaFramePlugin) {
    super(plugin.app);
  }

  onOpen(): void {
    this.render();
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.addClass("lumaframe-onboarding");
    if (this.step === 0) this.renderWelcome();
    if (this.step === 1) this.renderAddMedia();
    if (this.step === 2) this.renderLook();
    if (this.step === 3) this.renderPlayback();
    if (this.step === 4) this.renderReady();
  }

  private renderWelcome(): void {
    this.contentEl.createEl("h1", { text: "Welcome to LumaFrame" });
    this.contentEl.createEl("p", { text: "Turn your photos, GIFs and videos into a living gallery." });
    new Setting(this.contentEl).addButton((button) => button.setButtonText("Get Started").setCta().onClick(() => this.next()));
  }

  private renderAddMedia(): void {
    this.contentEl.createEl("h2", { text: "Add Media" });
    this.contentEl.createEl("p", { text: "Choose where LumaFrame should find your media." });
    new Setting(this.contentEl).addButton((button) =>
      button.setButtonText("Open Settings").setCta().onClick(() => {
        this.close();
        openPluginSettings(this.app, this.plugin.manifest.id);
      })
    );
    this.nextButton();
  }

  private renderLook(): void {
    this.contentEl.createEl("h2", { text: "Choose a Look" });
    this.contentEl.createDiv({ cls: "lumaframe-preset-choices", text: "Classic · Ambient · Cinematic · Gallery · Minimal" });
    this.nextButton();
  }

  private renderPlayback(): void {
    this.contentEl.createEl("h2", { text: "Playback" });
    this.contentEl.createEl("p", { text: "Shuffle is the default. Smart Shuffle is ready when you want more variety." });
    this.nextButton();
  }

  private renderReady(): void {
    this.contentEl.createEl("h2", { text: "Ready" });
    this.contentEl.createEl("p", { text: `${this.plugin.settings.sources.length} Sources` });
    new Setting(this.contentEl)
      .addButton((button) => button.setButtonText("Start LumaFrame").setCta().onClick(() => void this.finish(true)))
      .addButton((button) => button.setButtonText("Advanced Settings").onClick(() => void this.finish(false)));
  }

  private nextButton(): void {
    new Setting(this.contentEl).addButton((button) => button.setButtonText("Next").setCta().onClick(() => this.next()));
  }

  private next(): void {
    this.step += 1;
    this.render();
  }

  private async finish(start: boolean): Promise<void> {
    this.plugin.settings.onboardingComplete = true;
    await this.plugin.saveSettings();
    this.close();
    if (start) await this.plugin.openPlayer();
    else {
      openPluginSettings(this.app, this.plugin.manifest.id);
    }
  }
}
