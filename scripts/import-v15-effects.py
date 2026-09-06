from pathlib import Path
from PIL import Image
import json,shutil
source=Path('C:/Users/eshin/.codex/visualizations/2026/09/05/01a0700e-9aab-7040-b123-d472c87e3925/v15-effects')
target=Path('public/art-v15');target.mkdir(exist_ok=True)
archive=Path('art/v15');archive.mkdir(exist_ok=True)
shutil.copyfile(source/'water-effects-atlas.webp',target/'water.webp')
for name in ['water-effects-metadata.json','prompt.txt','normalize.py']:shutil.copyfile(source/name,archive/('effects-'+name))
wave=Image.open('public/art-v14/wave.webp').convert('RGBA');old=json.loads(Path('public/art-v14/fx-manifest.json').read_text())
anchors=[]
for f in old['textures']['wave']['frames']:
 x,y,w,h=f['rect'];a=wave.crop((x,y,x+w,y+h)).getchannel('A');rows=[sum(a.getpixel((xx,yy))>80 for xx in range(w)) for yy in range(h)];base=max(i for i,n in enumerate(rows) if n>=8);anchors.append((base+1)/h)
Path('public/art-v15/water-manifest.json').write_text(json.dumps({'cell':320,'groundAnchor':[160,282],'puddle':list(range(8)),'impact':list(range(8,16)),'waveGroundAnchors':anchors},indent=2),encoding='utf-8')
