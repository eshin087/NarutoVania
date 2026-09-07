from pathlib import Path
import json,shutil
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SRC=Path('C:/Users/eshin/.codex/generated_images/01a07a05-f548-73a2-9faf-753e8c4f851e')
OUT=ROOT/'public/art-v21';OUT.mkdir(exist_ok=True)
( ROOT/'art/v21').mkdir(exist_ok=True)
shutil.copyfile('C:/Users/eshin/.codex/visualizations/2026/09/05/01a0700e-9aab-7040-b123-d472c87e3925/animation-art-prompts.json',ROOT/'art/v21/prompts.json')
manifest={'version':21,'notes':'Original imagegen transparent images; alpha bounds extracted with row-wise gutter detection; re-padded without scaling. Character scales referenced to established standing anatomy, not pose bounding height.','assets':{}}
for name,file,cols,rows,cw,ch in [('hounds','exec-655f2cff-0e0b-417d-9240-2458d5e682d5.png',8,3,320,320),('characters','exec-5d3f981a-6c41-426e-9f09-c8b5e0ae00d5.png',6,4,384,320),('effects','exec-3ee0190d-0622-41a9-becd-4430b0bdd311.png',8,4,320,320)]:
 im=Image.open(SRC/file).convert('RGBA');a=np.array(im);a[:,:,3][a[:,:,3]<8]=0;im=Image.fromarray(a);w,h=im.size
 atlas=Image.new('RGBA',(cw*cols,ch*rows));frames=[]
 for row in range(rows):
  top=round(row*h/rows);bottom=round((row+1)*h/rows);counts=(a[top:bottom,:,3]>24).sum(axis=0)
  cuts=[0]
  for j in range(1,cols):
   ideal=round(j*w/cols);span=range(max(cuts[-1]+20,ideal-42),min(w-1,ideal+43));cut=min(span,key=lambda x:counts[x]*100+abs(x-ideal));cuts.append(cut)
  cuts.append(w)
  for col in range(cols):
   x0,x1=cuts[col:col+2];cell=im.crop((x0,top,x1,bottom));bbox=cell.getbbox();assert bbox
   piece=cell.crop(bbox);pw,ph=piece.size;assert pw<cw-8 and ph<ch-8,(name,row,col,piece.size)
   dx=(cw-pw)//2;dy=ch-24-ph if name!='effects' else (ch-ph)//2
   atlas.alpha_composite(piece,(col*cw+dx,row*ch+dy))
   root=[dx+pw/2,dy+ph];head=[dx+pw/2,dy+12]
   if name=='characters':
    sourceBody=[242,245,239,230][row];scale=[146,157,167,125.4][row]/sourceBody
   elif name=='hounds':sourceBody=[150,175,188][row];scale=[.34,.39,.45][row]
   else:sourceBody=0;scale=1
   frames.append({'rect':[col*cw,row*ch,cw,ch],'contentBounds':[dx,dy,dx+pw,dy+ph],'root':root,'head':head,'hand':[dx+pw*.88,dy+ph*.38],'mouth':[dx+pw*.93,dy+ph*.3],'scale':scale,'sourceBodyHeight':sourceBody,'sourceRect':[x0+bbox[0],top+bbox[1],pw,ph],'row':row,'column':col})
 atlas.save(OUT/f'{name}.webp',lossless=True)
 manifest['assets'][name]={'file':f'{name}.webp','columns':cols,'rows':rows,'cell':[cw,ch],'frames':frames}
manifest['events']={'hounds':{'contact':3,'hold':[4,5],'release':6,'rest':7},'haku':{'recoil':0,'emerge':1,'fall':[2,3],'land':4,'recover':5},'capture':{'contact':2,'enclosed':3},'effects':{'chakra':[0,7],'lightning':[8,15],'dragon':[16,23],'prison':[24,31]}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print([(n,len(a['frames'])) for n,a in manifest['assets'].items()])

