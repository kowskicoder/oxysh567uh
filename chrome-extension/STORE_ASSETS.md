Store assets and icon generation
================================

This folder contains helper tooling and guidance to create store-ready assets for the Chrome extension.

What I added
- `tools/convert-icons.sh` — script that converts the SVG (or existing PNG) source into multiple PNG sizes: 16,32,48,64,128,256,512.
- `manifest.json` was updated to reference PNG icons and include common sizes used by stores (128, 256, 512).

How to generate icons (recommended)
1. Install a converter: `sudo apt-get install librsvg2-bin` (for `rsvg-convert`) or `sudo apt-get install imagemagick` (for `convert`).
2. Place your master SVG (preferably a 512x512 or vector logo) at `chrome-extension/icons/icon128.svg` (or `icon512.svg`).
3. Run the converter script from repo root:

```bash
cd chrome-extension
./tools/convert-icons.sh
```

This will generate `icon16.png`, `icon32.png`, `icon48.png`, `icon64.png`, `icon128.png`, `icon256.png`, and `icon512.png` in the `chrome-extension/icons` directory.

Store screenshots and promotional images
- Use `create-screenshots.html` (already present) or your preferred screenshot tool to capture extension UI and site pages.
- Chrome Web Store requires a 1280x800 (or similar) screenshot for the listing header; keep assets in `chrome-extension/store/`.

Notes & next steps
- I did not attempt to rasterize SVGs here (script only). If you want, I can run the conversion in this environment and commit the generated PNGs here — tell me to proceed and I'll run the script and add the generated files.
- If you want polished store images (transparent PNG, drop shadows, mockups), I can generate templates and add them to `chrome-extension/store/`.
