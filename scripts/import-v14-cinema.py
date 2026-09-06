from pathlib import Path
from PIL import Image
import json,shutil
folder=Path('C:/Users/eshin/.codex/visualizations/2026/09/05/01a0700e-9aab-7040-b123-d472c87e3925/v14-cinema-art/normalized')
d=json.loads((folder/'manifest.json').read_text())
Path('art/v14/cinema-sources.json').write_text(json.dumps(d,indent=2))
for a in d['assets']:
 im=Image.open(folder/(a['name']+'.png'));a['file']=a['name']+'.webp';im.save(Path('public/art-v14')/a['file'],lossless=True)
 for f in a['frames']:
  f['rootAnchor'][1]=f['inkBounds'][3]-1
 if a['name'].startswith('ultimate'):a['bodyReferences']=[204,194,194,194,190]
 elif a['name']=='teamwork':a['bodyReferences']=[238,218,222,238]
 elif a['name']=='reactions':a['bodyReferences']=[215,226,223,232]
 a.pop('path',None);a.pop('source',None)
d.pop('prompts',None)
Path('public/art-v14/cinema-manifest.json').write_text(json.dumps(d,indent=2))

