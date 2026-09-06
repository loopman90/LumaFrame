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
6. Add a vault folder Source that contains a few images.
7. Open the LumaFrame player.
8. Confirm an image appears.
9. Test Play/Pause, Next and Previous.
10. Open the Gallery.
11. Favorite an item.
12. Hide an item and confirm it disappears from playback.
13. Create a playlist and add a gallery item to it.
14. Start playback from a specific gallery item.
15. Create a media note for a vault item.

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
- Confirm no media, filenames, folder names or metadata are uploaded.
- Confirm external folder scanning remains disabled in the community build.

## Release Checks

1. Bump `manifest.json`, `package.json` and `versions.json`.
2. Commit and push `main`.
3. Tag the exact manifest version without a `v` prefix.
4. Push the tag.
5. Confirm GitHub Actions creates the release.
6. Confirm release assets include `main.js`, `manifest.json` and `styles.css`.
7. Confirm artifact attestations verify for `main.js` and `styles.css`.
