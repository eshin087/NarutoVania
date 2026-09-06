import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),ffmpeg=path.join(root,'work/audio-tools/node_modules/ffmpeg-static/ffmpeg.exe');
const source=path.join(root,'work/audio-v3'),output=path.join(root,'public/audio-v3');fs.mkdirSync(output,{recursive:true});
const old=JSON.parse(fs.readFileSync('public/audio/manifest.json','utf8'));
const index=JSON.parse(fs.readFileSync(path.join(source,'index.json'),'utf8'));
const selections={
  'hit-palm-1':['punch2a',.4], 'hit-palm-2':['punch2b',.4], 'hit-palm-3':['straight_punch',.5],
  'hit-kick-1':['kick1',.55], 'hit-kick-2':['heavy_punch1',.55], 'hit-heavy':['heavy_punch2',.75],
  'whoosh-1':['KungFu_swish1',.28], 'whoosh-2':['KungFu_swish2',.32], 'whoosh-3':['KungFu_swish3',.35],
  'sword-swish':['sword_attack1',.55], 'sword-hit':['cutting_with_a_katana1',.5],
  'guard':['defense1',.4], 'parry':['wow_katana1',.65], 'break':['damaged2',.75],
  'dash':['swish2_3',.32], 'tool':['shuriken_ninja_knifes1',.3], 'warning':['extracting_a_sword1',.55],
  'water':['water_land',.85], 'water2':['fall_in_water',.7], 'water-surge':['waterfall1',1.6,1],
  'ice':['small_ice1',.55], 'ice-break':['small_ice2',.75], 'fire':['fire1',1.1],
  'smoke':['disappearance1',.5], 'lightning':['lightning',1.6], 'focus':['reflection',.6],
  'ultimate-charge':['scifi_attack5',.65], 'ultimate-finish':['turning_kick',.8],
};
// Use only creator-linked material actually selected by fetch-combat-audio.
delete selections['sword-hit'];
function run(args){const r=spawnSync(ffmpeg,['-hide_banner','-y',...args],{encoding:'utf8',windowsHide:true});if(r.status)throw new Error(r.stderr);return r.stderr;}
const records=old.records.filter(r=>r.id.startsWith('music-')||r.id.startsWith('voice-')||r.id==='step');
for(const [id,[name,duration,start=0]]of Object.entries(selections)){
  const item=index.find(r=>r.name===name);if(!item)throw new Error(name);
  const file=path.join(output,`${id}.mp3`);
  const filter=`silenceremove=start_periods=1:start_threshold=-38dB:start_duration=0.002,atrim=duration=${duration},asetpts=PTS-STARTPTS,highpass=f=45,lowpass=f=11500,afade=t=in:d=0.002,afade=t=out:st=${Math.max(.08,duration-.09)}:d=0.09`;
  const analysis=run(['-ss',String(start),'-i',path.join(source,item.file),'-af',`${filter},volumedetect`,'-f','null','-']);
  const peak=Number(analysis.match(/max_volume: ([-\d.]+) dB/)?.[1]??0),gain=-5-peak;
  run(['-ss',String(start),'-i',path.join(source,item.file),'-af',`${filter},volume=${gain}dB,alimiter=limit=0.65:level=false`,'-ar','44100','-ac','1','-b:a','160k',file]);
  const stats=run(['-i',file,'-af','astats=metadata=1:reset=0','-f','null','-']);
  const decodedPeak=Number(stats.match(/Peak level dB: ([-\d.]+)/)?.[1]??0);
  if(decodedPeak>-.5)throw new Error(`Clipping ${id}`);
  records.push({id,file:`/audio-v3/${id}.mp3`,source:'taira',original:name,seconds:duration,peakDb:decodedPeak,
    edits:`${start}s start, ${duration}s max, 2ms attack / 90ms release fades, 45Hz highpass / 11.5kHz lowpass, peak normalized to -5dB, MP3 160kbps`,sourcePage:item.page});
}
const sources={...old.sources,taira:{title:"TK’S Free Sound FX — Fighting, Samurai / Ninja, Magic and Nature",author:'Taira Komori',url:'https://taira-komori.net/freesounden.html',license:'Royalty-free project use',licenseUrl:'https://taira-komori.net/freesounden.html',attribution:'Sound effects by Taira Komori. Used and edited within this game; individual sounds are not offered as a sound library.'}};
// Do not claim the replaced generic effect packs as sources for the new mix.
for(const key of ['rpg','water','electric','magic'])delete sources[key];
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({version:3,sources,records},null,2)+'\n');
console.log(JSON.stringify({effects:Object.keys(selections).length,recordings:records.length,peakMaxDb:Math.max(...records.map(r=>r.peakDb)),bytes:records.reduce((n,r)=>n+fs.statSync(path.join(root,'public',r.file)).size,0)}));
