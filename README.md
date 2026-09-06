# LumaFrame

**Turn your media into a living gallery.**

LumaFrame turns folders of photos, GIFs and videos into a calm digital photo frame, fullscreen gallery and ambient media player.

The first-run experience is deliberately simple:

**Choose media -> Choose look -> Press Play.**

## Features

- Local-first media playback inside Obsidian
- Explicit vault media Sources
- Clear guidance when a selected folder is outside the current vault
- Lightweight media index
- Image, GIF, WebP, AVIF and common video file detection
- Video playback that advances only after the video ends
- Muted video by default
- Player view with Previous, Play/Pause, Next, Favorite, Gallery and Fullscreen
- Gallery grid with favorites and hide-from-LumaFrame actions
- Gallery actions for adding media to playlists, creating notes, opening vault media, renaming vault media and confirmed deletion
- Context menu actions for vault media and folders
- Playback modes: Sequential, Reverse, Shuffle, Smart Shuffle, Favorites Only, Recently Added, On This Day and Surprise Me
- Presets: Classic Photo Frame, Ambient, Cinematic Ambient, Clean Gallery, Minimal, Dreamy and Dynamic
- Transition registry with 25+ transitions
- Onboarding flow
- Keyboard controls
- No telemetry, analytics, accounts, AI or cloud processing

## Installation

LumaFrame is currently installed manually as a community plugin. It is not published in the official Obsidian Community Plugins directory yet.

### Option 1: Install From GitHub

1. Open the repository:

   [github.com/loopman90/LumaFrame](https://github.com/loopman90/LumaFrame)

2. Download or clone the project.

3. Build the plugin:

   ```bash
   npm install
   npm run build
   ```

4. In your Obsidian vault, create this folder if it does not exist:

   ```text
   <your vault>/.obsidian/plugins/lumaframe/
   ```

5. Copy these files from the LumaFrame project into that folder:

   ```text
   main.js
   manifest.json
   styles.css
   ```

6. Restart Obsidian.

7. Open Obsidian settings.

8. Go to **Community plugins**.

9. Turn off **Restricted mode** if needed.

10. Enable **LumaFrame**.

### Option 2: Development Install

Use this when you want to keep editing the plugin code.

```bash
git clone https://github.com/loopman90/LumaFrame.git
cd LumaFrame
npm install
npm run build
```

Then copy the built files into your vault plugin folder:

```bash
mkdir -p "<your vault>/.obsidian/plugins/lumaframe"
cp main.js manifest.json styles.css "<your vault>/.obsidian/plugins/lumaframe/"
```

For active development, run:

```bash
npm run dev
```

After changes, reload Obsidian or disable and re-enable the plugin.

### Option 3: Symlink For Development

Advanced users can symlink the repository directly into an Obsidian vault:

```bash
ln -s "/path/to/LumaFrame" "<your vault>/.obsidian/plugins/lumaframe"
cd "/path/to/LumaFrame"
npm install
npm run dev
```

This keeps the plugin folder connected to your local Git checkout.

### Required Files

Obsidian needs these files in the plugin folder:

```text
main.js
manifest.json
styles.css
```

Source files such as `src/`, `tests/` and `package.json` are useful for development, but Obsidian only needs the built plugin files to load LumaFrame.

### Updating

To update a manual install:

```bash
git pull
npm install
npm run build
cp main.js manifest.json styles.css "<your vault>/.obsidian/plugins/lumaframe/"
```

Then reload Obsidian.

## Quick Start

1. Open LumaFrame settings.
2. Add one or more vault folders under Sources.
3. Choose a Preset.
4. Choose a Mode.
5. Run **Open** from the LumaFrame command group.

## Project Docs

- [Changelog](CHANGELOG.md)
- [Testing checklist](TESTING.md)
- [Security and privacy](SECURITY.md)

## Supported Media

Images:

- `.jpg`
- `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.avif`
- `.svg`

Videos:

- `.mp4`
- `.webm`
- `.m4v`
- `.ogv`
- `.mpeg`
- `.mpg`

MOV is not listed as guaranteed support. LumaFrame only plays media when the current device can play it.

## Sources

Sources answer: **Where does the media come from?**

LumaFrame only scans Sources explicitly added by the user. It never scans the whole vault, home directory, Pictures folder, Downloads folder or drives automatically.

Use **Choose** in the Source settings to pick a folder from inside your current Obsidian vault. You can also enter a vault path manually. If you paste an absolute path that points inside the current vault, LumaFrame converts it to the matching vault path automatically.

External desktop folders are not scanned in the community build. Move or copy media into your vault, then add that vault folder as a Source.

## Profiles

Profiles answer: **Which complete setup should be used?**

A Profile references Sources, an optional Playlist, a Mode and a Preset. It does not duplicate those objects.

## Presets

Presets answer: **How should LumaFrame look?**

Preset changes are meant to be explicit. The architecture includes normalized dirty-state comparison so a future editor can show `Preset · Modified` and require Save, Save As or Reset.

## Modes

Modes answer: **How should the next item be chosen?**

Shuffle creates a real queue. Smart Shuffle uses lightweight local heuristics. Surprise Me prefers rarely shown media. No AI is used.

## Playlists

Playlists answer: **Which specific files should be included and in what order?**

Playlists can be created, renamed, deleted and reordered from settings. Media can be added from the Gallery View.

## Gallery View

The gallery is a visual grid with lazy thumbnails, favorites and hide actions. File management actions should use Obsidian Vault APIs for vault files and safe desktop APIs for external files.

## Fullscreen

Use the player fullscreen button or press `F` while LumaFrame is focused.

## Second Screen

The architecture separates Sessions from Profiles so independent windows and monitors can be added without sharing timers or queues. A separate native second-screen window depends on Obsidian/Electron support and is documented as a future desktop feature.

## Keyboard Controls

- `Space`: Play / Pause
- `Right Arrow`: Next
- `Left Arrow`: Previous
- `F`: Fullscreen
- `G`: Gallery View

## Mobile Support

Core vault Sources, image playback, GIFs, supported videos, presets, profiles and gallery views are designed to work without desktop-only APIs. External folder scanning, native file watching, kiosk and second-screen features are desktop-oriented future work.

## Privacy

LumaFrame is completely local.

It does not implement analytics, telemetry, cloud processing, AI, external APIs, accounts, tracking or remote databases. It does not upload media, filenames, folder names, metadata or usage data.

The community build scans only vault folders explicitly added as Sources. External desktop folder scanning is reserved for future work through an approved adapter.

## Language

LumaFrame's plugin interface, documentation, settings, commands and user-facing messages are written in English.

## Troubleshooting

If no media appears, check that at least one Source is enabled and that the folder is inside the current vault. The **Choose** button in Source settings is the safest way to select a working folder.

If a video does not play, the device may not support that format. LumaFrame skips unsupported media and continues playback.
