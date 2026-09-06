from PIL import Image
from pathlib import Path
import json,shutil
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'art/v14/fx-sources.json').read_text(encoding='utf-8-sig'))
out=root/'public/art-v14';out.mkdir(exist_ok=True)
manifest={'version':14,'generation':'Built-in imagegen; original transparent output','textures':{}}
for key,source in data['sources'].items():
 im=Image.open(source).convert('RGBA');cols,rows=(8,6) if key=='chakra' else (4,4)
 # Raster cells are normalized without touching drawn colors or alpha.
 cw,ch=round(im.width/cols),round(im.height/rows)
 atlas=Image.new('RGBA',(cw*cols,ch*rows))
 frames=[]
 for i in range(cols*rows):
  x,y=i%cols,i//cols
  tile=im.crop((round(x*im.width/cols),round(y*im.height/rows),round((x+1)*im.width/cols),round((y+1)*im.height/rows))).resize((cw,ch),Image.Resampling.LANCZOS)
  atlas.paste(tile,(x*cw,y*ch))
  frames.append({'rect':[x*cw,y*ch,cw,ch],'anchor':[.5,.5],'contentBounds':tile.getbbox(),'contact':[.89,.5]})
 if key=='ice':
  bounds=[]
  for f in frames[12:16]:
   x,y,w,h=f['rect'];bounds.append(atlas.crop((x,y,x+w,y+h)).getchannel('A').point(lambda v:255 if v>45 else 0).getbbox())
  left,top=min(b[0] for b in bounds),min(b[1] for b in bounds)
  right,bottom=max(b[2] for b in bounds),max(b[3] for b in bounds)
  for f in frames[12:16]:
   x,y,w,h=f['rect'];f['rect']=[x+left,y+top,right-left,bottom-top]
 file=key+'.webp';atlas.save(out/file,lossless=True)
 manifest['textures'][key]={'file':file,'width':atlas.width,'height':atlas.height,'frames':frames}
(root/'public/art-v14/fx-manifest.json').write_text(json.dumps(manifest,indent=2))
print({k:len(v['frames']) for k,v in manifest['textures'].items()})

