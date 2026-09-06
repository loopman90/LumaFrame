import { FileSystemAdapter, Notice, PluginSettingTab, Setting, TFolder, type SettingDefinitionItem } from "obsidian";
import type LumaFramePlugin from "../main";
import type { BackgroundMode, FitMode, GalleryPreset, KenBurnsMode } from "../models/GalleryPreset";
import type { GalleryProfile } from "../models/GalleryProfile";
import type { Playlist } from "../models/Playlist";
import { PlaylistService } from "../services/PlaylistService";
import { PresetService } from "../services/PresetService";
import { ProfileService } from "../services/ProfileService";
import { SourceService } from "../services/SourceService";
import { ConfirmModal } from "../ui/ConfirmModal";
import { TextPromptModal } from "../ui/TextPromptModal";
import { VaultFolderSuggestModal } from "../ui/VaultFolderSuggestModal";

export class LumaFrameSettingsTab extends PluginSettingTab {
  private readonly sourceService = new SourceService();
  private readonly playlistService = new PlaylistService();
  private readonly profileService = new ProfileService();
  private readonly presetService = new PresetService();
  private query = "";

  constructor(private readonly plugin: LumaFramePlugin) {
    super(plugin.app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [];
  }

  display(): void {
    this.renderSettings();
  }

  private renderSettings(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("lumaframe-settings");
    containerEl.createEl("p", { text: "Turn your media into a living gallery." });

    new Setting(containerEl)
      .setName("Search settings")
      .addText((text) =>
        text
          .setPlaceholder("video, source, preset...")
          .setValue(this.query)
          .onChange((value) => {
            this.query = value;
            this.renderSettings();
          })
      );

    this.section(containerEl, "General", () => this.renderGeneral(containerEl));
    this.section(containerEl, "Sources", () => this.renderSources(containerEl));
    this.section(containerEl, "Playback", () => this.renderPlayback(containerEl));
    this.section(containerEl, "Appearance", () => this.renderAppearance(containerEl));
    this.section(containerEl, "Transitions", () => this.renderTransitions(containerEl));
    this.section(containerEl, "Gallery", () => this.renderGallery(containerEl));
    this.section(containerEl, "Video", () => this.renderVideo(containerEl));
    this.section(containerEl, "Playlists", () => this.renderPlaylists(containerEl));
    this.section(containerEl, "Profiles", () => this.renderProfiles(containerEl));
    this.section(containerEl, "Presets", () => this.renderPresets(containerEl));
    this.section(containerEl, "Display", () => this.renderDisplay(containerEl));
    this.section(containerEl, "Advanced", () => this.renderAdvanced(containerEl));
  }

  private section(container: HTMLElement, title: string, render: () => void): void {
    if (this.query && !title.toLowerCase().includes(this.query.toLowerCase())) return;
    new Setting(container).setName(title).setHeading();
    render();
  }

  private renderGeneral(container: HTMLElement): void {
    new Setting(container)
      .setName("Simple Settings")
      .setDesc("Shows the most common choices first.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.simpleSettings).onChange(async (value) => {
          this.plugin.settings.simpleSettings = value;
          await this.plugin.saveSettings();
          this.renderSettings();
        })
      );

    new Setting(container)
      .setName("Open LumaFrame")
      .setDesc("Start the default Profile.")
      .addButton((button) => button.setButtonText("Start LumaFrame").setCta().onClick(() => void this.plugin.openPlayer()));
  }

  private renderSources(container: HTMLElement): void {
    container.createEl("p", { text: "LumaFrame only scans folders you add here." });
    const list = container.createDiv({ cls: "lumaframe-source-list" });
    for (const [index, source] of this.plugin.settings.sources.entries()) {
      const row = list.createDiv({ cls: "lumaframe-source-row" });
      const meta = row.createDiv();
      meta.createEl("strong", { text: source.name });
      meta.createSpan({ text: `${source.type === "vault" ? "Vault" : "External"} · ${source.path}` });
      if (source.type === "external") {
        meta.createSpan({ text: "Unsupported in the community build." });
      }
      new Setting(row)
        .setName("Enabled")
        .addToggle((toggle) =>
          toggle.setValue(source.enabled).onChange(async (value) => {
            source.enabled = value;
            await this.saveRefresh();
          })
        )
        .addToggle((toggle) =>
          toggle.setTooltip("Include subfolders").setValue(source.includeSubfolders).onChange(async (value) => {
            source.includeSubfolders = value;
            await this.saveRefresh();
          })
        )
        .addButton((button) =>
          button.setIcon("arrow-up").setTooltip("Move up").setDisabled(index === 0).onClick(async () => {
            this.move(this.plugin.settings.sources, index, -1);
            await this.saveRefresh();
            this.renderSettings();
          })
        )
        .addButton((button) =>
          button.setIcon("arrow-down").setTooltip("Move down").setDisabled(index === this.plugin.settings.sources.length - 1).onClick(async () => {
            this.move(this.plugin.settings.sources, index, 1);
            await this.saveRefresh();
            this.renderSettings();
          })
        )
        .addButton((button) =>
          button.setButtonText("Rename").onClick(() => {
            new TextPromptModal(this.app, "Rename Source", source.name, "Source name", "Rename", async (name) => {
              source.name = name;
              await this.plugin.saveSettings();
              this.renderSettings();
            }).open();
          })
        )
        .addButton((button) =>
          button.setButtonText("Remove").onClick(() => {
            new ConfirmModal(this.app, "Remove Source?", "LumaFrame will stop scanning this folder. Your original media stays unchanged.", "Remove", async () => {
              this.plugin.settings.sources = this.plugin.settings.sources.filter((candidate) => candidate.id !== source.id);
              for (const profile of this.plugin.settings.profiles) profile.sourceIds = profile.sourceIds.filter((id) => id !== source.id);
              await this.saveRefresh();
              this.renderSettings();
            }).open();
          })
        );
    }

    new Setting(container)
      .setName("Add Vault Folder")
      .setDesc("Choose a folder from this vault. You can also enter a vault path manually.")
      .addText((text) => {
        text.setPlaceholder("Photos/Family");
        text.inputEl.addClass("lumaframe-source-input");
      })
      .addButton((button) =>
        button.setButtonText("Choose").setCta().onClick(() => {
          new VaultFolderSuggestModal(this.app, (folder) => {
            void this.addVaultSource(folder.path);
          }).open();
        })
      )
      .addButton((button) =>
        button.setButtonText("Add").onClick(async () => {
          const input = container.querySelector<HTMLInputElement>(".lumaframe-source-input");
          const path = input?.value.trim();
          if (path) await this.addVaultSource(path);
        })
      );

  }

  private renderPlayback(container: HTMLElement): void {
    const profile = this.plugin.defaultProfile();
    new Setting(container)
      .setName("Mode")
      .setDesc("How LumaFrame chooses the next item.")
      .addDropdown((dropdown) => {
        for (const mode of this.plugin.playbackModes.all()) dropdown.addOption(mode.id, mode.name);
        dropdown.setValue(profile.modeId).onChange((value) => {
          void this.updateProfileMode(profile, value);
        });
      });

    new Setting(container)
      .setName("Photo Duration")
      .setDesc("Videos always play their full length.")
      .addDropdown((dropdown) => {
        [3, 5, 8, 10, 15, 20, 30, 60].forEach((seconds) => {
          dropdown.addOption(String(seconds), `${seconds} seconds`);
        });
        dropdown.setValue(String(profile.imageDuration)).onChange((value) => {
          void this.updatePhotoDuration(profile, value);
        });
      });

    new Setting(container)
      .setName("Remember shuffle progress")
      .setDesc("Restarting Obsidian keeps the queue position for this Profile.")
      .addToggle((toggle) =>
        toggle.setValue(profile.rememberShuffle).onChange(async (value) => {
          profile.rememberShuffle = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private renderAppearance(container: HTMLElement): void {
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

  private renderTransitions(container: HTMLElement): void {
    const preset = this.defaultPreset();
    new Setting(container)
      .setName("Transition")
      .setDesc("Reduced motion limits transitions to calm fades.")
      .addDropdown((dropdown) => {
        dropdown.addOption("random", "Random");
        for (const transition of this.plugin.transitions.all()) dropdown.addOption(transition.id, transition.name);
        dropdown.setValue(preset.transitions.transitionId).onChange(async (value) => {
          preset.transitions.transitionId = value;
          await this.plugin.saveSettings();
        });
      });
    new Setting(container)
      .setName("Transition duration")
      .setDesc("0-5000 ms.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 5000, 100)
          .setValue(preset.transitions.durationMs)
          .onChange(async (value) => {
            preset.transitions.durationMs = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private renderGallery(container: HTMLElement): void {
    new Setting(container)
      .setName("Open Gallery")
      .setDesc("Browse current media, favorite items and hide items from LumaFrame.")
      .addButton((button) => button.setButtonText("Open Gallery").setCta().onClick(() => void this.plugin.openGallery()));
    new Setting(container)
      .setName("Hidden Media")
      .setDesc(`${Object.keys(this.plugin.settings.hiddenMedia).length} hidden items.`)
      .addButton((button) =>
        button.setButtonText("Restore All").onClick(async () => {
          this.plugin.settings.hiddenMedia = {};
          await this.saveRefresh();
          this.renderSettings();
        })
      );
  }

  private renderVideo(container: HTMLElement): void {
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
          .onChange(async (value) => {
            this.plugin.settings.videoVolume = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private renderPlaylists(container: HTMLElement): void {
    new Setting(container)
      .setName("New Playlist")
      .setDesc("Playlists keep deliberate media order separate from visual style.")
      .addButton((button) =>
        button.setButtonText("Create").setCta().onClick(() => {
          new TextPromptModal(this.app, "New Playlist", "Favorites", "Playlist name", "Create", async (name) => {
            this.plugin.settings.playlists.push(this.playlistService.create(name));
            await this.plugin.saveSettings();
            this.renderSettings();
          }).open();
        })
      );

    for (const playlist of this.plugin.settings.playlists) this.renderPlaylist(container, playlist);
  }

  private renderPlaylist(container: HTMLElement, playlist: Playlist): void {
    const row = container.createDiv({ cls: "lumaframe-manager-row" });
    row.createEl("strong", { text: playlist.name });
    row.createSpan({ text: `${playlist.items.length} items` });
    new Setting(row)
      .addButton((button) =>
        button.setButtonText("Rename").onClick(() => {
          new TextPromptModal(this.app, "Rename Playlist", playlist.name, "Playlist name", "Rename", async (name) => {
            playlist.name = name;
            await this.plugin.saveSettings();
            this.renderSettings();
          }).open();
        })
      )
      .addButton((button) =>
        button.setButtonText("Delete").then((component) => component.buttonEl.addClass("mod-warning")).onClick(() => {
          new ConfirmModal(this.app, "Delete Playlist?", "This only removes the playlist. Original media stays unchanged.", "Delete", async () => {
            this.plugin.settings.playlists = this.plugin.settings.playlists.filter((candidate) => candidate.id !== playlist.id);
            this.plugin.settings.profiles.forEach((profile) => {
              if (profile.playlistId === playlist.id) delete profile.playlistId;
            });
            await this.plugin.saveSettings();
            this.renderSettings();
          }).open();
        })
      );

    for (const [index, item] of playlist.items.entries()) {
      const media = this.plugin.mediaLibrary.index.get(item.mediaId);
      new Setting(row)
        .setName(media?.name ?? "Missing media")
        .setDesc(media?.path ?? "This item is no longer available.")
        .addButton((button) =>
          button.setIcon("arrow-up").setTooltip("Move up").setDisabled(index === 0).onClick(async () => {
            this.playlistService.moveItem(playlist, item.id, -1);
            await this.plugin.saveSettings();
            this.renderSettings();
          })
        )
        .addButton((button) =>
          button.setIcon("arrow-down").setTooltip("Move down").setDisabled(index === playlist.items.length - 1).onClick(async () => {
            this.playlistService.moveItem(playlist, item.id, 1);
            await this.plugin.saveSettings();
            this.renderSettings();
          })
        )
        .addButton((button) =>
          button.setButtonText("Remove").onClick(async () => {
            this.playlistService.removeMedia(playlist, item.mediaId);
            await this.plugin.saveSettings();
            this.renderSettings();
          })
        );
    }
  }

  private renderProfiles(container: HTMLElement): void {
    new Setting(container)
      .setName("New Profile")
      .setDesc("A Profile references Sources, a Playlist, a Mode and a Preset.")
      .addButton((button) =>
        button.setButtonText("Create").setCta().onClick(() => {
          new TextPromptModal(this.app, "New Profile", "Family", "Profile name", "Create", async (name) => {
            this.plugin.settings.profiles.push(this.profileService.create(name, this.plugin.settings.sources.map((source) => source.id)));
            await this.plugin.saveSettings();
            this.renderSettings();
          }).open();
        })
      );

    for (const profile of this.plugin.settings.profiles) this.renderProfile(container, profile);
  }

  private renderProfile(container: HTMLElement, profile: GalleryProfile): void {
    const row = container.createDiv({ cls: "lumaframe-manager-row" });
    row.createEl("strong", { text: profile.name });
    row.createSpan({ text: `${profile.sourceIds.length || this.plugin.settings.sources.length} Sources · ${profile.modeId}` });
    new Setting(row)
      .addButton((button) =>
        button
          .setButtonText("Use")
          .setCta()
          .setDisabled(profile.id === this.plugin.settings.defaultProfileId)
          .onClick(async () => {
            this.plugin.settings.defaultProfileId = profile.id;
            await this.plugin.saveSettings();
            this.renderSettings();
          })
      )
      .addButton((button) =>
        button.setButtonText("Rename").onClick(() => {
          new TextPromptModal(this.app, "Rename Profile", profile.name, "Profile name", "Rename", async (name) => {
            profile.name = name;
            await this.plugin.saveSettings();
            this.renderSettings();
          }).open();
        })
      )
      .addButton((button) =>
        button
          .setButtonText("Delete")
          .then((component) => component.buttonEl.addClass("mod-warning"))
          .setDisabled(this.plugin.settings.profiles.length <= 1)
          .onClick(() => {
            new ConfirmModal(this.app, "Delete Profile?", "The referenced Sources, Playlists and Presets stay unchanged.", "Delete", async () => {
              this.plugin.settings.profiles = this.plugin.settings.profiles.filter((candidate) => candidate.id !== profile.id);
              if (this.plugin.settings.defaultProfileId === profile.id) this.plugin.settings.defaultProfileId = this.plugin.settings.profiles[0]!.id;
              await this.plugin.saveSettings();
              this.renderSettings();
            }).open();
          })
      );

    new Setting(row)
      .setName("Playlist")
      .setDesc("Optional curated order for this Profile.")
      .addDropdown((dropdown) => {
        dropdown.addOption("", "No playlist");
        for (const playlist of this.plugin.settings.playlists) dropdown.addOption(playlist.id, playlist.name);
        dropdown.setValue(profile.playlistId ?? "").onChange(async (value) => {
          if (value) profile.playlistId = value;
          else delete profile.playlistId;
          await this.plugin.saveSettings();
        });
      });

    new Setting(row)
      .setName("Mode")
      .setDesc("Playback logic for this Profile.")
      .addDropdown((dropdown) => {
        for (const mode of this.plugin.playbackModes.all()) dropdown.addOption(mode.id, mode.name);
        dropdown.setValue(profile.modeId).onChange(async (value) => {
          profile.modeId = value as typeof profile.modeId;
          await this.plugin.saveSettings();
        });
      });

    new Setting(row)
      .setName("Preset")
      .setDesc("Visual style for this Profile.")
      .addDropdown((dropdown) => {
        for (const preset of this.plugin.settings.presets) dropdown.addOption(preset.id, preset.name);
        dropdown.setValue(profile.presetId).onChange(async (value) => {
          profile.presetId = value;
          await this.plugin.saveSettings();
        });
      });

    for (const source of this.plugin.settings.sources) {
      new Setting(row)
        .setName(source.name)
        .setDesc(source.path)
        .addToggle((toggle) =>
          toggle.setValue(profile.sourceIds.length === 0 || profile.sourceIds.includes(source.id)).onChange(async (value) => {
            if (profile.sourceIds.length === 0) profile.sourceIds = this.plugin.settings.sources.map((candidate) => candidate.id);
            profile.sourceIds = value ? [...new Set([...profile.sourceIds, source.id])] : profile.sourceIds.filter((id) => id !== source.id);
            await this.plugin.saveSettings();
          })
        );
    }
  }

  private renderPresets(container: HTMLElement): void {
    const profile = this.plugin.defaultProfile();
    const active = this.defaultPreset();
    container.createEl("p", { text: `${active.name}${this.presetModified(active) ? " · Modified" : ""}` });
    new Setting(container)
      .setName("Image fit")
      .setDesc("Fit keeps the complete image visible.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("fit", "Fit")
          .addOption("fill", "Fill")
          .addOption("smart-fit", "Smart Fit")
          .addOption("original", "Original")
          .addOption("width", "Width")
          .addOption("height", "Height")
          .setValue(active.appearance.fit)
          .onChange(async (value) => {
            active.appearance.fit = value as FitMode;
            await this.plugin.saveSettings();
          })
      );
    new Setting(container)
      .setName("Background")
      .setDesc("Portrait media remains complete in the foreground.")
      .addDropdown((dropdown) => {
        for (const value of ["black", "white", "custom-color", "obsidian-theme", "blurred-media", "dark-blurred-media", "moving-blur", "gradient", "extended-edges"]) {
          dropdown.addOption(value, this.label(value));
        }
        dropdown.setValue(active.appearance.background).onChange(async (value) => {
          active.appearance.background = value as BackgroundMode;
          await this.plugin.saveSettings();
        });
      });
    new Setting(container)
      .setName("Ken Burns")
      .setDesc("Motion stays modest so images are not aggressively cropped.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("off", "Off")
          .addOption("subtle", "Subtle")
          .addOption("normal", "Normal")
          .addOption("cinematic", "Cinematic")
          .setValue(active.motion.kenBurns)
          .onChange(async (value) => {
            active.motion.kenBurns = value as KenBurnsMode;
            await this.plugin.saveSettings();
          })
      );
    new Setting(container)
      .setName("Reduce Motion")
      .setDesc("Limits transitions to None, Fade and Crossfade.")
      .addToggle((toggle) =>
        toggle.setValue(active.motion.reduceMotion).onChange(async (value) => {
          active.motion.reduceMotion = value;
          await this.plugin.saveSettings();
        })
      );
    new Setting(container)
      .setName("Preset actions")
      .addButton((button) => button.setButtonText("Save As").onClick(() => this.savePresetAs(active, profile)))
      .addButton((button) =>
        button.setButtonText("Reset Defaults").onClick(async () => {
          const defaults = this.presetService.defaults();
          const replacement = defaults.find((preset) => preset.id === active.id);
          if (!replacement) return;
          Object.assign(active, structuredClone(replacement));
          await this.plugin.saveSettings();
          this.renderSettings();
        })
      );
  }

  private renderDisplay(container: HTMLElement): void {
    new Setting(container)
      .setName("Auto fullscreen")
      .setDesc("Automatically enter fullscreen when gallery starts.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoFullscreen).onChange(async (value) => {
          this.plugin.settings.autoFullscreen = value;
          await this.plugin.saveSettings();
        })
      );
    new Setting(container)
      .setName("Keep Display Awake")
      .setDesc("Uses safe platform support when available.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.keepDisplayAwake).onChange(async (value) => {
          this.plugin.settings.keepDisplayAwake = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private renderAdvanced(container: HTMLElement): void {
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
      .setName("Ignore small media")
      .setDesc("Useful for excluding icons, thumbnails and website graphics.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.ignoreSmallMedia).onChange(async (value) => {
          this.plugin.settings.ignoreSmallMedia = value;
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

  private async addVaultSource(path: string): Promise<void> {
    const normalizedPath = this.normalizeVaultFolderPath(path);
    const folder = normalizedPath ? this.plugin.app.vault.getAbstractFileByPath(normalizedPath) : this.plugin.app.vault.getRoot();
    if (!(folder instanceof TFolder)) {
      new Notice("This folder is not inside the current vault.");
      return;
    }
    if (this.plugin.settings.sources.some((source) => source.type === "vault" && source.path === normalizedPath)) {
      new Notice("This folder is already a LumaFrame Source.");
      return;
    }
    const source = this.sourceService.createVaultSource(normalizedPath);
    this.plugin.settings.sources.push(source);
    for (const profile of this.plugin.settings.profiles) {
      if (profile.sourceIds.length === 0 || profile.id === this.plugin.settings.defaultProfileId) {
        profile.sourceIds = [...new Set([...profile.sourceIds, source.id])];
      }
    }
    await this.saveRefresh();
    this.renderSettings();
  }

  private normalizeVaultFolderPath(path: string): string {
    const cleanPath = path.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    const adapter = this.plugin.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) return cleanPath;

    const vaultPath = adapter.getBasePath().replace(/\\/g, "/").replace(/\/+$/g, "");
    const absolutePath = path.trim().replace(/\\/g, "/").replace(/\/+$/g, "");
    if (absolutePath === vaultPath) return "";
    if (!absolutePath.startsWith(`${vaultPath}/`)) return cleanPath;
    return absolutePath.slice(vaultPath.length + 1);
  }

  private async updateProfileMode(profile: GalleryProfile, value: string): Promise<void> {
    profile.modeId = value as typeof profile.modeId;
    await this.plugin.saveSettings();
  }

  private async updatePhotoDuration(profile: GalleryProfile, value: string): Promise<void> {
    profile.imageDuration = Number(value);
    await this.plugin.saveSettings();
  }

  private defaultPreset(): GalleryPreset {
    const profile = this.plugin.defaultProfile();
    return this.plugin.settings.presets.find((preset) => preset.id === profile.presetId) ?? this.plugin.settings.presets[0]!;
  }

  private presetModified(preset: GalleryPreset): boolean {
    const saved = this.presetService.defaults().find((candidate) => candidate.id === preset.id);
    return saved ? this.presetService.displayName(saved, preset).endsWith("Modified") : false;
  }

  private savePresetAs(preset: GalleryPreset, profile: GalleryProfile): void {
    new TextPromptModal(this.app, "Save Preset As", `${preset.name} Copy`, "Preset name", "Save As", async (name) => {
      const copy = this.presetService.cloneAs(preset, name);
      this.plugin.settings.presets.push(copy);
      profile.presetId = copy.id;
      await this.plugin.saveSettings();
      this.renderSettings();
    }).open();
  }

  private async saveRefresh(): Promise<void> {
    await this.plugin.saveSettings();
    await this.plugin.refreshMedia();
  }

  private move<T>(items: T[], index: number, direction: -1 | 1): void {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    [items[index], items[next]] = [items[next]!, items[index]!];
  }

  private label(value: string): string {
    return value
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
}
