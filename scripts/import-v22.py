from pathlib import Path
import json,shutil
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/art-v22';OUT.mkdir(exist_ok=True)
ART=ROOT/'art/v22';ART.mkdir(exist_ok=True)
sources=json.loads((ART/'sources.json').read_text())
manifest={'version':22,'assets':{},'notes':'Imagegen sprites. Complete original silhouettes with padded cells. Stable sequence scale; body anatomy is independent of effect bounds and crouching height.'}
for name,spec in sources.items():
 if name=='chakra':continue
 im=Image.open(spec['path']).convert('RGBA');a=np.array(im);cols,rows=spec['grid'];w,h=im.size
 # Flood only the connected neutral background: protect enclosed pale costumes.
 if a[:,:,3].min()==255:
  from collections import deque
  rgb=a[:,:,:3].astype(int);neutral=(rgb.max(2)-rgb.min(2)<18)&(rgb.min(2)>175)
  seen=np.zeros((h,w),bool);todo=deque()
  for x in range(w):
   for y in [0,h-1]:
    if neutral[y,x]:seen[y,x]=True;todo.append((y,x))
  for y in range(h):
   for x in [0,w-1]:
    if neutral[y,x] and not seen[y,x]:seen[y,x]=True;todo.append((y,x))
  while todo:
   y,x=todo.popleft()
   for yy,xx in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
    if 0<=yy<h and 0<=xx<w and neutral[yy,xx] and not seen[yy,xx]:seen[yy,xx]=True;todo.append((yy,xx))
  a[seen,3]=0
 a[:,:,3][a[:,:,3]<12]=0;im=Image.fromarray(a)
 # Adaptive transparent gutters accommodate intact poses extending beyond nominal cells.
 ys=[0]
 for row in range(1,rows):
  ideal=round(row*h/rows);counts=(a[:,:,3]>32).sum(1);ys.append(min(range(max(ys[-1]+30,ideal-48),min(h-1,ideal+49)),key=lambda y:counts[y]*200+abs(y-ideal)))
 ys.append(h);ys=spec.get('rowEdges',ys);cw,ch=spec.get('cell',[384,384]);atlas=Image.new('RGBA',(cw*cols,ch*rows));frames=[]
 for row in range(rows):
  top,bottom=ys[row:row+2];counts=(a[top:bottom,:,3]>32).sum(0);xs=[0]
  for col in range(1,cols):
   ideal=round(col*w/cols);xs.append(min(range(max(xs[-1]+30,ideal-55),min(w-1,ideal+56)),key=lambda x:counts[x]*200+abs(x-ideal)))
  xs.append(w)
  for col in range(cols):
   x0,x1=xs[col:col+2];cell=im.crop((x0,top,x1,bottom));bbox=cell.getbbox();assert bbox,(name,row,col)
   piece=cell.crop(bbox);pw,ph=piece.size;assert pw<cw-16 and ph<ch-16,(name,row,col,piece.size)
   if name=='effects':
    # Preserve source-grid centers and dimensions through all frames.
    dx=64+x0+bbox[0]-col*w/cols;dy=64+top+bbox[1]-row*h/rows;root=[192,192]
   else:dx=(cw-pw)/2;dy=ch-30-ph;root=[cw/2,ch-30]
   dx,dy=round(dx),round(dy);atlas.alpha_composite(piece,(col*cw+dx,row*ch+dy))
   scales=spec.get('scales',[1]*rows);scale=scales[row]
   hand=[dx+pw*.85,dy+ph*.42];head=[dx+pw*.5,dy+ph*.10]
   mouth=[dx+pw*(.53 if col==2 else .88),dy+ph*(.27 if row==0 else .23)]
   frames.append({'rect':[col*cw,row*ch,cw,ch],'contentBounds':[dx,dy,dx+pw,dy+ph],'root':root,'head':head,'hand':hand,'mouth':mouth,'scale':scale,'row':row,'column':col,'sourceRect':[x0+bbox[0],top+bbox[1],pw,ph]})
 atlas.save(OUT/(name+'.webp'),lossless=True)
 manifest['assets'][name]={'file':name+'.webp','columns':cols,'rows':rows,'cell':[cw,ch],'frames':frames}
manifest['events']={'throw':{'release':2,'recover':5},'capture':{'contact':2,'hold':4},'hounds':{'leap':3,'bite':4,'hold':5,'release':6},'effects':{'eye':[0,7],'chakra':[8,15],'fire':[16,23]}}
manifest['bodyReferences']={'naruto':125.4,'sasuke':128.25,'sakura':135,'haku':146,'kakashi':157,'zabuza':167}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print([(n,len(a['frames'])) for n,a in manifest['assets'].items()])

if "chakra" in sources:
 import runpy
 runpy.run_path(str(ROOT/"scripts/import-v22-chakra.py"),run_name="__main__")
