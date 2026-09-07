# Manual Installation

This folder contains everything needed to install LumaFrame manually in Obsidian.

## Files

- `lumaframe/main.js`
- `lumaframe/manifest.json`
- `lumaframe/styles.css`

## Install

1. Open your Obsidian vault folder.
2. Open `.obsidian/plugins/`.
3. Copy the full `lumaframe` folder from this directory into `.obsidian/plugins/`.
4. Restart Obsidian.
5. Open **Settings > Community plugins**.
6. Enable **LumaFrame**.
7. Put photos, GIFs or videos in the `LumaFrame Media` folder that LumaFrame creates in your vault, or open LumaFrame and drop media onto the empty player.

The final path should look like this:

```text
YourVault/.obsidian/plugins/lumaframe/
  main.js
  manifest.json
  styles.css
```

LumaFrame runs locally and does not upload media, filenames, folder names, metadata or usage data.

External folders are not scanned in the community build. Put media inside your vault, then add that vault folder.
