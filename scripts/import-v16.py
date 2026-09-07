from pathlib import Path
from PIL import Image
import json
dst=Path('public/art-v16');dst.mkdir(exist_ok=True);archive=Path('art/v16');archive.mkdir(exist_ok=True)
src=Path('C:/Users/eshin/.codex/generated_images/01a0700e-9aab-7040-b123-d472c87e3925/exec-ed070d70-2883-4af9-a725-da605a5013bc.png')
im=Image.open(src).convert('RGBA');box=im.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox();im=im.crop(box);im.save(dst/'mirror.webp',lossless=True)
(dst/'mirror.json').write_text(json.dumps({'sourceBounds':box,'size':list(im.size),'interior':[.14,.10,.72,.80],'note':'Measured inner rim; full generated border retained.'},indent=2))
manifest=json.loads(Path('public/art-v14/character-manifest.json').read_text());out={}
# Source head diameters approximately annotated from enlarged contact sheets. Root anchors stay
# on the original planted feet. Unlike pose height, these do not include weapons.
heads={'zabuza':[28,28,29,28,27,28,28,29,28,28,27,28,28,28,29,28,27,28,28,29,28,28,27,28,28,28,29,28,28,28,28,29,28,28,27,28],
 'naruto':[36,36,35,36,36,36,35,36,36,35,36,36,36,35,36,36,36,35,36,36,35,36,36,36,35,36,36,36,35,36,36,36,35,36,36,36]}
heights={'kakashi':157,'naruto':132,'naruto-awakened':132,'sasuke':135,'sakura':135,'zabuza':167,'haku-masked':146,'haku-unmasked':146}
old=json.loads(Path('public/art-v15/body-calibration.json').read_text())
for a in manifest['assets']:
 if not a['key'].endswith('-melee'):continue
 id=a['key'][:-6];rows=[]
 for f in a['frames']:
  i=f['index'];head=heads.get(id,heads.get('naruto') if id=='naruto-awakened' else None)
  target=20.5 if id=='zabuza' else 21.6
  scale=target/head[i] if head else heights[id]/240*old['characters'][a['key']][i]['bodyScale']
  ax,ay=f['footAnchor'];rows.append({'scale':scale,'foot':[ax,ay],'head':[ax+20,ay-210],'hand':[ax+65,ay-135], 'headDiameter':head[i] if head else None,'referenceHeadDiameter':target if head else None,'measurement':'approximate head diameter sampled from enlarged contact sheets; root from authored foot anchor'})
 out['v14-'+a['key']]=rows
# Preserve subsequent reviewed profiles when reimporting the mirror.
if not (dst/'body-frames.json').exists(): (dst/'body-frames.json').write_text(json.dumps(out,indent=2))
(archive/'mirror-prompt.txt').write_text('Built-in imagegen: complete upright cel-shaded cyan ice mirror, broad quiet interior, transparent background, no character, no text; full top and bottom borders. Generated 2026-09-06. Source '+str(src))
