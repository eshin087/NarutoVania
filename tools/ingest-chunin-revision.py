"""Preserve generated anatomy; clean backgrounds and recell whole connected poses.
Run with the external ch2-revision-art directory. No per-frame silhouette resizing.
"""
from pathlib import Path
from collections import deque
import json, sys
import numpy as np
from PIL import Image, ImageDraw

SRC = Path(sys.argv[1])
OUT = Path('public/art-chunin')
manifest = json.loads((OUT / 'manifest.json').read_text())

def components(alpha):
    mask = alpha > 30
    seen = np.zeros(mask.shape, dtype=bool)
    result = []
    height, width = mask.shape
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]: continue
        queue = deque([(int(x), int(y))]); seen[y, x] = True; pixels = []
        while queue:
            px, py = queue.pop(); pixels.append((px, py))
            for nx, ny in ((px-1,py),(px+1,py),(px,py-1),(px,py+1)):
                if 0 <= nx < width and 0 <= ny < height and mask[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx] = True; queue.append((nx,ny))
        if len(pixels) > 10: result.append(np.array(pixels))
    return result

def ingest(name, filename, columns, rows, scale=None, clean=False, recell=False, bands=None, column_bands=None):
    raw = Image.open(SRC / filename).convert('RGBA')
    a = np.array(raw)
    if clean:
        rgb = a[:,:,:3].astype(float)
        # Checker tiles are cool neutral gray; warm sash, skin, sand and costume are retained.
        neutral = (rgb.max(2)-rgb.min(2) < 10) & (rgb.mean(2)>90)
        if name != 'guy-actions': neutral &= rgb.mean(2)<230
        if name in ['guy-actions','gaara-actions']:
            maskfile='chunin-guy-wrist-preservation.json' if name=='guy-actions' else 'chunin-gaara-ankle-preservation.json'
            masks=json.loads((Path('tools')/maskfile).read_text())
            preserve=Image.new('L',raw.size)
            draw=ImageDraw.Draw(preserve)
            for polygon in masks['polygons']: draw.polygon([tuple(p) for p in polygon['points']],fill=255)
            neutral &= np.array(preserve)==0
        # Flood only exterior checker pixels. White wraps are enclosed by ink outlines
        # and must remain connected to the hands, especially Guy's palm poses.
        exterior=np.zeros(neutral.shape,dtype=bool)
        pending=deque()
        if name=='gaara-actions':
            seeds=json.loads(Path('tools/chunin-gaara-background-seeds.json').read_text())
            for x,y in seeds['seeds']:
                if neutral[y,x]: exterior[y,x]=True; pending.append((x,y))
        for y in range(raw.height):
            for x in (0,raw.width-1):
                if neutral[y,x]: exterior[y,x]=True; pending.append((x,y))
        for x in range(raw.width):
            for y in (0,raw.height-1):
                if neutral[y,x] and not exterior[y,x]: exterior[y,x]=True; pending.append((x,y))
        while pending:
            x,y=pending.pop()
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0<=nx<raw.width and 0<=ny<raw.height and neutral[ny,nx] and not exterior[ny,nx]:
                    exterior[ny,nx]=True; pending.append((nx,ny))
        a[:,:,3][exterior] = 0
    a[:,:,3][a[:,:,3]<30] = 0
    cw, ch = raw.width//columns, raw.height//rows
    cellw, cellh = cw+128, (max(b-a for a,b in zip(bands,bands[1:])) if bands else ch)+96
    atlas = Image.new('RGBA', (cellw*columns, cellh*rows))
    frames=[]
    groups=[[] for _ in range(columns*rows)]
    if recell:
        for points in components(a[:,:,3]):
            if name=='guy-actions' and len(points)<=1000: continue
            # A connected limb belongs to its torso's cell even if its foot crosses a grid line.
            center = np.median(points, axis=0)
            row = next((i for i in range(rows) if center[1] < bands[i+1]),rows-1) if bands else min(rows-1,int(center[1]//ch))
            cuts=column_bands.get(row) if column_bands else None
            col=next((i for i in range(columns) if center[0]<cuts[i+1]),columns-1) if cuts else min(columns-1,int(center[0]//cw))
            index = row*columns + col
            groups[index].append(points)
    for index in range(columns*rows):
        col,row=index%columns,index//columns
        if recell:
            if not groups[index]: raise ValueError(f'Missing pose {name}:{index}')
            # Sand VFX have their own atlas; disconnected grains must not move a body's feet.
            if name=='gaara-actions': groups[index]=[max(groups[index],key=len)]
            points=np.concatenate(groups[index]); xs,ys=points[:,0],points[:,1]
            box=(int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1))
            cell=Image.new('RGBA',(box[2]-box[0],box[3]-box[1]))
            ca=np.array(cell); ca[ys-box[1],xs-box[0]]=a[ys,xs]; cell=Image.fromarray(ca)
            # Stable baseline, center of original nominal cell retained for root continuity.
            dx=(cellw-cell.width)//2; dy=cellh-40-cell.height
        else:
            cell=Image.fromarray(a[row*ch:(row+1)*ch,col*cw:(col+1)*cw])
            box=cell.getchannel('A').getbbox() or (0,0,cw,ch)
            dx=48;dy=48
        if dy < 8 or dx < 8: raise ValueError(f'Pose needs more padding {name}:{index}')
        atlas.alpha_composite(cell,(col*cellw+dx,row*cellh+dy))
        local=atlas.crop((col*cellw,row*cellh,(col+1)*cellw,(row+1)*cellh))
        bounds=local.getchannel('A').getbbox()
        frame_scale = [.48,.56,.59,.65][row] if name=='lee-cinematic' else scale
        rootx=cellw/2 if recell else dx+cw/2
        if name=='gaara-actions':
            shoes=[p['shoeBounds'] for p in masks['polygons'] if p['frame']==index]
            if len(shoes)!=2: raise ValueError(f'Expected two measured sandals: {index}')
            # Anchor the stance, not the reach of an outstretched casting arm.
            rootx=dx+sum(s[0]+s[2] for s in shoes)/4-box[0]
        frames.append({'index':index,'rect':[col*cellw,row*cellh,cellw,cellh],
            'root':[rootx,bounds[3]],'head':[cellw/2,bounds[1]+20],
            'hand':[cellw/2+35,bounds[1]+65], 'opaqueBounds':list(bounds),
            'sourceBounds':list(box),'scale':frame_scale,'padding':40})
    atlas.save(OUT/(name+'.webp'),'WEBP',lossless=True)
    manifest['assets'][name]={'file':'/art-chunin/'+name+'.webp','width':atlas.width,'height':atlas.height,
        'columns':columns,'rows':rows,'frameWidth':cellw,'frameHeight':cellh,'frames':frames,
        'scale':scale,'source':filename,'cleanup':'neutral checker removal' if clean else 'alpha preserved',
        'timing':'six-frame authored contact sequence' if columns==6 else 'animated effect loop'}

ingest('lee-actions','lee-actions.png',6,4,.56,recell=True)
ingest('gaara-actions','gaara-actions-source-rgb.png',6,4,.58,clean=True,recell=True)
ingest('gates-aura','gates-aura.png',4,2,recell=True)
if (SRC/'sand-effects.png').exists():
    ingest('sand-effects','sand-effects.png',4,4,recell=True,bands=[0,240,478,734,1024],column_bands={0:[0,397,772,1166,1536]})
if (SRC/'lee-cinematic.png').exists():
    ingest('lee-cinematic','lee-cinematic.png',6,4,.63,recell=True,bands=[0,310,575,808,1024])
if (SRC/'guy-support-source-rgb.png').exists():
    ingest('guy-actions','guy-support-source-rgb.png',6,2,.46,clean=True,recell=True)
manifest['version']=2
manifest['revisionNotes']='2026-09-11: whole connected poses recelled with padding; no independent silhouette resizing. Source scale requires rendered comparison.'
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Ingested revision assets; rendered scale inspection required.')
