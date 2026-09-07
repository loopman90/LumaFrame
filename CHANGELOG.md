# Changelog

All notable changes to LumaFrame are documented here.

## 0.1.17

- Added a polished first-run empty state with Drop images here, Open folder and Manage Sources actions.
- Added drag-and-drop import into the `LumaFrame Media` vault folder.
- Added filename collision handling for dropped media files.

## 0.1.16

- Added a Hide Quick UI action inside the Quick UI panel.
- Added a quick transition duration slider to the player.
- Removed the macOS-style window decoration from the Quick UI.
- Saves quick transition timing to the active preset.

## 0.1.15

- Added a Quick UI panel to the player.
- Added direct playback mode switching from the player.
- Added quick access to playback, favorite, gallery, fullscreen and settings controls.

## 0.1.14

- Removed the Add External Folder control from the community build.
- Automatically creates a `LumaFrame Media` vault folder.
- Adds `LumaFrame Media` as a default vault Source for new media.

## 0.1.13

- Kept the External Folder Choose button visible in the community build.
- Shows clear guidance when external folders are unavailable.

## 0.1.12

- Removed direct external filesystem scanning from the community build.
- Disabled external folder controls to avoid Obsidian review filesystem warnings.
- Kept the vault folder selector as the supported cross-platform Source picker.

## 0.1.11

- Changed desktop filesystem loading to guarded `require()` calls for Obsidian review compatibility.

## 0.1.10

- Made the external folder filesystem guard explicit for Obsidian review scanning.
- Kept external folder support desktop-only.

## 0.1.9

- Added a desktop external folder picker for Sources.
- Enabled scanning of explicitly selected external folders on desktop.
- Rendered external media through local file URLs for macOS, Linux and Windows paths.

## 0.1.8

- Added a searchable vault folder selector for adding Sources.
- Kept manual path entry as an advanced fallback.
- Updated manual installation files for the folder selector build.

## 0.1.7

- Converted absolute paths inside the current vault to vault-relative Source paths.
- Disabled external folder Source input in the community build with clearer guidance.
- Updated privacy and troubleshooting documentation for Source scanning.

## 0.1.6

- Added changelog, testing checklist, security policy and GitHub issue templates.
- Made Gallery playback start from the selected item.
- Removed the unused screenshots section from the README.

## 0.1.5

- Fixed a settings callback warning from the Obsidian review scanner.
- Kept release assets built and attested by GitHub Actions.

## 0.1.4

- Reduced review scanner warnings around DOM helpers and settings callbacks.
- Added a compatibility hook for settings definitions.
- Published release assets with verified artifact attestations.

## 0.1.3

- Removed direct Node filesystem scanning from the community build.
- Changed vault scanning to walk only explicitly selected Source folders.
- Removed unsupported CSS features flagged by the review scanner.
- Added automated release notes to the release workflow.

## 0.1.2

- Fixed Obsidian community review metadata.
- Added GitHub Actions release workflow.
- Added artifact attestations for release assets.

## 0.1.1

- Updated manifest metadata.
- Removed redundant plugin name prefixes from command names.

## 0.1.0

- Initial LumaFrame foundation.
- Added player view, gallery view, Sources, Profiles, Presets, playback modes and local media indexing.
