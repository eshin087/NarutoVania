from PIL import Image, ImageFilter
import numpy as np
import json, shutil
from pathlib import Path
root=Path(__file__).parent
source=Path('C:/Users/eshin/.codex/generated_images/01a078f0-22ec-77c2-ad51-127214e9b8c3/exec-61de77ae-f215-49e0-9996-69be0f2366c2.png')
root.mkdir(parents=True,exist_ok=True)
shutil.copy2(source,root/'water-effects-source.png')
im=Image.open(source).convert('RGBA')
out=Image.new('RGBA',(1280,1280))
frames=[]
for i in range(16):
    r,c=divmod(i,4)
    rect=(round(c*im.width/4),round(r*im.height/4),round((c+1)*im.width/4),round((r+1)*im.height/4))
    if i==3: rect=(940,0,1254,285)
    if i==7: rect=(940,290,1254,627)
    cell=im.crop(rect); a=np.array(cell); mask=a[:,:,3]>=100
    seen=np.zeros(mask.shape,bool); keep=np.zeros(mask.shape,bool)
    h,w=mask.shape
    for y,x in zip(*np.where(mask)):
        if seen[y,x]: continue
        seen[y,x]=True; stack=[(int(y),int(x))]; group=[]
        while stack:
            yy,xx=stack.pop(); group.append((yy,xx))
            for dy,dx in ((0,1),(0,-1),(1,0),(-1,0)):
                ny,nx=yy+dy,xx+dx
                if 0<=ny<h and 0<=nx<w and mask[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx]=True; stack.append((ny,nx))
        if len(group)>=24:
            for yy,xx in group: keep[yy,xx]=True
    cleanmask=Image.fromarray(keep.astype('uint8')*255).filter(ImageFilter.MaxFilter(3))
    a[:,:,3]=np.minimum(a[:,:,3],np.array(cleanmask))
    clean=Image.fromarray(a); bounds=clean.getbbox(); content=clean.crop(bounds)
    content=content.resize((round(content.width*.78),round(content.height*.78)),Image.Resampling.LANCZOS)
    # Final frame anchor is identical for all frames: center x 160, ground y 282.
    dx=160-content.width//2; dy=282-content.height
    frame=Image.new('RGBA',(320,320)); frame.alpha_composite(content,(dx,dy))
    frame.save(root/f'water-effect-{i:02}.png')
    out.alpha_composite(frame,(c*320,r*320))
    frames.append({'index':i,'sequence':'puddleGather' if i<8 else 'waterImpact','sequenceIndex':i%8,'rect':[c*320,r*320,320,320],'anchor':[160,282],'anchorNormalized':[.5,.88125],'sourceRect':[rect[0],rect[1],rect[2]-rect[0],rect[3]-rect[1]],'sourceContentBounds':list(bounds),'contentRect':[dx,dy,content.width,content.height]})
out.save(root/'water-effects-atlas.png')
out.save(root/'water-effects-atlas.webp',lossless=True)
meta={'generator':'built-in image_gen','sourcePath':str(source),'atlas':'water-effects-atlas.png','atlasWebp':'water-effects-atlas.webp','width':1280,'height':1280,'columns':4,'rows':4,'frameWidth':320,'frameHeight':320,'anchor':[160,282],'sequences':{'puddleGather':{'start':0,'count':8},'waterImpact':{'start':8,'count':8}},'cleanup':'Removed disconnected alpha noise components below 24 pixels at alpha >=100, retained one-pixel edge alpha around kept components, common 0.78 scale and ground anchor.','frames':frames}
(root/'water-effects-metadata.json').write_text(json.dumps(meta,indent=2),encoding='utf8')
preview=Image.new('RGBA',out.size,(54,59,68,255)); preview.alpha_composite(out); preview.convert('RGB').resize((960,960)).save(root/'water-effects-preview.jpg',quality=92)
print(json.dumps(meta))
