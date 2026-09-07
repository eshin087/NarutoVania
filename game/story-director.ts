import {rescueScene,snowScene} from './story-scenes-v14';
import {dialogueDuration} from './presentation-v14';
import type {CinemaMotion} from './cinematic-v13';
import type {StorySceneId} from './scene-catalog';
import {PHASES, stateForPhase, type StoryPhaseId, type StoryState} from './chapter';

import type {AnimationName, CharacterId, EffectName} from './combat-core';

export type ActorId = CharacterId | `reflection-${number}` | 'tazuna' | 'gato' | 'hound1' | 'hound2' | 'hound3' | 'henchman1' | 'henchman2' | 'henchman3' | 'clone' | 'prisoner';

export interface CinemaActor {id: ActorId; x: number; y: number; facing: -1 | 1; animation: AnimationName; alpha?: number;}

export interface CinemaCue {

  at: number; motion?:CinemaMotion; actor?: ActorId; x?: number; y?: number; duration?: number; animation?: AnimationName;

  facing?: -1 | 1; alpha?: number; effect?: EffectName | 'prison' | 'shuriken' | 'mirrors' | 'aura' | 'snow' | 'mask';

  camera?: number; zoom?: number; fade?: 'in' | 'out';

  speech?: string; hold?: number; moment?: number; manga?:number; awaitAdvance?:boolean; caption?: string;

}

export interface CinemaClip {authored?:boolean;id: string; duration: number; arena: 'lakeside' | 'bridge'; offset?:number; actors: CinemaActor[]; cues: CinemaCue[];}

const actor = (id: ActorId, x: number, facing: -1 | 1 = 1, animation: AnimationName = 'idle', y = 590): CinemaActor => ({id, x, y, facing, animation});

export function introClip(phase: StoryPhaseId): CinemaClip {

  const data = PHASES[phase];

  if (phase !== 'mist') return {id: `${phase}-entry`, arena: data.arena, duration: 2400,

    actors: [actor(data.character, data.playerX), actor(data.boss, data.bossX, -1)], cues: [{at: 0, camera: 220, fade: 'in'}, {at: 400, camera: 140, duration: 1700}]};

  return {id: 'team-seven-arrives', arena: 'lakeside', duration: 12500,

    actors: [actor('kakashi', 370), actor('naruto', 225), actor('sasuke', 130), actor('sakura', 65), actor('tazuna', 15), actor('zabuza', 1230, -1)],

    cues: [{at: 0, fade: 'in', camera: 0}, {at: 500, actor: 'kakashi', x: 520, duration: 1600, animation: 'run'},

      {at: 900, actor: 'naruto', x: 340, duration: 1700, animation: 'run'}, {at: 950, actor: 'sasuke', x: 245, duration: 1800, animation: 'run'},

      {at:2500,motion:'arrival-sword'},

      {at: 3400, actor: 'naruto', animation: 'slide'}, {at: 3400, actor: 'sasuke', animation: 'slide'},

      {at: 4900, actor: 'zabuza', x: 980, duration: 1000, animation: 'dash'}, {at: 6300, camera: 230, duration: 1500},

      {at: 5400, actor: 'naruto', animation: 'idle'}, {at: 5400, actor: 'sasuke', animation: 'idle'}, {at: 7900, actor: 'kakashi', animation: 'cast', effect: 'smoke'}, {at: 9600, actor: 'kakashi', x: 600, duration: 1000, animation: 'run'}, {at: 11600, fade: 'out'}]};

}

export function outroClip(phase: StoryPhaseId): CinemaClip {

  const common = [actor('kakashi', 560), actor('zabuza', 950, -1), actor('naruto', 260), actor('sasuke', 180), actor('sakura', 90), actor('tazuna', 40)];

  switch (phase) {

    case 'mist': return {id: 'water-prison', arena: 'lakeside', duration: 11200, actors: common,

      cues: [{at:0,camera:190},{at:4700,actor:'naruto',x:420,duration:1500,animation:'run'},
        {at:5000,actor:'sasuke',x:340,duration:1200,animation:'run'},{at:6500,camera:80,duration:1600},
        {at:8200,actor:'naruto',animation:'cast',effect:'smoke'}]};

    case 'rescue': return rescueScene();

    case 'copy': return {id:'hunter-nin-deception',arena:'lakeside',duration:17700,
      actors:[actor('kakashi',370),actor('zabuza',1210,-1),actor('naruto',230),actor('sasuke',135),actor('sakura',75),actor('tazuna',25),actor('haku',1450,-1)],
      cues:[{at:0,camera:0},{at:600,actor:'kakashi',animation:'cast'},{at:600,actor:'zabuza',animation:'cast'},
       {at:900,motion:'dragon-clash'},{at:4200,actor:'kakashi',animation:'ultimate',motion:'counter-wave'},
       {at:8000,actor:'haku',facing:-1,animation:'cast',motion:'hunter-throw'},
       {at:10400,actor:'haku',x:1330,duration:700,animation:'run'},
       {at:12000,actor:'kakashi',x:900,duration:1100,animation:'run'},
       {at:14000,motion:'carry'},{at:16400,actor:'kakashi',animation:'idle'}]};

    case 'protect': return {id: 'simultaneous-bridge-battles', arena: 'bridge', duration: 9200,

      actors: [actor('sakura', 360), actor('tazuna', 220), actor('zabuza', 900, -1), actor('kakashi', 70), actor('sasuke', 1100), actor('haku', 1450, -1)],

      cues: [{at: 0, camera: 0}, {at: 600, actor: 'kakashi', x: 780, duration: 1500, animation: 'run'},

        {at: 2300, actor: 'kakashi', animation: 'light1', effect: 'parry'}, {at: 2400, actor: 'zabuza', animation: 'block'},

        {at: 3600, camera: 460, duration: 2500}, {at: 3500, actor: 'sasuke', x: 1340, duration: 700, animation: 'run'}, {at: 4400, actor: 'sasuke', animation: 'light2'},

        {at: 5000, actor: 'haku', animation: 'parry', effect: 'ice'}, {at: 6700, actor: 'haku', x: 1500, duration: 700, animation: 'airdash'}, {at: 7500, actor: 'haku', facing: -1}, {at: 8500, fade: 'out'}]};

    case 'mirrors': return {id: 'sasuke-protects-naruto', arena: 'bridge', duration: 17400,

      actors: [actor('sasuke', 710), actor('naruto', 590), actor('haku', 1230, -1)],

      cues: [{at: 0, camera: 280, effect: 'mirrors'}, {at: 700, actor: 'sasuke', animation: 'cast', effect: 'smoke'},

        {at: 2400, actor: 'haku', animation: 'cast', effect: 'ice'}, {at: 4000, actor: 'sasuke', animation: 'parry', effect: 'parry'},

        {at: 5300, actor: 'haku', facing: 1, x: 380, duration: 170, effect: 'ice'}, {at:6500,motion:'shield-needles'},





        {at: 10300, actor: 'naruto', facing: -1, x: 560, duration: 700, animation: 'guardbreak'}, {at: 12800, actor: 'naruto', animation: 'ultimate', effect: 'aura',motion:'awakening'},

        {at: 14400, actor: 'haku', x: 1170, duration: 500, animation: 'airdash'}, {at: 15000, actor: 'haku', facing: -1}, {at: 16500, fade: 'out'}]};

    case 'seal': return {id: 'narutos-hesitation', arena: 'bridge', duration: 13700,

      actors: [actor('naruto', 780), actor('haku', 1000, -1, 'guardbreak'), actor('sasuke', 430, 1, 'defeat'), actor('kakashi', 65), actor('zabuza', 225, -1)],

      cues: [{at: 0, camera: 500, actor: 'haku', effect: 'ice'}, {at: 900, actor: 'naruto', animation: 'heavy', effect: 'aura'},

        {at: 2200, actor: 'haku', animation: 'hurt',motion:'unmask'}, {at: 3900, actor: 'naruto', animation: 'idle'},

        {at: 6000, actor: 'naruto', x: 860, duration: 650, animation: 'run'}, {at: 7100, actor: 'naruto', animation: 'guardbreak'},

        {at: 8900, camera: 0, duration: 2300}, {at: 9500, actor: 'kakashi', animation: 'light1', effect: 'parry'},

        {at: 10300, actor: 'zabuza', animation: 'heavy'}, {at: 11200, actor: 'kakashi', animation: 'block'}, {at: 13000, fade: 'out'}]};

    case 'lightning': return {id: 'a-demon-in-the-snow', arena: 'bridge', duration: 36000,

      actors: [actor('kakashi', 500), actor('zabuza', 1080, -1), actor('haku', 1530, -1), actor('naruto', 740), actor('sasuke', 480, 1, 'defeat'),

        actor('sakura', 550, -1), actor('gato', 1610, -1), actor('hound1', 650), actor('hound2', 720), actor('hound3', 760), actor('henchman1', 1560, -1), actor('henchman2', 1615, -1), actor('henchman3', 1670, -1)],

      cues: [{at: 0, camera: 350}, {at: 600, actor: 'kakashi', animation: 'cast', effect: 'smoke'},

        {at: 1700, actor: 'hound1', x: 1030, duration: 850, animation: 'run'}, {at: 1750, actor: 'hound2', x: 1110, duration: 900, animation: 'run'},

        {at: 1800, actor: 'hound3', x: 1060, duration: 920, animation: 'run'}, {at: 2900, actor: 'zabuza', animation: 'guardbreak'},

        {at: 4400, actor: 'kakashi', animation: 'ultimate', effect: 'lightning'}, {at: 6300, actor: 'kakashi', x: 995, duration: 900, animation: 'dash'},

        {at: 6800, actor: 'haku', x: 1050, duration: 320, animation: 'airdash'}, {at:7300,actor:'kakashi',animation:'light1',effect:'lightning'}, {at: 7400, actor: 'haku', animation: 'hurt', effect: 'lightning',motion:'intercept'}, {at:7950,actor:'kakashi',animation:'block'},

        {at: 8900, actor: 'haku', animation: 'defeat'}, {at: 7400, actor: 'hound1', alpha: 0, effect: 'smoke'}, {at: 7400, actor: 'hound2', alpha: 0}, {at: 7400, actor: 'hound3', alpha: 0},

        {at: 11000, actor:'gato',alpha:1},
        {at:11000,actor:'henchman1',alpha:1,x:1330}, {at:11000,actor:'henchman2',alpha:1,x:1410}, {at:11000,actor:'henchman3',alpha:1,x:1550},
        {at: 11800, actor: 'gato', x: 1510, duration: 1000, animation: 'run'}, {at: 12900, actor: 'kakashi', x: 810, duration: 900, animation: 'run'},

        {at: 14000, actor: 'kakashi', facing: 1}, {at: 14900, actor: 'naruto', x: 930, facing:1, duration: 850, animation: 'run'}, {at: 16100, actor: 'zabuza', animation: 'guardbreak'},

        {at: 17900, actor: 'naruto', animation: 'cast'}, {at: 18700, actor: 'zabuza', facing:1, animation: 'heavy'},

        {at:19800,actor:'henchman1',animation:'hurt'}, {at:20000,actor:'henchman2',animation:'hurt'}, {at:20200,actor:'henchman3',animation:'hurt'},
        {at:19800,actor:'zabuza',facing:1,x:1270,duration:400,animation:'run'},
        {at:19800,camera:460,duration:1900},
        {at:20200,actor:'zabuza',animation:'heavy'},
        {at:20500,actor:'henchman1',animation:'defeat',effect:'impact'},
        {at:20600,actor:'zabuza',x:1350,duration:300,animation:'run'},
        {at:20900,actor:'zabuza',animation:'heavy'},
        {at:21200,actor:'henchman2',animation:'defeat',effect:'impact'},
        {at:21400,actor:'zabuza',x:1450,duration:300,animation:'run'},
        {at:21700,actor:'zabuza',animation:'heavy'},
        {at:22000,actor:'gato',x:1590,y:625,duration:600,animation:'defeat',effect:'impact'},
        {at:22400,actor:'henchman3',x:1770,duration:900,animation:'run'},
        {at:22600,actor:'zabuza',animation:'guardbreak'},
        {at:24200,actor:'zabuza',animation:'guardbreak'},

        {at: 25900, actor: 'kakashi', x: 1420, duration: 900, animation: 'run'}, {at: 27600, fade: 'out'},

        {at: 28900, actor: 'haku', x: 1120, y: 590, animation: 'defeat'}, {at: 28900, actor: 'zabuza', x: 1260, animation: 'defeat'},

        {at: 29100, actor: 'kakashi', x: 990, animation: 'idle'}, {at: 29300, effect: 'snow', fade: 'in', camera: 550},

        {at: 28900,actor:'naruto',x:830,facing:1,animation:'idle'},
        {at: 28900,actor:'sasuke',x:1430,animation:'defeat'}, {at:28900,actor:'sakura',x:1530,facing:-1,animation:'guardbreak'},
        {at:28900,actor:'henchman1',alpha:0},{at:28900,actor:'henchman2',alpha:0},{at:28900,actor:'henchman3',alpha:0},{at:28900,actor:'gato',alpha:0},
        {at: 30700, actor: 'sasuke', facing:-1, animation: 'hurt'}, {at: 34900, fade: 'out'}]};

  }

}



/** Both skipping and natural completion go through the same atomic state transition. */

export class StoryDirector {
 state:StoryState;mode:'fight'|'cinematic'|'complete'='fight';clip:CinemaClip|null=null;clock=0;
 emitted=new Set<number>();waiting=false;holdAge=0;private afterClip:(()=>void)|null=null;
 constructor(phase:StoryPhaseId,private callbacks:{enter:(state:StoryState)=>void;cinematic:(clip:CinemaClip)=>void;cue:(cue:CinemaCue)=>void;complete:()=>void;ready?:()=>boolean;transition?:(next:()=>void)=>void}){this.state=stateForPhase(phase);}
 start(viewIntro:boolean){
  if(this.state.phase==='copy'){this.startScene('hunter');return;}
  if(this.state.phase==='protect'){this.startScene('bridge');return;}
  if(this.state.phase==='lightning'){this.startScene('interception');return;}
  if(viewIntro)this.play(introClip(this.state.phase),()=>this.enter(this.state.phase));else this.enter(this.state.phase);
 }
 startScene(id:StorySceneId){
  switch(id){
   case 'arrival':this.state=stateForPhase('mist');this.play(introClip('mist'),()=>this.enter('mist'));break;
   case 'prison':this.state=stateForPhase('mist');this.play(outroClip('mist'),()=>this.enter('rescue'));break;
   case 'shuriken':this.state=stateForPhase('rescue');this.play(outroClip('rescue'),()=>this.startScene('hunter'));break;
   case 'water-clash':this.state=stateForPhase('copy');this.play(outroClip('copy'),()=>this.startScene('bridge'));break;
   case 'hunter-needles':this.state=stateForPhase('copy');this.play(hunterSegment(false),()=>this.startScene('bridge'));break;
   case 'hunter-departure':this.state=stateForPhase('copy');this.play(hunterSegment(true),()=>this.startScene('bridge'));break;
   case 'hunter':this.state=stateForPhase('copy');this.play(outroClip('copy'),()=>this.startScene('bridge'));break;
   case 'bridge':this.state=stateForPhase('protect');this.play(outroClip('protect'),()=>this.enter('mirrors'));break;
   case 'sacrifice':this.state=stateForPhase('mirrors');this.play(outroClip('mirrors'),()=>this.enter('seal'));break;
   case 'hesitation':this.state=stateForPhase('seal');this.play(outroClip('seal'),()=>this.startScene('interception'));break;
   case 'interception':this.state=stateForPhase('lightning');this.play(endingSegment(0),()=>this.startScene('gato'));break;
   case 'gato':this.state={...stateForPhase('lightning'),hakuIntercepted:true};this.play(endingSegment(1),()=>this.startScene('snow'));break;
   case 'snow':this.state={...stateForPhase('lightning'),hakuIntercepted:true};this.play(endingSegment(2),()=>this.complete());break;
  }
 }
 private enter(phase:StoryPhaseId){this.state=stateForPhase(phase);this.mode='fight';this.clip=null;this.waiting=false;this.callbacks.enter(this.state);}
 play(clip:CinemaClip,after:()=>void){
  clip=withDialogue(clip);clip.cues.sort((a,b)=>a.at-b.at);this.clip=clip;this.clock=0;this.emitted.clear();this.waiting=false;this.holdAge=0;
  this.mode='cinematic';this.afterClip=after;this.callbacks.cinematic(clip);this.update(0);
 }
 objectiveComplete(hp:number,elapsed:number,breaks=0){return this.mode==='fight'&&(hp<=0||this.state.phase==='mirrors'&&elapsed>=45&&breaks>=1);}
 finishObjective(){if(this.mode!=='fight')return;const routes:Record<StoryPhaseId,StorySceneId>={mist:'prison',rescue:'shuriken',copy:'hunter',protect:'bridge',mirrors:'sacrifice',seal:'hesitation',lightning:'interception'};const next=()=>this.startScene(routes[this.state.phase]);if(this.callbacks.transition)this.callbacks.transition(next);else next();}
 update(dt:number){
  if(this.mode!=='cinematic'||!this.clip)return;

  const target=this.clock+dt,clip=this.clip;
  for(let i=0;i<clip.cues.length;i++){
   const cue=clip.cues[i];if(this.emitted.has(i)||cue.at>target)continue;
   this.clock=cue.at;this.emitted.add(i);this.callbacks.cue(cue);

  }
  this.clock=target;if(this.clock>=clip.duration&&this.callbacks.ready?.()!==false)this.finishClip();
 }
 get canAdvance(){return false;}
 advance(){return false;}
 skip(){if(this.mode==='cinematic')this.finishClip();}
 private finishClip(){if(this.mode!=='cinematic')return;const next=this.afterClip;this.afterClip=null;this.clip=null;this.waiting=false;if(next){if(this.callbacks.transition)this.callbacks.transition(next);else next();}}
 private complete(){this.state={...this.state,hakuDefeated:true,hakuIntercepted:true,complete:true};this.mode='complete';this.clip=null;this.waiting=false;this.callbacks.complete();}
}

/** Each ending entry reconstructs the actors at its own canonical starting point. */
function endingSegment(index:number):CinemaClip {
 if(index===2)return snowScene();
 const full=withDialogue(outroClip('lightning')),starts=[0,11000,27600],ends=[11000,27600,36000],ids=['haku-interception','gatos-betrayal','snowy-rest'];
 const start=starts[index],end=ends[index];
 const actors=full.actors.map(a=>({...a,alpha:a.id.startsWith('hound')||a.id.startsWith('henchman')||a.id==='gato'?0:a.alpha}));
 for(const c of full.cues.filter(c=>c.at<start)){const a=actors.find(a=>a.id===c.actor);if(!a)continue;
  if(c.x!==undefined)a.x=c.x;if(c.y!==undefined)a.y=c.y;if(c.facing)a.facing=c.facing;if(c.alpha!==undefined)a.alpha=c.alpha;
  if(c.animation)a.animation=['run','dash','airdash','cast','hurt','light1','heavy'].includes(c.animation)?'idle':c.animation;
 }
 return{id:ids[index],arena:'bridge',offset:start,duration:end-start,actors,cues:[{at:0,camera:350,fade:'in'},...full.cues.filter(c=>c.at>=start&&c.at<end).map(c=>({...c,at:c.at-start}))]};
}

/** Original, concise dialogue paraphrases the scene; these are not anime transcript extracts. */

function withDialogue(clip: CinemaClip): CinemaClip {
  if(clip.authored)return clip;

  const lines: Record<string, CinemaCue[]> = {

    'team-seven-arrives': [

      {at: 0, caption: 'LAND OF WAVES · THE FOREST LAKE', hold: 3500},

      {at: 500, actor: 'kakashi', speech: 'Stay together. Protect Tazuna.', hold: 2700},

      {at: 4800, actor: 'zabuza', speech: 'The bridge builder is my target.', hold: 2900},

      {at: 8000, actor: 'kakashi', speech: 'You will have to get past me.', hold: 3200}],

    'water-prison': [

      {at: 1500, actor: 'kakashi', speech: 'A water clone…!', hold: 2300},

      {at: 3900, actor: 'zabuza', speech: 'The real me is right here.', moment: 0, hold: 3000},

      {at: 7300, actor: 'naruto', speech: 'Sasuke! We can make him let go!', hold: 3100}],

    'transformed-shuriken': [

      {at: 600, actor: 'naruto', speech: 'Sasuke, use the shuriken!', hold: 2600},

      {at: 3500, actor: 'sasuke', speech: 'I see your plan. Here goes!', moment: 1, hold: 2900},

      {at: 7800, actor: 'zabuza', speech: 'That second shuriken was a clone?!', hold: 3000},

      {at: 10900, actor: 'prisoner', speech: 'Good teamwork. Leave the rest to me.', hold: 2800}],

    'hunter-nin-deception': [

      {at: 700, actor: 'kakashi', speech: 'I can read your hand signs.', hold: 2900},





      {at: 16300, actor: 'kakashi', speech: 'Something about that does not fit…', hold: 2800}],

    'simultaneous-bridge-battles': [

      {at: 0, caption: 'DAYS LATER · THE UNFINISHED BRIDGE', hold: 3300},

      {at: 300, actor: 'sakura', speech: 'Tazuna, stay behind me!', moment: 3, hold: 3100},

      {at: 3500, actor: 'kakashi', speech: 'Sakura, guard him. I will handle Zabuza.', hold: 2600},

      {at: 6300, actor: 'sasuke', speech: 'Then the masked one is mine.', hold: 2200}],

    'sasuke-protects-naruto': [

      {at: 600, actor: 'sasuke', speech: 'I can see the needles now!', hold: 2700},

      {at: 3500, actor: 'naruto', speech: 'Sasuke! I am here to help!', hold: 2600},

      {at: 7300, actor: 'sasuke', speech: 'Naruto—look out!', moment: 4, hold: 3500},

      {at: 11700, actor: 'naruto', speech: 'You protected me… Sasuke!', hold: 3400}],

    'narutos-hesitation': [

      {at: 2400, actor: 'naruto', speech: 'You… the person from the forest?', hold: 2900},

      {at: 5600, actor: 'haku', speech: 'I only wanted to protect someone precious.', hold: 3500},

      {at: 9700, actor: 'haku', speech: 'Zabuza is in danger!', hold: 2400}],

    'a-demon-in-the-snow': [

      {at: 800, caption: 'AT THE OTHER END OF THE BRIDGE', hold: 2800},

      {at: 3400, actor: 'kakashi', speech: 'The hounds have your scent. It ends here.', hold: 3000},

      {at: 7300, actor: 'haku', speech: 'I will protect you!', moment: 5, hold: 3400},

      {at: 11600, actor: 'gato', speech: 'You failed. I have no reason to pay you.', hold: 2900},

      {at: 15000, actor: 'naruto', speech: 'Haku gave everything for you!', hold: 3000},

      {at: 18400, actor: 'zabuza', speech: 'Boy… lend me your kunai.', hold: 1400},



      {at: 29700, actor: 'zabuza', speech: 'Let me stay beside you.', hold: 3200},

      {at: 33000, caption: 'THE BRIDGE WILL CARRY THEIR MEMORY.', hold: 2200}],

  };

  const storyBeats:Record<string,CinemaCue[]>={
 'transformed-shuriken':[{at:3500,actor:'sasuke',speech:'Two shuriken. One hidden in the other. Naruto knows what comes next.'},{at:10800,actor:'prisoner',speech:'You made him release the prison. Now it is my turn.'}],
 'hunter-nin-deception':[{at:9300,actor:'haku',speech:'I am a hunter-nin. Leave his body to me.'},{at:15300,actor:'kakashi',speech:'Those needles… Was he truly killed?'}],
 'simultaneous-bridge-battles':[{at:5200,actor:'sakura',speech:'I will protect Tazuna. Sasuke, watch the mirrors!'}],
 'sasuke-protects-naruto':[{at:7600,actor:'sasuke',speech:'My body moved before I could think.'},{at:10600,actor:'naruto',speech:'Sasuke… You were supposed to keep chasing your dream.'},{at:13400,actor:'naruto',speech:'I will not let you hurt anyone else!'}],
 'narutos-hesitation':[{at:4800,actor:'haku',speech:'I fought to protect someone precious. Now he needs me.'}],
 'a-demon-in-the-snow':[{at:7700,actor:'haku',speech:'Zabuza… I will protect you.'},{at:23300,actor:'zabuza',speech:'Gato. This is the end of our contract.'},{at:32200,actor:'zabuza',speech:'Let me rest beside you, Haku.'}],
 };
 const beats=storyBeats[clip.id]||[];
 const base=[...clip.cues,...(lines[clip.id]||[])].filter(c=>!c.speech||!beats.some(b=>b.speech&&Math.abs(b.at-c.at)<1500));
 const cues=[...base,...beats].map(c=>{const copy={...c};delete copy.moment;delete copy.manga;delete copy.awaitAdvance;return copy;}).sort((a,b)=>a.at-b.at);
 let spokenUntil=0;
 for(const cue of cues)if(cue.speech){cue.at=Math.max(cue.at,spokenUntil);cue.hold=dialogueDuration(cue.speech);spokenUntil=cue.at+cue.hold+150;}
 return {...clip,duration:Math.max(clip.duration,spokenUntil+250),cues:cues.sort((a,b)=>a.at-b.at)};

}

/** Replay entries build their own actors; no seek through a running combat simulation. */
function hunterSegment(departure:boolean):CinemaClip{
 const full=withDialogue(outroClip('copy')),start=departure?13500:7800;
 const actors=full.actors.map(a=>({...a}));
 for(const a of actors){if(a.id==='zabuza'){a.x=1280;a.animation=departure?'defeat':'idle';}if(a.id==='haku'){a.x=departure?1330:1450;a.facing=-1;}if(a.id==='kakashi')a.x=departure?900:370;}
 return{id:departure?'hunter-departure-replay':'hunter-needles-replay',arena:'lakeside',duration:17700-start,actors,cues:[{at:0,camera:0,zoom:.84},...full.cues.filter(c=>c.at>=start).map(c=>({...c,at:c.at-start}))]};
}
