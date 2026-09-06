import { Notice, PluginSettingTab, Setting } from "obsidian";
import type LumaFramePlugin from "../main";
import { SourceService } from "../services/SourceService";
import { supportsExternalFolders } from "../utils/platform";

export class LumaFrameSettingsTab extends PluginSettingTab {
  private readonly sourceService = new SourceService();

  constructor(private readonly plugin: LumaFramePlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("lumaframe-settings");
    containerEl.createEl("h1", { text: "LumaFrame" });
    containerEl.createEl("p", {
      text: "Turn your media into a living gallery."
    });

    this.renderGeneral(containerEl);
    this.renderSources(containerEl);
    this.renderPlayback(containerEl);
    this.renderAppearance(containerEl);
    this.renderVideo(containerEl);
    this.renderProfiles(containerEl);
    this.renderAdvanced(containerEl);
  }

  private renderGeneral(container: HTMLElement): void {
    container.createEl("h2", { text: "General" });
    new Setting(container)
      .setName("Simple Settings")
      .setDesc("Shows the most common choices first.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.simpleSettings).onChange(async (value) => {
          this.plugin.settings.simpleSettings = value;
          await this.plugin.saveSettings();
          this.display();
        })
      );

    new Setting(container)
      .setName("Open LumaFrame")
      .setDesc("Start the default Profile.")
      .addButton((button) =>
        button
          .setButtonText("Start LumaFrame")
          .setCta()
          .onClick(() => void this.plugin.openPlayer())
      );
  }

  private renderSources(container: HTMLElement): void {
    container.createEl("h2", { text: "Sources" });
    container.createEl("p", { text: "LumaFrame only scans folders you add here." });

    const list = container.createDiv({ cls: "lumaframe-source-list" });
    for (const source of this.plugin.settings.sources) {
      const row = list.createDiv({ cls: "lumaframe-source-row" });
      const meta = row.createDiv();
      meta.createEl("strong", { text: source.name });
      meta.createEl("span", { text: `${source.type === "vault" ? "Vault" : "External"} · ${source.path}` });
      new Setting(row)
        .setName("Enabled")
        .addToggle((toggle) =>
          toggle.setValue(source.enabled).onChange(async (value) => {
            source.enabled = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshMedia();
          })
        )
        .addButton((button) =>
          button.setButtonText("Remove").onClick(async () => {
            this.plugin.settings.sources = this.plugin.settings.sources.filter((candidate) => candidate.id !== source.id);
            await this.plugin.saveSettings();
            await this.plugin.refreshMedia();
            this.display();
          })
        );
    }

    new Setting(container)
      .setName("Add Vault Folder")
      .setDesc("Enter a vault folder path, for example Photos/Family.")
      .addText((text) => {
        text.setPlaceholder("Photos/Family");
        text.inputEl.addClass("lumaframe-source-input");
      })
      .addButton((button) =>
        button.setButtonText("Add").onClick(async () => {
          const input = container.querySelector<HTMLInputElement>(".lumaframe-source-input");
          const path = input?.value.trim();
          if (!path) return;
          if (!this.plugin.app.vault.getAbstractFileByPath(path)) {
            new Notice("This folder is no longer available.");
            return;
          }
          this.plugin.settings.sources.push(this.sourceService.createVaultSource(path));
          await this.plugin.saveSettings();
          await this.plugin.refreshMedia();
          this.display();
        })
      );

    new Setting(container)
      .setName("Add External Folder")
      .setDesc(supportsExternalFolders() ? "Enter a full folder path from your computer." : "Folders outside your vault are available on desktop.")
      .addText((text) => {
        text.setPlaceholder("/Users/name/Pictures/Favorites");
        text.inputEl.addClass("lumaframe-external-source-input");
        text.setDisabled(!supportsExternalFolders());
      })
      .addButton((button) =>
        button
          .setButtonText("Add")
          .setDisabled(!supportsExternalFolders())
          .onClick(async () => {
            const input = container.querySelector<HTMLInputElement>(".lumaframe-external-source-input");
            const path = input?.value.trim();
            if (!path) return;
            this.plugin.settings.sources.push(this.sourceService.createExternalSource(path));
            await this.plugin.saveSettings();
            await this.plugin.refreshMedia();
            this.display();
          })
      );
  }

  private renderPlayback(container: HTMLElement): void {
    container.createEl("h2", { text: "Playback" });
    const profile = this.plugin.defaultProfile();
    new Setting(container)
      .setName("Mode")
      .setDesc("How LumaFrame chooses the next item.")
      .addDropdown((dropdown) => {
        for (const mode of this.plugin.playbackModes.all()) dropdown.addOption(mode.id, mode.name);
        dropdown.setValue(profile.modeId).onChange(async (value) => {
          profile.modeId = value as typeof profile.modeId;
          await this.plugin.saveSettings();
        });
      });

    new Setting(container)
      .setName("Photo Duration")
      .setDesc("Videos always play their full length.")
      .addDropdown((dropdown) => {
        [3, 5, 8, 10, 15, 20, 30, 60].forEach((seconds) => dropdown.addOption(String(seconds), `${seconds} seconds`));
        dropdown.setValue(String(profile.imageDuration)).onChange(async (value) => {
          profile.imageDuration = Number(value);
          await this.plugin.saveSettings();
        });
      });
  }

  private renderAppearance(container: HTMLElement): void {
    container.createEl("h2", { text: "Appearance" });
    const profile = this.plugin.defaultProfile();
    new Setting(container)
      .setName("Preset")
      .setDesc("How LumaFrame looks.")
      .addDropdown((dropdown) => {
        for (const preset of this.plugin.settings.presets) dropdown.addOption(preset.id, preset.name);
        dropdown.setValue(profile.presetId).onChange(async (value) => {
          profile.presetId = value;
          await this.plugin.saveSettings();
        });
      });
  }

  private renderVideo(container: HTMLElement): void {
    container.createEl("h2", { text: "Video" });
    new Setting(container)
      .setName("Sound")
      .setDesc("Sound starts muted by default.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("always-muted", "Always muted")
          .addOption("remember", "Remember previous sound state")
          .addOption("always-enabled", "Always enabled")
          .setValue(this.plugin.settings.videoMutedMode)
          .onChange(async (value) => {
            this.plugin.settings.videoMutedMode = value as typeof this.plugin.settings.videoMutedMode;
            await this.plugin.saveSettings();
          })
      );

    new Setting(container)
      .setName("Volume")
      .setDesc("Used when sound is enabled.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 100, 5)
          .setValue(this.plugin.settings.videoVolume)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.videoVolume = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private renderProfiles(container: HTMLElement): void {
    container.createEl("h2", { text: "Profiles" });
    const profile = this.plugin.defaultProfile();
    new Setting(container).setName(profile.name).setDesc("Sources, Playlist, Mode and Preset are referenced here rather than duplicated.");
  }

  private renderAdvanced(container: HTMLElement): void {
    container.createEl("h2", { text: "Advanced" });
    new Setting(container)
      .setName("Auto-hide Controls")
      .setDesc("Controls fade out while media is playing.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoHideControls).onChange(async (value) => {
          this.plugin.settings.autoHideControls = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(container)
      .setName("Multiple Sessions")
      .setDesc("Allows independent LumaFrame sessions for future multi-display workflows.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.allowMultipleSessions).onChange(async (value) => {
          this.plugin.settings.allowMultipleSessions = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
