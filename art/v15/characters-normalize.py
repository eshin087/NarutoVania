from PIL import Image,ImageDraw
import numpy as np, json, math
from collections import deque
from pathlib import Path
out=Path('C:/Users/eshin/.codex/visualizations/2026/09/05/01a0700e-9aab-7040-b123-d472c87e3925/v15-character-repairs')
im=Image.open(out/'raw.png').convert('RGB'); a=np.array(im); h,w=a.shape[:2]
grey=(a.max(2).astype(int)-a.min(2).astype(int)<15)&(a.min(2)>218)
mask=Image.fromarray((grey*255).astype('uint8')).copy(); ImageDraw.floodfill(mask,(0,0),128,thresh=0)
bg=np.array(mask)==128
# All outer grid spaces connect to the surrounding checker background.
rgba=np.dstack((a,np.where(bg,0,255).astype('uint8')))
clean=Image.fromarray(rgba); clean.save(out/'cleaned.png')
# Source frame cells deliberately follow visual gutters rather than assuming perfect generator spacing.
xs=[0,330,645,930,1254]; ys=[0,351,651,886,1254]
preview=Image.new('RGB',(1254,1254),'#536070'); preview.paste(clean,mask=clean.getchannel('A'))
d=ImageDraw.Draw(preview)
for x in xs: d.line((x,0,x,h),fill='#33ff88')
for y in ys: d.line((0,y,w,y),fill='#33ff88')
for y in range(0,h,25): d.text((0,y),str(y),fill='yellow')
preview.save(out/'cleanup-preview.jpg',quality=85)
print(json.dumps({'transparentPixels':int(bg.sum()),'totalPixels':h*w,'sourceAlpha':False}))

# Clear the four enclosed sword holes, preserving blade highlights.
for seed in [(256,298),(575,301),(849,302),(1101,301)]:
    if mask.getpixel(seed)==255: ImageDraw.floodfill(mask,seed,128,thresh=0)
bg=np.array(mask)==128
rgba=np.dstack((a,np.where(bg,0,255).astype('uint8')))
clean=Image.fromarray(rgba); clean.save(out/'cleaned.png')
rows=[
 {'name':'zabuza-guard','character':'zabuza','logicalHeight':167,'targetBodyMetric':71,'frames':['planted_guard_a','planted_guard_b','planted_guard_c','planted_guard_d'],'points':[((168,49),(159,165)),((490,50),(480,165)),((781,51),(771,164)),((1033,51),(1025,164))],'roots':[(154,323),(474,324),(765,324),(1023,324)]},
 {'name':'sasuke-reactions','character':'sasuke','logicalHeight':135,'targetBodyMetric':69,'frames':['forearm_shield','recoil','knee_collapse','supported_side_collapse'],'points':[((160,381),(170,494)),((408,396),(454,503)),((791,456),(755,560)),((1055,490),(1082,594))],'roots':[(175,601),(475,601),(765,604),(1080,607)]},
 {'name':'naruto-fury','character':'naruto','logicalHeight':132,'targetBodyMetric':72,'frames':['fury_lunge','fury_strike','fury_followthrough','fury_recover'],'points':[((225,696),(156,794)),((546,699),(477,788)),((842,700),(753,790)),((1126,729),(1073,814))],'roots':[(175,855),(500,855),(787,855),(1080,855)]},
 {'name':'kakashi-carry','character':'kakashi','logicalHeight':157,'targetBodyMetric':87,'frames':['supported_carry','carry_step','kneeling_lower','seated_set_down'],'points':[((157,919),(139,1062)),((466,918),(446,1062)),((785,979),(743,1105)),((1076,1005),(1026,1128))],'roots':[(154,1179),(464,1179),(757,1181),(1040,1180)]}
]
canvas=Image.new('RGBA',(1024,1024)); meta={'version':15,'sourcePath':'C:/Users/eshin/.codex/generated_images/01a078f0-8216-71d2-9244-46ac2ba46932/exec-3527171e-663a-425c-b2ad-19728b3b52cf.png','rawSize':[w,h],'normalizedSize':[1024,1024],'columns':4,'rows':4,'cellSize':[256,256],'anchor':[128,224],'direction':'right','method':'Manually inspected head-top to pelvis landmarks; Euclidean axis length excludes weapon, effects, and carried person. Target metric derived from visually measured reference standing head-plus-torso fraction. Whole frame uniformly resampled; feet/root anchored. Measurements are manual estimates, not segmentation-derived exact anatomical dimensions.','backgroundCleanup':'Boundary-connected near-neutral light checkerboard flood fill plus enclosed sword holes; foreground dark outlines and clothing interiors retained.','limitations':['Carry row uses an upright seated cradle; injured Zabuza is visually compact relative to standing Zabuza and is not independently rescaled.','Final carry frame sets Zabuza down seated, not fully supine.','Kakashi and carried Zabuza show slight three-quarter face rotation while action reads rightward.'],'frames':[]}
for r,row in enumerate(rows):
 strip=Image.new('RGBA',(1024,256))
 for c in range(4):
  bounds=(xs[c],ys[r],xs[c+1],ys[r+1]); crop=clean.crop(bounds); p1,p2=row['points'][c]; root=row['roots'][c]
  metric=math.dist(p1,p2); scale=row['targetBodyMetric']/metric
  resized=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS)
  offset=(round(128-(root[0]-bounds[0])*scale),round(224-(root[1]-bounds[1])*scale))
  cell=Image.new('RGBA',(256,256)); cell.alpha_composite(resized,offset); bbox=cell.getbbox()
  cell.save(out/(row['name']+'-'+str(c)+'.png')); canvas.alpha_composite(cell,(c*256,r*256)); strip.alpha_composite(cell,(c*256,0))
  meta['frames'].append({'index':r*4+c,'row':r,'column':c,'semantic':row['frames'][c],'character':row['character'],'logicalStandingHeight':row['logicalHeight'],'sourceCrop':bounds,'sourceRoot':root,'sourceHeadTorsoLandmarks':[p1,p2],'measuredSourceHeadTorsoPixels':round(metric,3),'normalizedHeadTorsoPixels':row['targetBodyMetric'],'uniformScale':round(scale,6),'destinationRoot':[128,224],'visibleBounds':bbox,'safePadding':{'left':bbox[0],'top':bbox[1],'right':256-bbox[2],'bottom':256-bbox[3]}})
 strip.save(out/(row['name']+'.webp'),lossless=True)
canvas.save(out/'normalized.png'); canvas.save(out/'normalized.webp',lossless=True)
(out/'metadata.json').write_text(json.dumps(meta,indent=2))
preview=Image.new('RGB',(1024,1024),'#536070'); preview.paste(canvas,mask=canvas.getchannel('A')); d=ImageDraw.Draw(preview)
for r,row in enumerate(rows):
 for c in range(4):
  d.text((c*256+8,r*256+7),row['frames'][c],fill='white'); d.line((c*256,r*256+225,(c+1)*256,r*256+225),fill='#748693'); d.ellipse((c*256+126,r*256+222,c*256+130,r*256+226),fill='#33ff88')
preview.save(out/'normalized-preview.jpg',quality=90)
print(json.dumps({'frames':16,'minimumPadding':min(min(f['safePadding'].values()) for f in meta['frames']),'normalizedAlphaExtrema':canvas.getchannel('A').getextrema(),'output':str(out)}))

