#!/usr/bin/env bash
# Rebuilds the whole studio from scratch in one command (the sandbox wipes /home between runs;
# this bundle lives under /downloads and survives). Safe to re-run: every step is idempotent.
set -euo pipefail
STUDIO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "== reel studio install =="

# 0. prerequisites: node, git, curl (must exist) + ffmpeg/ffprobe (auto-installed locally if missing)
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) OS=windows;; Darwin) OS=mac;; *) OS=linux;; esac
LOCAL_BIN="$STUDIO/tools/ffmpeg/bin"
[ -d "$LOCAL_BIN" ] && export PATH="$LOCAL_BIN:$PATH"
fix_for() {
  case "$1:$OS" in
    node:windows) echo "winget install OpenJS.NodeJS.LTS   (or download from https://nodejs.org), then reopen Git Bash";;
    node:mac) echo "brew install node   (or https://nodejs.org)";;
    node:linux) echo "install Node 18+ from https://nodejs.org or your package manager (e.g. sudo apt install nodejs npm)";;
    git:windows) echo "winget install Git.Git   (or https://git-scm.com/download/win), then reopen Git Bash";;
    git:mac) echo "brew install git   (or: xcode-select --install)";;
    git:linux) echo "sudo apt install git   (or your package manager)";;
    curl:*) echo "install curl (it ships with Git for Windows / macOS; on Linux: sudo apt install curl)";;
  esac
}
MISSING=0
for t in node npm git curl; do
  if ! command -v "$t" >/dev/null 2>&1; then
    echo "MISSING: $t  ->  $(fix_for "${t/npm/node}")"; MISSING=1
  fi
done
if [ "$MISSING" = 1 ]; then echo "Install the missing tools above, then run ./INSTALL.sh again."; exit 1; fi

need_ff=""
for t in ffmpeg ffprobe; do command -v "$t" >/dev/null 2>&1 || need_ff="$need_ff $t"; done
if [ -n "$need_ff" ]; then
  echo "MISSING:$need_ff  ->  installing a local copy into $STUDIO/tools (no admin rights, no PATH changes)"
  mkdir -p "$STUDIO/tools"; TMPD="$(mktemp -d)"
  ok=0
  case "$OS" in
    windows)
      curl -fL --retry 3 "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" -o "$TMPD/ff.zip" && {
        if command -v unzip >/dev/null 2>&1; then unzip -q -o "$TMPD/ff.zip" -d "$TMPD/x" && ok=1
        elif command -v powershell.exe >/dev/null 2>&1; then
          powershell.exe -NoProfile -Command "Expand-Archive -Force -LiteralPath '$(cygpath -w "$TMPD/ff.zip")' -DestinationPath '$(cygpath -w "$TMPD/x")'" && ok=1
        elif [ -x /c/Windows/System32/tar.exe ]; then mkdir -p "$TMPD/x" && /c/Windows/System32/tar.exe -xf "$(cygpath -w "$TMPD/ff.zip")" -C "$(cygpath -w "$TMPD/x")" && ok=1
        fi; }
      ;;
    linux)
      case "$(uname -m)" in aarch64|arm64) A=arm64;; *) A=amd64;; esac
      curl -fL --retry 3 "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-$A-static.tar.xz" -o "$TMPD/ff.txz" \
        && mkdir -p "$TMPD/x" && tar -xJf "$TMPD/ff.txz" -C "$TMPD/x" && ok=1
      ;;
    mac) echo "macOS: run  brew install ffmpeg  then re-run ./INSTALL.sh"; rm -rf "$TMPD"; exit 1;;
  esac
  SRC="$(find "$TMPD/x" -type d -name bin 2>/dev/null | head -1 || true)"
  if [ -z "$SRC" ]; then SRC="$(dirname "$(find "$TMPD/x" -type f -name 'ffmpeg*' 2>/dev/null | head -1)")"; fi
  if [ "$ok" = 1 ] && [ -n "$SRC" ] && [ -d "$SRC" ]; then
    rm -rf "$STUDIO/tools/ffmpeg"; mkdir -p "$LOCAL_BIN"
    cp "$SRC"/ffmpeg* "$SRC"/ffprobe* "$LOCAL_BIN/"; chmod +x "$LOCAL_BIN"/* 2>/dev/null || true
    export PATH="$LOCAL_BIN:$PATH"
  fi
  rm -rf "$TMPD"
  if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
    echo "ERROR: could not auto-install ffmpeg/ffprobe. Manual fix:"
    case "$OS" in windows) echo "  winget install Gyan.FFmpeg   (then reopen Git Bash)  or unzip a build from https://www.gyan.dev/ffmpeg/builds/ into $STUDIO/tools/ffmpeg/ so that bin/ffmpeg.exe exists";;
      *) echo "  install ffmpeg from your package manager, or put ffmpeg+ffprobe in $LOCAL_BIN";; esac
    exit 1
  fi
fi
echo "ok: node $(node -v), $(git --version), $(ffmpeg -version | head -1 | cut -d' ' -f1-3)"

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

# 3b. Cairo (OFL, variable 200-1000: the default Arabic face), IBM Plex Sans Arabic + Almarai (alternates)
BASEOFL="https://github.com/google/fonts/raw/main/ofl"
[ -s "$F/Cairo.ttf" ] || curl -fsSL "$BASEOFL/cairo/Cairo%5Bslnt,wght%5D.ttf" -o "$F/Cairo.ttf"
[ -s "$F/IBMPlexSansArabic-Bold.ttf" ] || curl -fsSL "$BASEOFL/ibmplexsansarabic/IBMPlexSansArabic-Bold.ttf" -o "$F/IBMPlexSansArabic-Bold.ttf"
[ -s "$F/Almarai-ExtraBold.ttf" ] || curl -fsSL "$BASEOFL/almarai/Almarai-ExtraBold.ttf" -o "$F/Almarai-ExtraBold.ttf"

# 4. CC0 SFX pack (438 files)
if [ ! -d "$STUDIO/assets/sfx/sounds" ]; then
  rm -rf "$STUDIO/assets/sfx"
  git clone --depth 1 https://github.com/Reodelbasalan/adbertiser-sfx "$STUDIO/assets/sfx"
fi

# 5. smoke checks
node -e "import('$STUDIO/template/src/vendor/reel-studio/arabic/kashida.ts').then(m=>console.log('arabic module:', m.stretchWord('تحويل',2)))"
npx remotion versions | head -2
echo "== install complete =="
