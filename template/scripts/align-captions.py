#!/usr/bin/env python3
"""Word-aligned captions: put your CORRECTED Arabic text on the real timing of the voiceover.

Usage: python3 scripts/align-captions.py vo.wav script.txt out.json [--pair 2]
  script.txt : the exact text you want on screen (one line per sentence is fine; punctuation is ignored)
  out.json   : {"words":[{text,start,end}...], "captions":[[word,word],...]} (captions = chunks of --pair words)

How it works: the voiceover is analysed for WHEN speech happens (faster-whisper word timestamps if
installed: pip install faster-whisper; otherwise ffmpeg silence detection). Whisper often mishears
Egyptian Arabic, so its TEXT is never used. Only its speech/pause timeline is. Your corrected words are
spread over the real speech time (pauses stay pauses), so captions start and end with the voice and
do not drift like a flat proportional split.
"""
import json, re, subprocess, sys, os

def speech_spans_whisper(wav):
    from faster_whisper import WhisperModel
    m = WhisperModel(os.environ.get('WHISPER_MODEL', 'small'), device='cpu', compute_type='int8')
    seg, _ = m.transcribe(wav, language='ar', word_timestamps=True)
    sp = [(float(w.start), float(w.end)) for s in seg for w in s.words if w.end > w.start]
    return sp

def speech_spans_silence(wav, db='-35dB', min_sil=0.12):
    r = subprocess.run(['ffmpeg', '-v', 'info', '-i', wav, '-af', f'silencedetect=noise={db}:d={min_sil}', '-f', 'null', '-'], capture_output=True, text=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout.strip())
    sil, cur = [], None
    for line in r.stderr.splitlines():
        m = re.search(r'silence_start: ([\d.]+)', line)
        if m: cur = float(m.group(1))
        m = re.search(r'silence_end: ([\d.]+)', line)
        if m and cur is not None: sil.append((cur, float(m.group(1)))); cur = None
    if cur is not None: sil.append((cur, dur))
    sp, t = [], 0.0
    for a, b in sil:
        if a - t > 0.05: sp.append((t, a))
        t = b
    if dur - t > 0.05: sp.append((t, dur))
    return sp

def merge(sp, gap=0.08):
    out = []
    for a, b in sorted(sp):
        if out and a - out[-1][1] < gap: out[-1] = (out[-1][0], max(out[-1][1], b))
        else: out.append((a, b))
    return out

def main():
    args = sys.argv[1:]
    pair = 2
    if '--pair' in args:
        i = args.index('--pair'); pair = int(args[i + 1]); del args[i:i + 2]
    wav, txt, out = args
    text = open(txt, encoding='utf-8').read()
    words = [w for w in re.sub(r'[؟?!.,،:;\-"“”()]', ' ', text).replace('…', ' ').split() if w]
    try:
        sp = speech_spans_whisper(wav); how = 'whisper timeline'
    except Exception as e:
        sp = speech_spans_silence(wav); how = 'silence-detect timeline (' + type(e).__name__ + ')'
    sp = merge(sp)
    total = sum(b - a for a, b in sp)
    w_chars = [max(1, len(w)) for w in words]
    n = sum(w_chars)
    def real(u):  # speech-time -> real time
        for a, b in sp:
            if u <= b - a + 1e-9: return a + u
            u -= (b - a)
        return sp[-1][1]
    res, acc = [], 0.0
    for w, c in zip(words, w_chars):
        u0 = total * acc / n; acc += c; u1 = total * acc / n
        res.append({'text': w, 'start': round(real(u0), 3), 'end': round(real(u1), 3)})
    caps = [res[k:k + pair] for k in range(0, len(res), pair)]
    json.dump({'words': res, 'captions': caps}, open(out, 'w'), ensure_ascii=False)
    print(f'{len(words)} words aligned on {how}; speech {total:.2f}s; last word ends {res[-1]["end"]:.2f}s')

main()
