import type {CharacterId} from './combat-core';
import {CHARACTER} from './chapter';
export interface PreviewSpec{character:CharacterId;variant?:'awakened'|'unmasked';ultimate?:string;}
export const PREVIEWS:{id:string;label:string;spec:PreviewSpec}[]=[
 ...(['kakashi','naruto','sasuke','sakura','zabuza','haku'] as const).map(character=>({id:`animation-${character}`,label:`${CHARACTER[character].short} · Animation comparison`,spec:{character}})),
 {id:'animation-awakened',label:'Awakened Naruto · Animation comparison',spec:{character:'naruto',variant:'awakened'}},
 {id:'animation-unmasked',label:'Unmasked Haku · Animation comparison',spec:{character:'haku',variant:'unmasked'}},
 ...([{character:'kakashi',ultimate:'Chidori'},{character:'naruto',ultimate:'Clone Barrage'},{character:'naruto',variant:'awakened',ultimate:'Unsealed Fury'},{character:'sasuke',ultimate:'Sharingan Focus'},{character:'sakura',ultimate:'Resolve Counter'}] as PreviewSpec[]).map(spec=>({id:`ultimate-${spec.ultimate!.toLowerCase().replaceAll(' ','-')}`,label:`Ultimate · ${spec.ultimate}`,spec}))
];
