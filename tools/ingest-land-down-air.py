"""Append inspected downward aerial rows to the accepted directional atlases."""
import argparse,importlib.util,json
from pathlib import Path
import numpy as np
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('source');args=p.parse_args()
spec=importlib.util.spec_from_file_location('packing','tools/ingest-platform-art.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
a=np.array(Image.open(args.source).convert('RGBA'));rgb=a[:,:,:3].astype(int)
bg=(rgb[:,:,0]>150)&(rgb[:,:,2]>130)&(rgb[:,:,1]<rgb[:,:,0]*.65)&(rgb[:,:,1]<rgb[:,:,2]*.7);a[bg,3]=0
parts=packing.components(a[:,:,3]>0,2500)
heads=[[(171,126),(429,110),(686,135),(921,152),(1177,128),(1426,123)],[(169,480),(420,473),(670,484),(922,504),(1181,478),(1430,479)],[(163,786),(419,784),(666,796),(912,815),(1171,788),(1433,789)]]
out=Path('public/art-platform');manifest=json.loads((out/'manifest.json').read_text())
for row,name in enumerate(['kakashi','naruto','sasuke']):
    bodies=sorted([p for p in parts if row*1024/3<=(p[1][1]+p[1][3])/2<(row+1)*1024/3],key=lambda p:p[1][0]);assert len(bodies)==6
    sheet=Image.new('RGBA',(2304,1792));old=Image.open(out/f'{name}.webp');sheet.alpha_composite(old.crop((0,0,2304,1344)),(0,0))
    data=manifest[name];data['frames']=data['frames'][:18]
    for col,(_,box,ids) in enumerate(bodies):
        x0,y0,x1,y1=box;region=a[y0:y1,x0:x1].copy();member=np.zeros(a.shape[:2],dtype=bool);member.ravel()[ids]=True;region[~member[y0:y1,x0:x1],3]=0
        crop=Image.fromarray(region);px=(384-crop.width)//2;py=40;assert crop.height<388 and crop.width<364
        sheet.alpha_composite(crop,(col*384+px,1344+py));hx,hy=heads[row][col];head=[px+hx-x0,py+hy-y0]
        data['frames'].append({'index':18+col,'rect':[col*384,1344,384,448],'root':[head[0],head[1]+(230 if name=='kakashi' else 200)],'head':head,'scale':data['scale'],'sourceRect':box,'contactFrame':2})
    sheet.save(out/f'{name}.webp',lossless=True)
(out/'manifest.json').write_text(json.dumps(manifest,indent=2));print('Appended 18 downward aerial frames.')
