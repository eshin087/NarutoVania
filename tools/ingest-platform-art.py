"""Pack inspected generated directional poses; remove only approved baked backgrounds."""
import argparse, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

def components(mask, minimum=12):
    h,w=mask.shape; work=mask.copy().ravel(); found=[]
    for i in np.flatnonzero(work):
        if not work[i]: continue
        work[i]=False; queue=[int(i)]; points=[]
        while queue:
            p=queue.pop(); points.append(p); y,x=divmod(p,w)
            for q in ([p-1] if x else [])+([p+1] if x+1<w else [])+([p-w] if y else [])+([p+w] if y+1<h else []):
                if work[q]: work[q]=False; queue.append(q)
        if len(points)>=minimum:
            ids=np.array(points); yy,xx=np.divmod(ids,w)
            found.append((len(points),[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)],ids))
    return sorted(found,reverse=True,key=lambda x:x[0])

def pack(source, name, rows, scale, mode, dest):
    im=Image.open(source).convert('RGBA'); a=np.array(im); rgb=a[:,:,:3].astype(int)
    if mode=='magenta':
        bg=(rgb[:,:,0]>150)&(rgb[:,:,2]>130)&(rgb[:,:,1]<rgb[:,:,0]*.65)&(rgb[:,:,1]<rgb[:,:,2]*.7)
        a[bg,3]=0
    else:
        neutral=(rgb.max(2)-rgb.min(2)<20)&(rgb.min(2)>145)
        mask=Image.fromarray(neutral.astype('uint8')).copy()
        for seed in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]:
            if mask.getpixel(seed)==1: ImageDraw.floodfill(mask,seed,2)
        a[np.array(mask)==2,3]=0
    pieces=components(a[:,:,3]>0)
    bodies=sorted(pieces[:rows*6],key=lambda p:(round((p[1][1]+p[1][3])/2/(im.height/rows)-.5), (p[1][0]+p[1][2])/2))
    # Explicit row sorting tolerates unequal authored row bands and long kicks across nominal columns.
    bodies=[]
    for row in range(rows):
        candidates=[p for p in pieces if p[0]>2500 and row*im.height/rows <= (p[1][1]+p[1][3])/2 < (row+1)*im.height/rows]
        bodies+=sorted(candidates,key=lambda p:p[1][0])
    assert len(bodies)==rows*6, (name,len(bodies),[(p[0],p[1]) for p in pieces[:30]])
    sheet=Image.new('RGBA',(384*6,448*rows)); frames=[]
    for i,(_,box,ids) in enumerate(bodies):
        x0,y0,x1,y1=box; row,col=divmod(i,6)
        region=a[y0:y1,x0:x1].copy()
        member=np.zeros(a.shape[:2],dtype=bool); member.ravel()[ids]=True
        region[~member[y0:y1,x0:x1],3]=0
        crop=Image.fromarray(region); px=(384-crop.width)//2; py=40
        assert crop.width<=364 and crop.height<=388, (name,i,crop.size)
        sheet.alpha_composite(crop,(col*384+px,row*448+py))
        body=region[:,:,:3].astype(int); alpha=region[:,:,3]>0
        if name.startswith('gaara'):
            color=(body[:,:,0]>body[:,:,1]*1.28)&(body[:,:,0]>body[:,:,2]*1.08)&(body[:,:,0]>65)&alpha
            ys,xs=np.where(color)
            top=ys.min(); ys,xs=np.where(color&(np.indices(color.shape)[0]<top+68))
            head=[float(np.median(xs)),float(top+34)]
            air=(row==0 and col<4) or (row==1 and 1<=col<=4)
            virtual=320
        else:
            skin=(body[:,:,0]>140)&(body[:,:,1]>95)&(body[:,:,0]-body[:,:,1]>8)&(body[:,:,1]-body[:,:,2]>8)&alpha
            faces=components(skin,30)
            face=max(faces,key=lambda p:p[0])[1]
            head=[(face[0]+face[2])/2,face[1]+12]
            air=row>=2;virtual=240
        if air:
            root=[head[0],head[1]-35+virtual]
        else:
            low=alpha.copy();low[:-22]=False; yy,xx=np.where(low)
            root=[(int(xx.min())+int(xx.max()))/2,region.shape[0]]
        frames.append({'index':i,'rect':[col*384,row*448,384,448],
            'root':[round(px+root[0],2),round(py+root[1],2)],
            'head':[round(px+head[0],2),round(py+head[1],2)],'hand':[192,220],
            'scale':scale,'sourceRect':[x0,y0,x1-x0,y1-y0],
            'anchorMethod':'measured face and virtual body root' if air else 'lowest source foot support',
            'contactFrame':2})
    dest.mkdir(parents=True,exist_ok=True)
    sheet.save(dest/f'{name}.webp',lossless=True)
    return {'file':f'/art-chunin/{name}.webp','frameWidth':384,'frameHeight':448,'columns':6,'rows':rows,'scale':scale,'frames':frames}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--lee',required=True);p.add_argument('--gaara',required=True);args=p.parse_args()
    out=Path('public/art-chunin'); records={}
    records['lee-directional']=pack(args.lee,'lee-directional',4,.56,'checker',out)
    records['gaara-airborne']=pack(args.gaara,'gaara-airborne',3,.44,'magenta',out)
    Path('outputs').mkdir(exist_ok=True)
    Path('outputs/platform-art-metadata.json').write_text(json.dumps(records,indent=2))
    print(json.dumps({name:len(record['frames']) for name,record in records.items()}))
