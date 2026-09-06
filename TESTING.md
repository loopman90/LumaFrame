# Testing LumaFrame

Use this checklist before publishing a release.

## Automated Checks

```bash
npm run typecheck
npm run build
npm test
```

All three commands should pass before tagging a release.

## Manual Install Smoke Test

1. Build the plugin with `npm run build`.
2. Copy `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/lumaframe/`.
3. Restart Obsidian.
4. Enable LumaFrame from Community plugins.
5. Confirm the first-run onboarding opens.
6. Confirm the `LumaFrame Media` folder exists in the vault.
7. Add a few images to `LumaFrame Media`.
8. Open the LumaFrame player.
9. Confirm an image appears.
10. Test Play/Pause, Next and Previous.
11. Switch playback mode from the Quick UI.
12. Adjust transition duration from the Quick UI.
13. Hide the Quick UI and restore it with the lower More button.
14. Open the Gallery.
15. Favorite an item.
16. Hide an item and confirm it disappears from playback.
17. Create a playlist and add a gallery item to it.
18. Start playback from a specific gallery item.
19. Create a media note for a vault item.

## Media Checks

Test at least:

- `.jpg`
- `.png`
- `.gif`
- `.webp`
- `.mp4` or `.webm`

Unsupported media should show a friendly message and playback should continue.

## Privacy Checks

- Confirm no network requests are introduced.
- Confirm only explicitly added Sources are scanned.
- Confirm `LumaFrame Media` is created as a vault Source.
- Confirm the Source folder selector lists vault folders on desktop and mobile.
- Confirm no media, filenames, folder names or metadata are uploaded.
- Confirm external folder controls are disabled in the community build.

## Release Checks

1. Bump `manifest.json`, `package.json` and `versions.json`.
2. Commit and push `main`.
3. Tag the exact manifest version without a `v` prefix.
4. Push the tag.
5. Confirm GitHub Actions creates the release.
6. Confirm release assets include `main.js`, `manifest.json` and `styles.css`.
7. Confirm artifact attestations verify for `main.js` and `styles.css`.
