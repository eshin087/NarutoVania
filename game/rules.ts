export type Action='left'|'right'|'jump'|'melee'|'shuriken'|'clones'|'substitute'|'rasengan';
export type Bounds={x:number;y:number;w:number;h:number};
export type Surface={x:number;y:number;w:number};
export const TUNE={speed:340,jump:750,gravity:1800,coyote:115,jumpBuffer:140,health:100,chakra:100,chakraRegen:11,
 cloneCost:30,cloneCooldown:8,cloneLife:6,subCost:25,subCooldown:3,subDistance:165,subImmunity:750,
 shurikenCooldown:360,shurikenDamage:12,meleeDamage:[18,24,36],meleeDuration:[350,400,550],ultimateDamage:290,
 damageImmunity:850,enemyHealth:145,zabuzaHealth:2000,hakuHealth:1800,mirrorHealth:48} as const;
export function intersects(a:Bounds,b:Bounds){return a.x-a.w/2<b.x+b.w/2&&a.x+a.w/2>b.x-b.w/2&&a.y-a.h/2<b.y+b.h/2&&a.y+a.h/2>b.y-b.h/2;}
export function meleeBounds(x:number,y:number,facing:number,finisher=false):Bounds{return{x:x+facing*(finisher?68:52),y:y-6,w:finisher?142:112,h:114};}
export function canSpend(chakra:number,cooldown:number,cost:number){return chakra>=cost&&cooldown<=0;}
export function gainUltimate(current:number,damage:number){return Math.min(100,current+Math.max(0,damage)*.15);}
export function safeSubstituteX(x:number,feet:number,facing:number,surfaces:Surface[],min:number,max:number){
 for(const distance of [TUNE.subDistance,120,80,40,0]){
  const next=Math.max(min+30,Math.min(max-30,x-facing*distance));
  if(surfaces.some(s=>next>=s.x-s.w/2+22&&next<=s.x+s.w/2-22&&s.y>=feet-12&&s.y<=feet+150))return next;
 }return Math.max(min+30,Math.min(max-30,x));
}
export function damageResult(health:number,invulnerableUntil:number,now:number,damage:number){
 if(health<=0||now<invulnerableUntil||damage<=0)return{health,damage:0};
 const taken=Math.min(health,damage);return{health:health-taken,damage:taken};
}
export type PadLike={axes:readonly number[];buttons:readonly {pressed:boolean;value:number}[]};
export function gamepadActions(pad:PadLike):Set<Action>{
 const down=(i:number)=>!!pad.buttons[i]&&(pad.buttons[i].pressed||pad.buttons[i].value>.5);
 const actions=new Set<Action>();
 if((pad.axes[0]||0)<-.22||down(14))actions.add('left');if((pad.axes[0]||0)>.22||down(15))actions.add('right');
 const map: [number,Action][]=[[0,'jump'],[2,'melee'],[3,'shuriken'],[4,'clones'],[1,'substitute'],[5,'rasengan']];
 for(const [i,action]of map)if(down(i))actions.add(action);return actions;
}
export const STAGES={
 forest:{label:'THE MISTY PATH',objective:'Clear the path to the river'},
 zabuza:{label:'THE RIVER CLEARING',objective:'Defeat Zabuza Momochi'},
 bridge:{label:'THE GREAT NARUTO BRIDGE',objective:'Cross the bridge'},
 haku:{label:'THE ICE MIRROR PRISON',objective:'Defeat Haku'},
};
export const SURFACES:Surface[]=[
 {x:580,y:602,w:1160},{x:1530,y:602,w:460},{x:2300,y:602,w:840},{x:3350,y:602,w:1100},
 {x:4530,y:602,w:1260},{x:5470,y:602,w:380},{x:6280,y:602,w:1000},{x:7420,y:602,w:1280},
 {x:720,y:468,w:235},{x:1228,y:493,w:160},{x:1680,y:450,w:205},{x:1810,y:490,w:160},
 {x:2300,y:456,w:225},{x:2750,y:491,w:130},{x:5350,y:473,w:230},{x:5680,y:477,w:225},
 {x:6270,y:455,w:225},
];
export const WAVES=[{trigger:530,end:1040,spawns:[740,900,1030]}, {trigger:1860,end:2590,spawns:[2050,2320,2510]}, {trigger:5710,end:6520,spawns:[5940,6200,6450]}];
