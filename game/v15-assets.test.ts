import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import calibration from '../public/art-v15/body-calibration.json';
import reactions from '../public/art-v15/reactions-manifest.json';
import {BODY_HEIGHT} from './presentation-v15';
import {CHARACTER} from './chapter';

describe('V15 asset integration contracts',()=>{
 it('uses the established natural character heights',()=>{
  for(const [id,height] of Object.entries(BODY_HEIGHT))expect(CHARACTER[id as keyof typeof BODY_HEIGHT].height).toBe(height);
 });
 it('accepts replacement guard and coordinated carry art with the other repaired rows',()=>{
  expect(reactions.acceptedRows).toEqual([0,1,2,3]);
  expect(reactions.replacementFrames.length).toBe(8);
  expect(fs.statSync('public/art-v15/reactions.webp').size).toBeGreaterThan(10000);
 });
 it('provides explicit positive body scale and anchor metadata for every choreography frame',()=>{
  for(const frames of Object.values(calibration.characters)){
   expect(frames.length).toBe(36);
   for(const [i,frame] of frames.entries()){
    expect(frame.frame).toBe(i);expect(frame.bodyScale).toBeGreaterThan(0);
    expect(frame.footAnchor.length).toBe(2);expect(frame.footAnchor.every(Number.isFinite)).toBe(true);
   }
  }
 });
});
