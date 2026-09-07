from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
spec=json.loads((root/'art/v22/sources.json').read_text())['chakra'];im=Image.open(spec['path']).convert('RGBA');atlas=Image.new('RGBA',(384*8,384));frames=[]
for row in range(2):
 for col in range(4):
  i=row*4+col;x0,x1=spec['columnEdges'][row][col:col+2];y0,y1=spec['rowEdges'][row:row+2];piece=im.crop((x0,y0,x1,y1));scale=spec['scale'];piece=piece.resize((round(piece.width*scale),round(piece.height*scale)),Image.Resampling.LANCZOS)
  dx=round(192-(spec['sourceAnchorX'][col]-x0)*scale);dy=round(253-(spec['sourceGroundY'][row]-y0)*scale);cell=Image.new('RGBA',(384,384));cell.alpha_composite(piece,(dx,dy));atlas.alpha_composite(cell,(i*384,0));bbox=cell.getbbox();assert bbox and min(bbox[:2])>8 and max(bbox[2:])<376
  frames.append({'rect':[i*384,0,384,384],'contentBounds':list(bbox),'root':[192,253],'head':[192,192],'hand':[192,192],'mouth':[192,192],'scale':1,'row':0,'column':i,'sourceRect':[x0,y0,x1-x0,y1-y0]})
atlas.save(root/'public/art-v22/chakra.webp',lossless=True);path=root/'public/art-v22/manifest.json';data=json.loads(path.read_text());data['assets']['chakra']={'file':'chakra.webp','columns':8,'rows':1,'cell':[384,384],'frames':frames};data['events']['chakra']={'formation':[0,1],'flow':[2,3,4,5],'burst':6,'dissipate':7};path.write_text(json.dumps(data,indent=2));print('Imported complete chakra tails',atlas.size)
