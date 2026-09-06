import {BARRAGES,type BarrageId} from './barrages';
import type {StoryPhaseId} from './chapter';
export const STORY_SCENES = ['arrival','prison','shuriken','hunter','bridge','sacrifice','hesitation','interception','gato','snow'] as const;
export type StorySceneId = typeof STORY_SCENES[number];
export interface DebugEntry {id:string;label:string;kind:'fight'|'scene';barrage?:BarrageId;phase:StoryPhaseId;scene?:StorySceneId;}
export const DEBUG_ENTRIES:DebugEntry[] = [
 ...Object.values(BARRAGES).map(b=>({id:b.id,label:`Barrage · ${b.name}`,kind:'fight' as const,phase:b.boss==='zabuza'?'mist' as const:'mirrors' as const,barrage:b.id})),
 {id:'fight-mist',label:'Kakashi · Assassin of the Mist',kind:'fight',phase:'mist'},
 {id:'fight-rescue',label:'Naruto + Sasuke · Rescue Kakashi',kind:'fight',phase:'rescue'},
 {id:'fight-mirrors',label:'Sasuke · Crystal Ice Mirrors',kind:'fight',phase:'mirrors'},
 {id:'fight-seal',label:'Naruto · The Broken Seal',kind:'fight',phase:'seal'},
 ...([
 ['arrival','Team 7 meets Zabuza','mist'],['prison','Kakashi in the water prison','mist'],
 ['shuriken','Shuriken teamwork and rescue','rescue'],['hunter','The hunter-nin deception','copy'],
 ['bridge','The bridge and ice mirrors','protect'],['sacrifice','Sasuke falls · Naruto awakens','mirrors'],
 ['hesitation','Haku unmasks · Naruto hesitates','seal'],['interception','Haku intercepts Lightning Blade','lightning'],
 ['gato','Gato’s betrayal · Zabuza’s final stand','lightning'],['snow','Together in the snow','lightning'],
 ] as [StorySceneId,string,StoryPhaseId][]).map(([scene,label,phase])=>({id:scene,label,kind:'scene' as const,phase,scene})),
];
