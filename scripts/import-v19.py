from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np

import json
src=Path('C:/Users/eshin/.codex/generated_images/01a0700e-9aab-7040-b123-d472c87e3925/exec-14911cc3-1568-4683-a46d-b7733298fa76.png')
im=Image.open(src).convert('RGBA');a=np.asarray(im).copy();rgb=a[:,:,:3].astype(int);background=(rgb.min(2)>224)&((rgb.max(2)-rgb.min(2))<14);mask=Image.fromarray((~background).astype('uint8')*255).copy();ImageDraw.floodfill(mask,(0,0),128);solid=np.asarray(mask)!=128;a[:,:,3]=solid*255;im=Image.fromarray(a)
dst=Path('public/art-v19');dst.mkdir(exist_ok=True);out=Image.new('RGBA',(3072,1152));scale=211/244;frames=[]
# Annotated local source palms, matching the release/catch phases.
hands=[(125,191),(381,211),(719,128),(1003,158),(1218,175),(1427,194),(123,516),(382,513),(651,515),(917,512),(1173,516),(1433,516),(218,808),(440,774),(665,784),(908,806),(1145,824),(1405,835)]
for i in range(18):
 actual=16 if i==15 else i # reject generated post-catch cell with missing sword
 col=actual%6;row=actual//6;x0=col*256;y0=[0,340,682][row];x1=(col+1)*256;y1=[340,682,1024][row]
 if actual in [2,14]:x1=854 if actual==2 else 802
 if actual==3:x0=806
 c=im.crop((x0,y0,x1,y1));arr=np.asarray(c).copy()
 if actual==2:arr[(np.indices(arr.shape[:2])[1]+x0>=800)&(np.indices(arr.shape[:2])[0]+y0>=160),3]=0;c=Image.fromarray(arr)
 # Planted boot anchors exclude metallic sword pixels.
 rr=arr[:,:,:3].astype(int);mask=(arr[:,:,3]>0)&(rr[:,:,2]>rr[:,:,0]*1.2)&(rr[:,:,2]>rr[:,:,1]*1.06)&(rr[:,:,2]<150)
 yy,xx=np.where(mask);bottom=int(yy.max())+1;low=xx[yy>=bottom-6];rootx=(float(low.min())+float(low.max()))/2
 resized=c.resize((round(c.width*scale),round(c.height*scale)),Image.Resampling.LANCZOS);ox=round(256-rootx*scale);oy=round(320-bottom*scale);out.alpha_composite(resized,((i%6)*512+ox,(i//6)*384+oy))
 hx,hy=hands[actual];hand=[round((hx-x0-rootx)*scale,3),round((hy-y0-bottom)*scale,3)]
 frames.append({'index':i,'rect':[(i%6)*512,(i//6)*384,512,384],'handRelativeToFeet':hand,'anchor':[256,320],'sourceRect':[x0,y0,x1,y1],'sourceFoot':[rootx,bottom],'sourceScale':scale,'weaponHeld':i<3 or i>=14})
out.save(dst/'zabuza-sword.webp',lossless=True)
m=json.loads(Path('public/art-v10/sword-manifest.json').read_text());m['atlas']='zabuza-sword.webp';m['baseHeight']=211;m['frames']=frames;m['generation']='imagegen matched to pre-V14 idle. Baked background removed, uniform anatomical scale; source cell15 rejected for missing held sword.';(dst/'sword-manifest.json').write_text(json.dumps(m,indent=2))
p=Path('public/art-v16/body-frames.json');d=json.loads(p.read_text());d['v10-sword']=[{'scale':167/211,'foot':[256,320],'hand':[256+f['handRelativeToFeet'][0],320+f['handRelativeToFeet'][1]]}for f in frames];p.write_text(json.dumps(d,indent=2)+'\n')
p=Path('game/art-v10.ts');s=p.read_text().replace('../public/art-v10/sword-manifest.json','../public/art-v19/sword-manifest.json').replace('`/art-v10/${sword.atlas}`','`/art-v19/${sword.atlas}`').replace('scale=CHARACTER.zabuza.height/sword.baseHeight*.92','scale=CHARACTER.zabuza.height/sword.baseHeight');p.write_text(s)
Path('art/v19').mkdir(exist_ok=True);Path('art/v19/sword-generation.txt').write_text('Source: '+str(src)+'\nPrompt: replace Zabuza throw/catch atlas using repeated idle reference; tan bare chest, no harness, striped forearm/calf wraps, navy cloth, consistent body; 6x3 cells. Row1 throw/release, row2 weaponless, row3 catch/recovery. Generated 2026-09-06. Cell15 missing blade rejected; reuse correct held-blade recovery cell16. Alpha background cleanup and uniform atlas normalization authorized.\n')

