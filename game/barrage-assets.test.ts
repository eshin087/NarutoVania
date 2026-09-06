import {it,expect} from 'vitest';
import {existsSync} from 'node:fs';
import audio from '../public/audio-v11/manifest.json';
import art from '../public/art-v11/reactions-manifest.json';
import {prepareVolley,spiritTarget} from './barrages';
it('places spirit endpoints below the arena so ground routes remain clear',()=>{for(const x of [92,780,1490])for(const origin of [240,1310]){const v=prepareVolley(origin>x?1:0,900,x,70,1520),target=spiritTarget(v,origin,592);expect(target.x).toBe((v.gap.left+v.gap.right)/2);expect(target.y).toBeGreaterThan(622);}});
it('ships single-source replacement cues with bounded decoded levels',()=>{const records=audio.records.filter(r=>r.file.startsWith('/audio-v11/'));expect(records.length).toBeGreaterThanOrEqual(29);for(const r of records){expect(existsSync('public'+r.file)).toBe(true);expect(r.layers).toHaveLength(1);expect(r.peakDb).toBeLessThan(-3);expect(r.clippedSamples).toBe(0);}for(const prefix of ['hit-palm','hit-kick','whoosh','parry'])expect(records.filter(r=>r.id===prefix||r.id.startsWith(prefix+'-'))).toHaveLength(3);});
it('ships 52 normalized directional hurt and sword frames',()=>{const textures=Object.values(art.textures);expect(textures.reduce((n,t)=>n+t.frames.length,0)).toBe(52);for(const t of textures){expect(existsSync('public/art-v11/'+t.file)).toBe(true);for(const f of t.frames){expect(f.pixelsToLogicalBody).toBeGreaterThan(0);expect(f.anchorPixels[1]).toBeLessThan(t.cellSize[1]);}}});

