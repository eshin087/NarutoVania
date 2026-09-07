from pathlib import Path
from PIL import Image
import json
out={};m=json.loads(Path('public/art-v2/manifest.json').read_text())
def add(key,file,frames):
 im=Image.open(file).convert('RGBA');entries=[]
 for f in frames:
  x,y,w,h=f['rect'];a=im.crop((x,y,x+w,y+h)).getchannel('A');b=a.point(lambda a:255 if a>32 else 0).getbbox();entries.append(list(b) if b else [0,0,w,h])
 out[key]=entries
for id,c in m['characters'].items():
 for sheet,s in c['sheets'].items():add(id+'-'+sheet,'public/art-v2/'+s.get('file','haku-unmasked-'+sheet+'.png'),s['frames'])
for sheet,s in m['variants']['unmasked']['sheets'].items():add('haku-unmasked-'+sheet,'public/art-v2/'+s.get('file','haku-unmasked-'+sheet+'.png'),s['frames'])
for a in json.loads(Path('public/art-v14/character-manifest.json').read_text())['assets']:add('v14-'+a['key'],'public/art-v14/'+a['file'],a['frames'])
Path('public/art-v16/visible-bounds.json').write_text(json.dumps(out))
