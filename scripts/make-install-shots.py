#!/usr/bin/env python3
"""Builds the terminal screenshots used in the README install steps (docs/img/install/).
Text comes from real runs of each command (captured logs), drawn in a terminal window frame.
Usage: python3 scripts/make-install-shots.py CAPDIR OUTDIR   (CAPDIR holds install.log, qa.log, preview.png, outframe.png)"""
import sys, os, re
from PIL import Image, ImageDraw, ImageFont
cap, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
FP = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
f, fb = ImageFont.truetype(FP, 22), ImageFont.truetype(FB, 22)
BG, BAR, FG = (22, 24, 33), (40, 43, 58), (214, 219, 235)
GREEN, DIM, CYAN, AMBER = (110, 231, 140), (120, 128, 155), (120, 205, 255), (255, 191, 90)
W, LH, PAD = 1100, 32, 28

def colour(line):
    if line.startswith("$ "): return None
    if line.startswith("[ ok ]") or "PASS" in line or "complete" in line or line.startswith("+") or "wrote" in line: return GREEN
    if line.startswith("==") or line.startswith(">>"): return CYAN
    return FG

def term(name, title, lines, side=None):
    h = 56 + PAD + LH * len(lines) + PAD
    img = Image.new("RGB", (W, h), BG); d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, W, 48), 0, fill=BAR)
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse((20 + i * 30, 15, 36 + i * 30, 31), fill=c)
    d.text((W // 2, 24), title, font=f, fill=DIM, anchor="mm")
    y = 56 + PAD // 2
    for ln in lines:
        if ln.startswith("$ "):
            d.text((PAD, y), "$", font=fb, fill=AMBER); d.text((PAD + 30, y), ln[2:], font=fb, fill=(255, 255, 255))
        else:
            d.text((PAD, y), ln, font=f, fill=colour(ln))
        y += LH
    img.save(os.path.join(out, name), optimize=True)

def rd(n): return [l.rstrip() for l in open(os.path.join(cap, n), encoding="utf-8") if l.strip()]

term("step1-clone.png", "Git Bash: clone", [
    "$ git clone https://github.com/abdelmaseh/reel-studio-ar.git",
    "Cloning into 'reel-studio-ar'...", "",
    "$ cd reel-studio-ar", "$ ls",
    "INSTALL.sh  README.md  RUNBOOK.md  assets  docs  scripts  template  vendor"])
ins = [l for l in rd("install.log") if not l.startswith("real") and not l.startswith("user") and not l.startswith("sys")]
term("step2-install.png", "reel-studio-ar: ./INSTALL.sh", ["$ ./INSTALL.sh"] + ins + ["", "# node + git + curl found, ffmpeg ready, fonts + SFX in place"])
term("step3-smoke-cmd.png", "template: smoke test", ["$ cd template",
    "$ npx remotion still src/index.ts Demo preview.png --frame=45"] + [l for l in rd("still.log") if l.startswith(("Rendered 1/1", "+"))][:2])
r = [l for l in rd("render.log") if l.startswith((">>", "Composition", "Codec", "+"))]
keep = [l for l in r if "chunk_00" not in l or l.startswith("+")]
term("step6-render.png", "template: render-reel.sh", ["$ bash scripts/render-reel.sh Demo 250 out.mp4"] + keep[:3] + ["...", ] + [l.replace("/tmp/cap/","") for l in r if l.startswith(">> wrote") or l.startswith(">> run")][:2])
term("step7-qa.png", "template: qa-gate", ["$ node scripts/qa-gate.mjs out.mp4 --fps 60"] + rd("qa.log"))

# output: phone frame + preview side by side
def phone(src, size=(360, 640)):
    im = Image.open(src).convert("RGB"); im.thumbnail(size); return im
a, b = phone(os.path.join(cap, "preview.png")), phone(os.path.join(cap, "outframe.png"))
canvas = Image.new("RGB", (W, 760), BG); d = ImageDraw.Draw(canvas)
for im, x, label in [(a, 150, "preview.png (still)"), (b, 640, "out.mp4 (frame at 3s)")]:
    canvas.paste(im, (x, 40)); d.rounded_rectangle((x - 6, 34, x + im.width + 6, 46 + im.height), 18, outline=GREEN, width=3)
    d.text((x + im.width // 2, 712), label, font=f, fill=DIM, anchor="mm")
canvas.save(os.path.join(out, "step8-output.png"), optimize=True)
