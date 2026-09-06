from pathlib import Path
import json,shutil
source=Path('C:/Users/eshin/.codex/visualizations/2026/09/05/01a0700e-9aab-7040-b123-d472c87e3925/v15-character-repairs');target=Path('public/art-v15');archive=Path('art/v15')
shutil.copyfile(source/'revised-normalized.webp',target/'reactions.webp')
for name in ['metadata.json','prompt.txt','normalize.py']:shutil.copyfile(source/name,archive/('characters-'+name))
data=json.loads((source/'metadata.json').read_text());data['acceptedRows']=[0,1,2,3];data['replacementFrames']=json.loads((source/'replacement-metadata.json').read_text(encoding='utf-8'))['frames']
for name in ['replacement-metadata.json','replacement-prompt.txt']:shutil.copyfile(source/name,archive/name)
(target/'reactions-manifest.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
# Existing novel melee art is reduced relative to the restored standing reference,
# with corrections explicit on each frame (weapons/effect bounds never drive scale).
old=json.loads(Path('public/art-v14/character-manifest.json').read_text());values={'kakashi':.88,'naruto':.94,'naruto-awakened':.94,'sasuke':.94,'sakura':.92,'zabuza':.95,'haku-masked':.94,'haku-unmasked':.94}
scales={}
for atlas in old['assets']:
 if atlas['key'].endswith('-melee'):
  character=atlas['key'][:-6];scales[atlas['key']]=[{'frame':f['index'],'bodyScale':values[character],'footAnchor':f['footAnchor'],'basis':'side-by-side head/torso reference calibration; no weapon/effect bounds'} for f in atlas['frames']]
cinema=json.loads(Path('public/art-v14/cinema-manifest.json').read_text());cscales={}
for a in cinema['assets']:
 factor=.82 if a['name']=='carry' else .9 if a['name'].startswith('ultimate') else .94
 cscales[a['name']]=[{'frame':f['index'],'bodyScale':factor,'rootAnchor':f['rootAnchor']} for f in a['frames']]
(target/'body-calibration.json').write_text(json.dumps({'version':15,'reference':'pre-V14 locomotion frame6, natural per-character heights','status':'visual calibration, per-frame review required','characters':scales,'cinema':cscales},indent=2),encoding='utf-8')
