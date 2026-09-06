# LumaFrame Development

LumaFrame is organized around six separate concepts:

```text
Sources -> Playlists -> Modes -> Presets -> Profiles -> Sessions
```

These must remain independent. Do not merge them into a single settings object or allow one concept to own another concept's responsibilities.

## Sources

Sources define where media comes from. A Source has an id, name, type, path, include-subfolders flag and enabled state.

Sources do not define transitions, image duration, playback order, overlays or visual appearance.

## Playlists

Playlists define intentional media membership and order. They may contain media from multiple Sources.

Playlists do not define presentation style or playback mode.

## Modes

Modes define queue generation. Each mode implements `PlaybackMode.createQueue`.

Modes do not define appearance, transitions, backgrounds, overlays or colors.

To add a new Mode:

1. Add the id to `PlaybackModeId`.
2. Implement a `PlaybackMode`.
3. Register it in `createPlaybackModeRegistry`.
4. Add tests for queue behavior.

## Presets

Presets define appearance: fit, background, transitions, overlays and motion.

Presets do not define Sources or Playlist membership.

Preset dirty state is derived through normalized comparison in `src/utils/presetDirty.ts`.

## Profiles

Profiles reference other systems by id: Source ids, optional Playlist id, Mode id and Preset id.

Profiles may store runtime preferences such as image duration, remember position and remember shuffle progress.

## Sessions

Sessions define what is currently running. Two Sessions may use the same Profile while keeping independent queues, timers, videos and render state.

The current player creates one Session per opened player view. Future second-screen and multi-display work should extend this rather than adding state to Profiles.

## MediaLibrary

`MediaLibrary` owns the current in-memory index and refreshes it through `MediaScanner`.

The scanner only reads enabled Sources explicitly added by the user.

## MediaIndex

`MediaIndex` merges scanned media with local user state such as favorites, hidden media and show stats.

Do not store complete Source, Playlist, Preset or Profile data inside media items.

## Transition Architecture

Transitions are registered in `TransitionRegistry`. Each transition has an id, name, category and CSS class.

To add a transition:

1. Add a seed in `src/transitions/TransitionRegistry.ts`.
2. Add or reuse CSS under `.lumaframe-*` selectors in `styles.css`.
3. Verify reduced-motion fallback remains Fade/Crossfade/None.

## Playback Architecture

`PlaybackController` owns a Session's timer and video lifecycle.

Rules:

- Static images use the Profile image duration.
- Videos advance on the `ended` event.
- Manual navigation clears existing timers.
- Closing a view clears timers and video resources.
- Queue regeneration belongs to Modes.
- Shuffle state is persisted per Profile when remember shuffle is enabled.

## External File Handling

External folders are desktop-only. If unavailable, the UI says:

> Folders outside your vault are available on desktop.

Do not expose Node, Electron or adapter errors to users.

## Desktop And Mobile

Mobile-safe:

- Vault Sources
- Image playback
- GIFs
- Supported video playback
- Gallery
- Presets
- Profiles
- Playlists

Desktop-oriented future work:

- External folder scanning through an approved adapter
- Native file watchers
- Separate windows
- Multi-monitor behavior
- Kiosk features
- Keep-display-awake

## Data Migrations

Settings are loaded through `SettingsStore.migrateSettings`.

When changing persisted shape:

1. Increase `schemaVersion`.
2. Add an explicit migration.
3. Preserve unknown user media state where practical.
4. Never silently discard favorites, hidden media, playlists or profile references.

## Obsidian Rules

- Use `plugin.loadData()` and `plugin.saveData()` for plugin state.
- Use Vault APIs for vault file operations.
- Use lifecycle helpers such as `registerEvent` and `registerDomEvent`.
- Keep styles namespaced under `.lumaframe`.
- Keep all user-facing UI, command names, settings, notices and documentation in English.
- Do not add telemetry, external APIs, account systems or cloud processing.
- Do not permanently delete original media without confirmation.
- Add file/folder integration through Obsidian context menus when it keeps the UI calmer.
