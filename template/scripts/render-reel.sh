#!/usr/bin/env bash
# Sequential chunked render + delivery encode for the 1-CPU sandbox.
# Usage: render-reel.sh <CompositionId> <totalFrames> <out.mp4> [--voiceover vo.mp3] [--mix spec.txt] [--fps 60] [--max-mb 14] [--chunk 100]
# Mix spec lines: <audio file>|<start sec>|<volume 0-1>
set -euo pipefail
cd "$(dirname "$0")/.."
# prefer the local ffmpeg/ffprobe installed by INSTALL.sh (<repo>/tools/ffmpeg/bin), else use PATH
LOCAL_FF="$(cd ../tools/ffmpeg/bin 2>/dev/null && pwd || true)"
[ -n "$LOCAL_FF" ] && export PATH="$LOCAL_FF:$PATH"

COMP="$1"; TOTAL="$2"; OUT="$3"; shift 3
VO=""; MIX=""; FPS_OUT=60; MAXMB=14; CHUNK=100
while [ $# -gt 0 ]; do
  case "$1" in
    --voiceover) VO="$2"; shift 2;; --mix) MIX="$2"; shift 2;; --fps) FPS_OUT="$2"; shift 2;;
    --max-mb) MAXMB="$2"; shift 2;; --chunk) CHUNK="$2"; shift 2;; *) echo "unknown arg $1"; exit 2;;
  esac
done

WORK="$(mktemp -d "${TMPDIR:-/tmp}/reel-render-XXXX")"; trap 'rm -rf "$WORK"' EXIT
# native ffmpeg.exe cannot read MSYS-style paths (/tmp/...) written inside list files: use mixed Windows paths when cygpath exists
if command -v cygpath >/dev/null 2>&1; then WORKW="$(cygpath -m "$WORK")"; else WORKW="$WORK"; fi
echo ">> rendering $COMP ($TOTAL frames) in $(( (TOTAL + CHUNK - 1) / CHUNK )) chunk(s), concurrency 1"
i=0; start=0
while [ "$start" -lt "$TOTAL" ]; do
  end=$(( start + CHUNK - 1 )); [ $end -ge "$TOTAL" ] && end=$(( TOTAL - 1 ))
  echo ">> chunk $i: frames $start-$end"
  npx remotion render src/index.ts "$COMP" "$WORK/chunk_$(printf %03d $i).mp4" --frames="$start-$end" --concurrency=1 --codec=h264 --crf=16 --pixel-format=yuv420p
  i=$((i+1)); start=$((end+1))
done

for c in "$WORK"/chunk_*.mp4; do printf "file '%s/%s'\n" "$WORKW" "$(basename "$c")"; done > "$WORK/list.txt"
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$WORK/list.txt" -c copy "$WORK/video.mp4"

# ---- audio mix ----
AUDIO_ARGS=(); FILTER=""; n=0
if [ -n "$VO" ]; then AUDIO_ARGS+=(-i "$VO"); n=$((n+1)); fi
if [ -n "$MIX" ]; then
  while IFS='|' read -r f st vol; do
    vol="${vol%$'\r'}"   # tolerate CRLF mix files saved on Windows
    [ -z "${f// }" ] && continue
    ms=$(node -e "console.log(Math.round(parseFloat(process.argv[1])*1000))" "$st")
    AUDIO_ARGS+=(-i "$f")
    FILTER="${FILTER}[$((n+1)):a]adelay=${ms}|${ms},volume=${vol}[s${n}];"
    n=$((n+1))
  done < "$MIX"
fi

if [ "$n" -gt 0 ]; then
  INS=""; for k in $(seq 0 $((n-1))); do
    if [ "$k" -eq 0 ] && [ -n "$VO" ]; then INS="${INS}[1:a]"; else INS="${INS}[s${k}]"; fi
  done
  FILTER="${FILTER}${INS}amix=inputs=${n}:normalize=0,alimiter=limit=0.94[aout]"
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/video.mp4" "${AUDIO_ARGS[@]}" -filter_complex "$FILTER" \
    -map 0:v -map '[aout]' -c:v copy -c:a aac -b:a 160k -shortest "$WORK/av.mp4"
else
  cp "$WORK/video.mp4" "$WORK/av.mp4"
fi

# ---- conform + size ----
ffmpeg -hide_banner -loglevel error -y -i "$WORK/av.mp4" -vf "fps=${FPS_OUT}" -c:v libx264 -crf 17 -preset slow \
  -pix_fmt yuv420p -c:a copy -movflags +faststart "$WORK/final.mp4"
SIZE=$(stat -c%s "$WORK/final.mp4"); LIMIT=$(node -e "console.log(Math.floor(parseFloat(process.argv[1])*1048576))" "$MAXMB")
if [ "$SIZE" -gt "$LIMIT" ]; then
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WORK/av.mp4")
  BR=$(node -e "const d=parseFloat(process.argv[1]),L=Number(process.argv[2]);console.log(Math.floor((L*0.96*8/d-160000)/1000))" "$DUR" "$LIMIT")
  echo ">> over ${MAXMB} MB, re-encoding at ~${BR}k video bitrate (2-pass)"
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/av.mp4" -vf "fps=${FPS_OUT}" -c:v libx264 -b:v "${BR}k" -pass 1 -passlogfile "$WORKW/pass" -an -f null -
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/av.mp4" -vf "fps=${FPS_OUT}" -c:v libx264 -b:v "${BR}k" -pass 2 -passlogfile "$WORKW/pass" \
    -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$WORK/final.mp4"
fi
cp "$WORK/final.mp4" "$OUT"
echo ">> wrote $OUT ($(node -e "console.log((Number(process.argv[1])/1048576).toFixed(2)+' MB')" "$(stat -c%s "$OUT")"))"
echo ">> run the gate: node scripts/qa-gate.mjs '$OUT' --fps $FPS_OUT --max-mb $MAXMB"
