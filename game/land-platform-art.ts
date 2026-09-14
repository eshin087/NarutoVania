import type * as Phaser from 'phaser';
import manifest from '../public/art-platform/manifest.json';
import type {Combatant} from './combat-core';
import type {PlatformAttack} from './platform-combat';

export function preloadLandPlatform(scene:Phaser.Scene){for(const [id,record] of Object.entries(manifest))scene.load.image(`platform-${id}`,record.file);}
export function registerLandPlatform(scene:Phaser.Scene){for(const [id,record] of Object.entries(manifest))for(const f of record.frames){const [x,y,w,h]=f.rect;scene.textures.get(`platform-${id}`).add(String(f.index),0,x,y,w,h);}}
export function poseLandPlatform(sprite:Phaser.GameObjects.Sprite,p:Combatant,now:number){
  if(!p.action||!p.action.definition.id.startsWith('pf-')||now<p.hurtUntil||now<p.guardBrokenUntil)return;
  const record=manifest[p.id as keyof typeof manifest];if(!record)return;
  const def=p.action.definition as PlatformAttack;
  const row=def.art==='up'||def.art==='up-air'?0:def.art==='down'?1:def.art==='back-air'?2:def.art==='down-air'?3:-1;
  if(row<0)return;
  const contact=def.events.find(e=>e.kind==='hit')?.at||130,age=now-p.action.started;
  // Contact frame and combat event share the same clock, even for a charged smash.
  const frame=age<contact?Math.min(1,Math.floor(age/contact*2)):2+Math.min(3,Math.floor((age-contact)/Math.max(1,def.duration-contact)*4));
  const f=record.frames[row*6+frame];
  sprite.setTexture(`platform-${p.id}`,String(f.index)).setOrigin(p.action.facing<0?1-f.root[0]/384:f.root[0]/384,f.root[1]/448).setScale(f.scale).setFlipX(p.action.facing<0).setAngle(0);
}
