import {describe,it,expect,vi} from 'vitest';
import {RecordedAudio} from './recorded-audio';
import manifest from '../public/audio-v9/manifest.json';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
describe('recorded audio revision',()=>{
 it('ships every selected clip and every pool choice with source attribution',()=>{
  const ids=new Set(manifest.records.map(r=>r.id));
  for(const pool of Object.values(manifest.pools)){expect(new Set(pool).size).toBeGreaterThanOrEqual(3);for(const id of pool)expect(ids.has(id)).toBe(true);}
  for(const r of manifest.records){expect(existsSync(resolve('public','.'+r.file))).toBe(true);}
  expect(Object.keys(manifest.sources).length).toBeGreaterThanOrEqual(4);
 });
 it('cancels a pending audition when the menu closes before decoding finishes',async()=>{
  const audio=new RecordedAudio(()=>({muted:false,musicVolume:.5,effectsVolume:.8,voiceVolume:.7}));let finish!:()=>void;
  vi.spyOn(audio,'unlock').mockReturnValue(new Promise<void>(r=>{finish=r;}));audio.buffers.set('parry',{} as AudioBuffer);
  const play=vi.spyOn(audio as unknown as {playBuffer:()=>void},'playBuffer').mockImplementation(()=>{});
  const pending=audio.audition('parry');await audio.audition('');finish();await pending;expect(play).not.toHaveBeenCalled();audio.destroy();
 });
});
