#!/usr/bin/env bash
# Self-test for the caption timing lint: good fixture must pass, bad fixture must fail.
set -u
cd "$(dirname "$0")/.."
FF=../tools/ffmpeg/bin/ffmpeg; [ -x "$FF" ] || FF=ffmpeg
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
$FF -v error -y -f lavfi -i color=c=gray:s=1080x1920:r=60:d=5 -f lavfi -i sine=f=300:d=5 -vf format=yuv420p -af volume=0.3 -c:v libx264 -c:a aac -shortest "$T/a.mp4" || exit 2
node scripts/qa-gate.mjs "$T/a.mp4" --captions scripts/qa-fixtures/captions-good.json >/dev/null || { echo "FAIL: good fixture rejected"; exit 1; }
node scripts/qa-gate.mjs "$T/a.mp4" --captions scripts/qa-fixtures/captions-bad.json >"$T/bad.txt"; [ $? -eq 1 ] || { echo "FAIL: bad fixture passed"; exit 1; }
for c in caption-overlap caption-zero-duration caption-out-of-order caption-past-end; do grep -q "$c" "$T/bad.txt" || { echo "FAIL: missing $c"; exit 1; }; done
echo "qa-selftest: PASS"
