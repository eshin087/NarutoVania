"""Ingest selected generated Chapter 2 artwork with stable atlas cells.
Only background cleanup/padding; never resize individual fighter silhouettes.
"""
from PIL import Image
from pathlib import Path
import json, sys
import numpy as np
src=Path(sys.argv[1]);out=Path('public/art-chunin');out.mkdir(exist_ok=True)
def process(name,dest,cols=1,rows=1,chroma=False):
 im=Image.open(src/name).convert('RGBA');a=np.array(im)
 if chroma:
  r,g,b=a[:,:,0].astype(float),a[:,:,1].astype(float),a[:,:,2].astype(float)
  magenta=(r>110)&(b>100)&(g<r*.6)&(g<b*.65)
  a[:,:,3][magenta]=0
  # Remove only near-magenta fringe, preserving orange warmers/skin/green fabric.
  fringe=(r>g*1.5)&(b>g*1.5)&(r+b>240)
  a[:,:,3][fringe]=0
 else:
  # Generated alpha has a low-coverage colored edge. Clear only sub-12% opacity noise.
  a[:,:,3][a[:,:,3]<30]=0
 im=Image.fromarray(a)
 w,h=im.size
 frames=[]
 if cols>1:
  cw,ch=w//cols,h//rows
  # Preserve a common source cell. Add padding to every frame, including hair/effect tips.
  atlas=Image.new('RGBA',(cols*(cw+32),rows*(ch+32)))
  for i in range(cols*rows):
   cell=im.crop((i%cols*cw,i//cols*ch,(i%cols+1)*cw,(i//cols+1)*ch))
   atlas.paste(cell,(i%cols*(cw+32)+16,i//cols*(ch+32)+16))
   bbox=cell.getchannel('A').getbbox() or (0,0,cw,ch)
   frames.append({'index':i,'rect':[i%cols*(cw+32),i//cols*(ch+32),cw+32,ch+32],'root':[cw/2+16,bbox[3]+16],'head':[cw/2+16,bbox[1]+22],'hand':[cw/2+65,bbox[1]+75],'opaqueBounds':list(bbox)})
  im=atlas
 im.save(out/dest,'WEBP',lossless=True)
 return {'file':'/art-chunin/'+dest,'width':im.width,'height':im.height,'columns':cols,'rows':rows,'frameWidth':im.width//cols,'frameHeight':im.height//rows,'frames':frames}
manifest={'version':1,'notes':'Generated art. Stable source-cell body scale; feet anchored by metadata; effects never determine body height. Uniform 16px cell padding. Chroma cleanup user-authorized.','assets':{}}
for filename,dest,key,c,r,chroma in [('lee-atlas-source.png','lee.webp','lee',6,4,True),('gaara-atlas-source.png','gaara.webp','gaara',6,4,False),('arena-source.png','arena.webp','arena',1,1,False),('reference.png','reference.webp','reference',1,1,False),('sand-atlas-source.png','sand.webp','sand',4,4,False),('lee-combo-source.png','lee-combo.webp','lee-combo',6,3,False),('lotus-gates-source.png','energy.webp','energy',4,2,False),('support-source.png','support.webp','support',4,2,False)]:
 if (src/filename).exists(): manifest['assets'][key]=process(filename,dest,c,r,chroma)
manifest['bodyScale']={'lee':.66,'gaara':.55,'lee-combo':.59,'lee-run':.62,'support':.39}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
print({k:(v['width'],v['height']) for k,v in manifest['assets'].items()})
