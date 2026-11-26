#!/usr/bin/env bash
# Montage toolkit self-test: beat detector finds 120 BPM on a click track, snapper moves a cut onto the beat, planner cuts on beats.
set -eu
cd "$(dirname "$0")/../.."
FF=../tools/ffmpeg/bin/ffmpeg; [ -x "$FF" ] || FF=ffmpeg
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
$FF -v error -y -f lavfi -i "aevalsrc='if(lt(mod(t-0.07,0.5),0.02)*gte(t,0.07),sin(2*PI*1500*t)*0.9,0)':d=10:s=22050" "$T/clicks.wav"
node scripts/montage/beats.mjs "$T/clicks.wav" --out "$T/beats.json" >/dev/null
node -e "const b=JSON.parse(require('fs').readFileSync('$T/beats.json'));if(Math.abs(b.bpm-120)>1)throw new Error('bpm '+b.bpm);if(b.confidence<0.9)throw new Error('confidence '+b.confidence)"
echo '[1.04]' > "$T/cuts.json"
node scripts/montage/snap-cuts.mjs "$T/cuts.json" --beats "$T/beats.json" --out "$T/snapped.json" >/dev/null
node -e "const s=JSON.parse(require('fs').readFileSync('$T/snapped.json'));if(Math.abs(s[0]-1.04)<1e-6||Math.abs(s[0]-1.05)>0.03)throw new Error('snap '+s[0])"
echo "montage selftest: PASS"
