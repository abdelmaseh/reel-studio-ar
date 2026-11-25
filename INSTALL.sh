#!/usr/bin/env bash
# Rebuilds the whole studio from scratch in one command (the sandbox wipes /home between runs;
# this bundle lives under /downloads and survives). Safe to re-run: every step is idempotent.
set -euo pipefail
STUDIO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "== reel studio install =="

# 1. dependencies
cd "$STUDIO/template"
if [ ! -d node_modules/remotion ]; then npm install --no-audit --no-fund; fi

# 2. vendored modules -> src/vendor (what the template imports)
rm -rf src/vendor
mkdir -p src/vendor
cp -r "$STUDIO/vendor/reel-studio" src/vendor/reel-studio

# 3. Tajawal (OFL) into public/fonts
F="$STUDIO/template/public/fonts"; mkdir -p "$F"
BASE="https://github.com/google/fonts/raw/main/ofl/tajawal"
for w in Regular Medium Bold ExtraBold Black; do
  [ -s "$F/Tajawal-$w.ttf" ] || curl -fsSL "$BASE/Tajawal-$w.ttf" -o "$F/Tajawal-$w.ttf"
done

# 4. CC0 SFX pack (438 files)
if [ ! -d "$STUDIO/assets/sfx/sounds" ]; then
  rm -rf "$STUDIO/assets/sfx"
  git clone --depth 1 https://github.com/Reodelbasalan/adbertiser-sfx "$STUDIO/assets/sfx"
fi

# 5. smoke checks
node -e "import('$STUDIO/template/src/vendor/reel-studio/arabic/kashida.ts').then(m=>console.log('arabic module:', m.stretchWord('تحويل',2)))"
npx remotion versions | head -2
echo "== install complete =="
