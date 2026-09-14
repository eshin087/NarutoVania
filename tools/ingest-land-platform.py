"""Pack the three approved directional strips with stable scale and measured roots."""
import argparse,importlib.util,json
from pathlib import Path
import numpy as np
from PIL import Image
spec=importlib.util.spec_from_file_location('packing','tools/ingest-platform-art.py')
packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
parser=argparse.ArgumentParser();parser.add_argument('--source-dir',required=True);args=parser.parse_args();base=Path(args.source_dir)
sources={'kakashi':('exec-1fa0db92-4b36-4cf3-980a-5fcd9b827e98.png',.56,230),'naruto':('exec-9f39a772-5edb-401f-a16b-9afdcad0a810.png',.53,200),'sasuke':('exec-4e1507a3-781a-471c-9ac0-4c7400433afe.png',.545,200)}
out=Path('public/art-platform');out.mkdir(exist_ok=True)
records={}
for name,(source,scale,virtual) in sources.items():
    a=np.array(Image.open(base/source).convert('RGBA'));rgb=a[:,:,:3].astype(int)
    bg=(rgb[:,:,0]>150)&(rgb[:,:,2]>130)&(rgb[:,:,1]<rgb[:,:,0]*.65)&(rgb[:,:,1]<rgb[:,:,2]*.7)
    a[bg,3]=0
    parts=packing.components(a[:,:,3]>0,2500);bodies=[]
    for row in range(3):bodies+=sorted([p for p in parts if row*1024/3<=(p[1][1]+p[1][3])/2<(row+1)*1024/3],key=lambda p:p[1][0])
    assert len(bodies)==18,(name,len(bodies))
    sheet=Image.new('RGBA',(2304,1344));frames=[]
    for i,(_,box,ids) in enumerate(bodies):
        x0,y0,x1,y1=box;row,col=divmod(i,6);region=a[y0:y1,x0:x1].copy()
        member=np.zeros(a.shape[:2],dtype=bool);member.ravel()[ids]=True;region[~member[y0:y1,x0:x1],3]=0
        crop=Image.fromarray(region);px=(384-crop.width)//2;py=40
        assert crop.width<364 and crop.height<388,(name,i,crop.size)
        sheet.alpha_composite(crop,(col*384+px,row*448+py))
        # Upper face rather than total silhouette defines the airborne root.
        body=region[:,:,:3].astype(int);alpha=region[:,:,3]>0
        skin=(body[:,:,0]>140)&(body[:,:,1]>95)&(body[:,:,0]-body[:,:,1]>8)&(body[:,:,1]-body[:,:,2]>8)&alpha
        faces=packing.components(skin,30)
        face=min(faces,key=lambda p:p[1][1])[1]
        head=[(face[0]+face[2])/2,face[1]+10]
        if row==2:root=[head[0],head[1]+virtual]
        else:
            low=alpha.copy();low[:-16]=False;yy,xx=np.where(low);root=[(int(xx.min())+int(xx.max()))/2,crop.height]
        frames.append({'index':i,'rect':[col*384,row*448,384,448],'root':[px+root[0],py+root[1]],'head':[px+head[0],py+head[1]],'scale':scale,'sourceRect':box,'contactFrame':2})
    sheet.save(out/f'{name}.webp',lossless=True)
    records[name]={'file':f'/art-platform/{name}.webp','frames':frames,'scale':scale,'bodyReference':{'kakashi':157,'naruto':125,'sasuke':128}[name]}
(out/'manifest.json').write_text(json.dumps(records,indent=2))
print('Packed 54 frames with isolated transparent backgrounds.')
