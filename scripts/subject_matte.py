#!/usr/bin/env python3
"""Subject isolation: cut a person out of a clip so 3D text/graphics can sit between the room and the person.
Usage: python3 scripts/subject_matte.py <name> <start_s> <end_s> <source.mp4>
Writes masks to /tmp/<name>/m. Then build an RGBA PNG sequence (1080x1920) into template/public/<seq>/%04d.png
and reference it from a Montage clip with the `behind` field.
Model: u2net_human_seg via rembg (light, ~1s/frame on CPU). BiRefNet-portrait is more precise but ~970MB and slow.
pip install rembg onnxruntime pillow
"""
import sys, os, subprocess, glob
from rembg import new_session, remove
from PIL import Image
name, a, b, src = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
d = f'/tmp/{name}'; os.makedirs(d + '/o', exist_ok=True); os.makedirs(d + '/m', exist_ok=True)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(a), '-t', str(b - a), '-i', src, '-r', '30', d + '/o/%04d.png'], check=True)
s = new_session('u2net_human_seg')
for f in sorted(glob.glob(d + '/o/*.png')):
    m = d + '/m/' + os.path.basename(f)
    if not os.path.exists(m):
        remove(Image.open(f).convert('RGB'), session=s, only_mask=True).save(m)
print('masks', len(glob.glob(d + '/m/*.png')))
