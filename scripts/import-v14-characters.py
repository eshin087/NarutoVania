from pathlib import Path
from PIL import Image
import json, shutil
source=Path('C:/Users/eshin/.codex/visualizations/2026/09/05/01a0700e-9aab-7040-b123-d472c87e3925/v14-character-art')
target=Path('public/art-v14'); target.mkdir(exist_ok=True)
assets=json.loads((source/'atlas-manifest.json').read_text(encoding='utf-8'))
for atlas in assets:
    image=Image.open(atlas['path']).convert('RGBA')
    image=image.resize((atlas['columns']*384,atlas['rows']*384),Image.Resampling.LANCZOS)
    atlas['file']=atlas['key']+'.webp'; image.save(target/atlas['file'],quality=94,method=6)
    atlas.pop('path'); atlas['cellSize']=384;atlas['width']=image.width;atlas['height']=image.height;atlas['standingBodyHeight']=240
    for frame in atlas['frames']:
        frame['rect']=[int(n*.75) for n in frame['rect']]
        frame['footAnchor']=[n*.75 for n in frame['footAnchor']]
        frame['standingBodyHeight']=240
    atlas['sequences']=({'idle':list(range(6)),'run':list(range(6,14)),'land':[14,15]} if atlas['rows']==4 else {'comboA':[list(range(i*6,i*6+6)) for i in range(3)],'comboB':[list(range(18+i*6,24+i*6)) for i in range(3)],'contactFrame':3})
(target/'character-manifest.json').write_text(json.dumps({'version':14,'assets':assets},indent=2),encoding='utf-8')
shutil.copyfile(source/'sources.json',Path('art/v14/character-sources.json'))
print('Imported',len(assets),'character atlases')
