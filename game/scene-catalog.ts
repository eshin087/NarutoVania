import {BARRAGES,VARIANT_NAMES,type BarrageId} from './barrages';
import type {StoryPhaseId} from './chapter';
export const STORY_SCENES = ['arrival','prison','shuriken','water-clash','hunter-needles','hunter-departure','hunter','bridge','sacrifice','hesitation','interception','gato','snow'] as const;
export type StorySceneId = typeof STORY_SCENES[number];
export interface DebugEntry {id:string;label:string;kind:'fight'|'scene';barrage?:BarrageId;variant?:0|1;phase:StoryPhaseId;scene?:StorySceneId;}
export const DEBUG_ENTRIES:DebugEntry[] = [
 ...Object.values(BARRAGES).flatMap(b=>([0,1] as const).map(variant=>({id:variant===0?b.id:`${b.id}-b`,label:`${b.name} · ${VARIANT_NAMES[b.id][variant]}`,kind:'fight' as const,phase:b.boss==='zabuza'?'mist' as const:'mirrors' as const,barrage:b.id,variant}))),
 {id:'fight-mist',label:'Kakashi · Assassin of the Mist',kind:'fight',phase:'mist'},
 {id:'fight-rescue',label:'Naruto + Sasuke · Rescue Kakashi',kind:'fight',phase:'rescue'},
 {id:'fight-mirrors',label:'Sasuke · Crystal Ice Mirrors',kind:'fight',phase:'mirrors'},
 {id:'fight-seal',label:'Naruto · The Broken Seal',kind:'fight',phase:'seal'},
 ...([
 ['arrival','Team 7 meets Zabuza','mist'],['prison','Kakashi in the water prison','mist'],
 ['shuriken','Shuriken teamwork and rescue','rescue'],['water-clash','Giant water-dragon clash','copy'],['hunter-needles','Haku’s three-needle intervention','copy'],['hunter-departure','Haku lifts and carries Zabuza away','copy'],['hunter','The hunter-nin deception','copy'],
 ['bridge','The bridge and ice mirrors','protect'],['sacrifice','Sasuke falls · Naruto awakens','mirrors'],
 ['hesitation','Haku unmasks · Naruto hesitates','seal'],['interception','Haku intercepts Lightning Blade','lightning'],
 ['gato','Gato’s betrayal · Zabuza’s final stand','lightning'],['snow','Together in the snow','lightning'],
 ] as [StorySceneId,string,StoryPhaseId][]).map(([scene,label,phase])=>({id:scene,label,kind:'scene' as const,phase,scene})),
];
