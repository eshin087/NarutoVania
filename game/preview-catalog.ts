import type {CharacterId} from './combat-core';
import {CHARACTER} from './chapter';
export interface PreviewSpec{character:CharacterId;variant?:'awakened'|'unmasked';ultimate?:string;technique?:'sharingan'|'fireball'|'hounds'|'chakra-rush';}
export const PREVIEWS:{id:string;label:string;spec:PreviewSpec}[]=[
 {id:'technique-sharingan',label:'Sharingan · Eye and slow-time effects',spec:{character:'kakashi',technique:'sharingan'}},
 {id:'technique-hounds',label:'Hounds · Circle, bite and release',spec:{character:'kakashi',technique:'hounds'}},
 {id:'technique-fireball',label:'Great Fireball · Formation and impact',spec:{character:'sasuke',technique:'fireball'}},
 {id:'technique-chakra',label:'Chakra Rush · Complete flame tails',spec:{character:'naruto',technique:'chakra-rush',variant:'awakened'}},
 ...(['kakashi','naruto','sasuke','sakura','zabuza','haku'] as const).map(character=>({id:`animation-${character}`,label:`${CHARACTER[character].short} · Animation comparison`,spec:{character}})),
 {id:'animation-awakened',label:'Awakened Naruto · Animation comparison',spec:{character:'naruto',variant:'awakened'}},
 {id:'animation-unmasked',label:'Unmasked Haku · Animation comparison',spec:{character:'haku',variant:'unmasked'}},
 ...([{character:'kakashi',ultimate:'Chidori'},{character:'naruto',ultimate:'Clone Barrage'},{character:'naruto',variant:'awakened',ultimate:'Unsealed Fury'},{character:'sasuke',ultimate:'Sharingan Focus'},{character:'sakura',ultimate:'Resolve Counter'}] as PreviewSpec[]).map(spec=>({id:`ultimate-${spec.ultimate!.toLowerCase().replaceAll(' ','-')}`,label:`Ultimate · ${spec.ultimate}`,spec}))
];
