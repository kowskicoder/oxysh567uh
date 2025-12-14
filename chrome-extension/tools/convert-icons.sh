#!/usr/bin/env bash
set -euo pipefail

# Converts extension SVG icons to multiple PNG sizes for store use.
# Falls back to existing PNGs if SVGs aren't present.

OUT_DIR="$(dirname "$0")/../icons"
mkdir -p "$OUT_DIR"

# Source preference: svg > png (128) > png (48)
if [ -f "$OUT_DIR/icon128.svg" ]; then
  SRC="$OUT_DIR/icon128.svg"
elif [ -f "$OUT_DIR/icon128.png" ]; then
  SRC="$OUT_DIR/icon128.png"
elif [ -f "$OUT_DIR/icon48.png" ]; then
  SRC="$OUT_DIR/icon48.png"
else
  echo "No source icon found in $OUT_DIR (icon128.svg | icon128.png | icon48.png)." >&2
  exit 1
fi

# Sizes to generate
SIZES=(16 32 48 64 128 256 512)

echo "Using source: $SRC"

# Helper: use rsvg-convert if available, else ImageMagick convert
if command -v rsvg-convert >/dev/null 2>&1; then
  CONVERTER="rsvg-convert -w %d -h %d -o %s %s"
elif command -v convert >/dev/null 2>&1; then
  CONVERTER="convert %s -resize %dx%d %s"
else
  echo "No SVG/PNG conversion tool found. Install 'librsvg-bin' (rsvg-convert) or ImageMagick (convert)." >&2
  exit 1
fi

for s in "${SIZES[@]}"; do
  out="$OUT_DIR/icon${s}.png"
  if [[ "$CONVERTER" == *rsvg-convert* ]]; then
    printf "%s\n" "Converting to $s";
    rsvg-convert -w "$s" -h "$s" -o "$out" "$SRC"
  else
    printf "%s\n" "Converting to $s";
    convert "$SRC" -background none -resize "${s}x${s}" "$out"
  fi
done

echo "Generated icons in: $OUT_DIR"
