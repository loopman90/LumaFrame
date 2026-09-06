# LumaFrame

**Turn your media into a living gallery.**

LumaFrame is an Obsidian plugin for turning folders of photos, GIFs and videos into a calm digital photo frame, fullscreen gallery and ambient media player.

The first-run experience is deliberately simple:

**Choose media -> Choose look -> Press Play.**

## Features

- Local-first media playback inside Obsidian
- Explicit vault media Sources
- Desktop-ready external folder Sources
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

## Screenshots

Screenshots will be added as the visual design is refined.

## Installation

For development:

1. Clone this repository.
2. Run `npm install`.
3. Run `npm run build`.
4. Copy `main.js`, `manifest.json` and `styles.css` into:

```text
<your vault>/.obsidian/plugins/lumaframe/
```

5. Enable LumaFrame in Obsidian settings.

## Quick Start

1. Open LumaFrame settings.
2. Add one or more vault folders under Sources.
3. Choose a Preset.
4. Choose a Mode.
5. Run **LumaFrame: Open**.

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

Core vault Sources, image playback, GIFs, supported videos, presets, profiles and gallery views are designed to work without desktop-only APIs. External folders, native file watching, kiosk and second-screen features are desktop-oriented.

## Privacy

LumaFrame is completely local.

It does not implement analytics, telemetry, cloud processing, AI, external APIs, accounts, tracking or remote databases. It does not upload media, filenames, folder names, metadata or usage data.

## Troubleshooting

If no media appears, check that at least one Source is enabled and that the folder path is correct.

If a video does not play, the device may not support that format. LumaFrame skips unsupported media and continues playback.
