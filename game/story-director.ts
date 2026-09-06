import {PHASES, nextPhase, stateForPhase, type StoryPhaseId, type StoryState} from './chapter';

import type {AnimationName, CharacterId, EffectName} from './combat-core';

export type ActorId = CharacterId | 'tazuna' | 'gato' | 'hound1' | 'hound2' | 'hound3' | 'henchman1' | 'henchman2' | 'henchman3' | 'clone' | 'prisoner';

export interface CinemaActor {id: ActorId; x: number; y: number; facing: -1 | 1; animation: AnimationName; alpha?: number;}

export interface CinemaCue {

  at: number; actor?: ActorId; x?: number; y?: number; duration?: number; animation?: AnimationName;

  facing?: -1 | 1; alpha?: number; effect?: EffectName | 'prison' | 'shuriken' | 'mirrors' | 'aura' | 'snow' | 'mask';

  camera?: number; zoom?: number; fade?: 'in' | 'out';

  speech?: string; hold?: number; moment?: number; caption?: string;

}

export interface CinemaClip {id: string; duration: number; arena: 'lakeside' | 'bridge'; actors: CinemaActor[]; cues: CinemaCue[];}

const actor = (id: ActorId, x: number, facing: -1 | 1 = 1, animation: AnimationName = 'idle', y = 590): CinemaActor => ({id, x, y, facing, animation});

export function introClip(phase: StoryPhaseId): CinemaClip {

  const data = PHASES[phase];

  if (phase !== 'mist') return {id: `${phase}-entry`, arena: data.arena, duration: 2400,

    actors: [actor(data.character, data.playerX), actor(data.boss, data.bossX, -1)], cues: [{at: 0, camera: 220, fade: 'in'}, {at: 400, camera: 140, duration: 1700}]};

  return {id: 'team-seven-arrives', arena: 'lakeside', duration: 12500,

    actors: [actor('kakashi', 370), actor('naruto', 225), actor('sasuke', 130), actor('sakura', 65), actor('tazuna', 15), actor('zabuza', 1230, -1)],

    cues: [{at: 0, fade: 'in', camera: 0}, {at: 500, actor: 'kakashi', x: 520, duration: 1600, animation: 'run'},

      {at: 900, actor: 'naruto', x: 340, duration: 1700, animation: 'run'}, {at: 950, actor: 'sasuke', x: 245, duration: 1800, animation: 'run'},

      {at: 2500, actor: 'zabuza', animation: 'heavy', effect: 'shuriken'}, {at: 3300, actor: 'kakashi', animation: 'block'},

      {at: 3400, actor: 'naruto', animation: 'slide'}, {at: 3400, actor: 'sasuke', animation: 'slide'},

      {at: 4900, actor: 'zabuza', x: 980, duration: 1000, animation: 'dash'}, {at: 6300, camera: 230, duration: 1500},

      {at: 5400, actor: 'naruto', animation: 'idle'}, {at: 5400, actor: 'sasuke', animation: 'idle'}, {at: 7900, actor: 'kakashi', animation: 'cast', effect: 'smoke'}, {at: 9600, actor: 'kakashi', x: 600, duration: 1000, animation: 'run'}, {at: 11600, fade: 'out'}]};

}

export function outroClip(phase: StoryPhaseId): CinemaClip {

  const common = [actor('kakashi', 560), actor('zabuza', 950, -1), actor('naruto', 260), actor('sasuke', 180), actor('sakura', 90), actor('tazuna', 40)];

  switch (phase) {

    case 'mist': return {id: 'water-prison', arena: 'lakeside', duration: 11200, actors: common,

      cues: [{at: 0, camera: 190}, {at: 500, actor: 'kakashi', x: 840, animation: 'dash', duration: 400},

        {at: 1000, actor: 'zabuza', effect: 'water', alpha: .5}, {at: 1800, actor: 'zabuza', facing: 1, x: 600, duration: 1, alpha: 1, effect: 'smoke'},

        {at: 2900, actor: 'kakashi', x: 730, y: 540, duration: 450, animation: 'guardbreak', effect: 'prison'},

        {at: 3900, actor: 'zabuza', x: 650, duration: 400, animation: 'cast'}, {at: 4700, actor: 'naruto', x: 420, duration: 1500, animation: 'run'},

        {at: 5000, actor: 'sasuke', x: 340, duration: 1200, animation: 'run'}, {at: 6500, camera: 80, duration: 1600},

        {at: 8200, actor: 'naruto', animation: 'cast', effect: 'smoke'}, {at: 10400, fade: 'out'}]};

    case 'rescue': return {id: 'transformed-shuriken', arena: 'lakeside', duration: 14500,

      actors: [actor('naruto', 410), actor('sasuke', 535), actor('zabuza', 1040, 1, 'cast'), actor('prisoner', 1130, -1, 'guardbreak', 545)],

      cues: [{at: 0, effect: 'prison', actor: 'prisoner', camera: 200}, {at: 1000, actor: 'naruto', animation: 'cast', effect: 'smoke'},

        {at: 2400, actor: 'naruto', alpha: 0, effect: 'shuriken'}, {at: 3400, actor: 'sasuke', animation: 'cast'},

        {at: 4000, actor: 'sasuke', effect: 'shuriken'}, {at: 4500,actor:'zabuza',facing:-1}, {at: 5000, actor: 'zabuza', animation: 'jump', y: 470, duration: 350},

        {at:5700,actor:'zabuza',y:590,duration:400,animation:'land'},
        {at: 6500, actor: 'naruto', facing: -1, x: 1260, y: 525, alpha: 1, animation: 'cast', effect: 'smoke'},

        {at: 7200, actor: 'naruto', effect: 'shuriken'}, {at: 7800, actor: 'zabuza', facing:1, x: 960, y: 590, duration: 300, animation: 'hurt'},

        {at: 8300, actor: 'prisoner', y: 590, animation: 'land', effect: 'water', duration: 450},

        {at: 9500, actor: 'prisoner', x: 1020, duration: 450, animation: 'dash'}, {at: 10500, actor: 'zabuza', animation: 'block', effect: 'parry'},

        {at: 7450, actor: 'naruto', y: 592, duration: 400, animation: 'land', facing: -1}, {at: 12500, camera: 400, duration: 900}, {at: 13700, fade: 'out'}]};

    case 'copy': return {id: 'hunter-nin-deception', arena: 'lakeside', duration: 22000, actors: [...common, actor('haku', 1420, -1)],

      cues: [{at: 0, camera: 240}, {at: 600, actor: 'kakashi', animation: 'cast'}, {at: 600, actor: 'zabuza', animation: 'cast'},

        {at: 2000, actor: 'zabuza', effect: 'water'}, {at: 2100, actor: 'kakashi', effect: 'water'},

        {at: 4700, actor: 'kakashi', animation: 'ultimate', effect: 'water'}, {at: 6100, actor: 'zabuza', x: 1210, duration: 600, animation: 'hurt'},

        {at: 8100, actor: 'haku', x: 1320, animation: 'cast', effect: 'ice', duration: 500}, {at: 9100, actor: 'zabuza', animation: 'defeat'},

        {at: 10300, actor: 'haku', x: 1240, duration: 800, animation: 'run'}, {at: 12200, actor: 'kakashi', x: 990, duration: 1400, animation: 'run'},

        {at: 14400, actor: 'haku', animation: 'cast', effect: 'smoke'}, {at: 15100, actor: 'zabuza', alpha: 0},

        {at: 15200, actor: 'haku', x: 1610, duration: 1600, animation: 'run'}, {at: 17500, actor: 'kakashi', animation: 'guardbreak'},

        {at: 18800, actor: 'naruto', x: 850, duration: 1200, animation: 'run'}, {at: 21000, fade: 'out'}]};

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

        {at: 5300, actor: 'haku', facing: 1, x: 380, duration: 170, effect: 'ice'}, {at: 6500, actor: 'haku', animation: 'cast', effect: 'shuriken'},

        {at: 7000, actor: 'sasuke', x: 510, duration: 230, animation: 'dash', facing: -1},

        {at: 7500, actor: 'sasuke', animation: 'hurt', effect: 'impact'}, {at: 9000, actor: 'sasuke', animation: 'defeat'},

        {at: 10300, actor: 'naruto', facing: -1, x: 560, duration: 700, animation: 'guardbreak'}, {at: 12800, actor: 'naruto', animation: 'ultimate', effect: 'aura'},

        {at: 14400, actor: 'haku', x: 1170, duration: 500, animation: 'airdash'}, {at: 15000, actor: 'haku', facing: -1}, {at: 16500, fade: 'out'}]};

    case 'seal': return {id: 'narutos-hesitation', arena: 'bridge', duration: 13700,

      actors: [actor('naruto', 780), actor('haku', 1000, -1, 'guardbreak'), actor('sasuke', 430, 1, 'defeat'), actor('kakashi', 65), actor('zabuza', 225, -1)],

      cues: [{at: 0, camera: 500, actor: 'haku', effect: 'ice'}, {at: 900, actor: 'naruto', animation: 'heavy', effect: 'aura'},

        {at: 2200, actor: 'haku', effect: 'mask', animation: 'hurt'}, {at: 3900, actor: 'naruto', animation: 'idle'},

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

        {at: 6800, actor: 'haku', x: 1050, duration: 320, animation: 'airdash'}, {at:7300,actor:'kakashi',animation:'light1',effect:'lightning'}, {at: 7400, actor: 'haku', animation: 'hurt', effect: 'lightning'}, {at:7950,actor:'kakashi',animation:'block'},

        {at: 8900, actor: 'haku', animation: 'defeat'}, {at: 10200, actor: 'hound1', alpha: 0, effect: 'smoke'}, {at: 10200, actor: 'hound2', alpha: 0}, {at: 10200, actor: 'hound3', alpha: 0},

        {at: 11000, actor:'gato',alpha:1},
        {at:11000,actor:'henchman1',alpha:1,x:1330}, {at:11000,actor:'henchman2',alpha:1,x:1410}, {at:11000,actor:'henchman3',alpha:1,x:1550},
        {at: 11800, actor: 'gato', x: 1510, duration: 1000, animation: 'run'}, {at: 12900, actor: 'kakashi', x: 810, duration: 900, animation: 'run'},

        {at: 14000, actor: 'kakashi', facing: 1}, {at: 14900, actor: 'naruto', x: 930, facing:1, duration: 850, animation: 'run'}, {at: 16100, actor: 'zabuza', animation: 'guardbreak'},

        {at: 17900, actor: 'naruto', animation: 'cast'}, {at: 18700, actor: 'zabuza', facing:1, animation: 'heavy'},

        {at: 19800, actor: 'zabuza', facing: 1, x: 1500, duration: 1400, animation: 'dash'}, {at: 20300, actor: 'henchman1', animation: 'defeat', effect: 'impact'},

        {at: 20900, actor: 'henchman2', animation: 'defeat'}, {at: 21600, actor: 'gato', x: 1610, y: 730, duration: 650, animation: 'defeat'},

        {at: 22900, actor: 'henchman3', x: 1770, duration: 900, animation: 'run'}, {at: 24200, actor: 'zabuza', animation: 'guardbreak'},

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

  state: StoryState;

  mode: 'fight' | 'cinematic' | 'complete' = 'fight';

  clip: CinemaClip | null = null; clock = 0; emitted = new Set<number>();

  private afterClip: (() => void) | null = null;

  constructor(phase: StoryPhaseId, private callbacks: {enter: (state: StoryState) => void; cue: (cue: CinemaCue) => void; cinematic: (clip: CinemaClip) => void; complete: () => void}) {this.state = stateForPhase(phase);}

  start(viewIntro: boolean) {

    if (this.state.phase === 'copy') {this.play(outroClip('copy'), () => this.play(outroClip('protect'), () => this.enter('mirrors'))); return;}
    if (this.state.phase === 'protect') {this.play(outroClip('protect'), () => this.enter('mirrors')); return;}

    if (this.state.phase === 'lightning') {this.play(outroClip('lightning'), () => this.complete()); return;}

    if (viewIntro) this.play(introClip(this.state.phase), () => this.enter(this.state.phase)); else this.enter(this.state.phase);

  }

  private enter(phase: StoryPhaseId) {this.state = stateForPhase(phase); this.mode = 'fight'; this.clip = null; this.callbacks.enter(this.state);}

  play(clip: CinemaClip, after: () => void) {

    clip = withDialogue(clip); clip.cues.sort((a,b)=>a.at-b.at);

    this.clip = clip; this.clock = 0; this.emitted.clear(); this.mode = 'cinematic'; this.afterClip = after; this.callbacks.cinematic(clip); this.update(0);

  }

  objectiveComplete(bossHealth: number, elapsedSeconds: number, mirrorGuardBreaks = 0) {

    if (this.mode !== 'fight') return false;

    return bossHealth <= 0 || this.state.phase === 'mirrors' && elapsedSeconds >= 45 && mirrorGuardBreaks >= 1;

  }

  finishObjective() {

    if (this.mode !== 'fight') return;

    const phase = this.state.phase;

    this.play(outroClip(phase), () => {

      if (phase === 'rescue') {this.play(outroClip('copy'), () => this.play(outroClip('protect'), () => this.enter('mirrors'))); return;}
      if (phase === 'copy') {this.play(outroClip('protect'), () => this.enter('mirrors')); return;}

      if (phase === 'seal') {this.play(outroClip('lightning'), () => this.complete()); return;}

      const next = nextPhase(phase);

      if (next) this.enter(next);

      else this.complete();

    });

  }

  private complete() {this.state = {...this.state, hakuDefeated: true, hakuIntercepted: true, complete: true}; this.mode = 'complete'; this.clip = null; this.callbacks.complete();}

  update(dt: number) {

    if (this.mode !== 'cinematic' || !this.clip) return;

    this.clock += dt;

    this.clip.cues.forEach((cue, i) => {if (this.clock >= cue.at && !this.emitted.has(i)) {this.emitted.add(i); this.callbacks.cue(cue);}});

    if (this.clock >= this.clip.duration) this.finishClip();

  }

  skip() {

    // Skip all cinematic beats in this transition, including the two removed fights.

    for (let i = 0; i < 8 && this.mode === 'cinematic'; i++) this.finishClip();

  }

  private finishClip() {

    if (this.mode !== 'cinematic') return;

    const after = this.afterClip; this.afterClip = null;

    // The entering phase reconstructs every actor, resource, camera and checkpoint.

    this.clip = null; after?.();

  }

}





/** Original, concise dialogue paraphrases the scene; these are not anime transcript extracts. */

function withDialogue(clip: CinemaClip): CinemaClip {

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

      {at: 10000, actor: 'haku', speech: 'I am a hunter-nin. I will take his body.', hold: 3500},

      {at: 14300, actor: 'haku', speech: 'You will not need to pursue him.', moment: 2, hold: 3200},

      {at: 17900, actor: 'kakashi', speech: 'Something about that does not fit…', hold: 2800}],

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

      {at: 18400, actor: 'zabuza', speech: 'Boy… lend me your kunai.', hold: 2600},

      {at: 25000, actor: 'zabuza', speech: 'Kakashi… take me to Haku.', hold: 2500},

      {at: 29700, actor: 'zabuza', speech: 'Let me stay beside you.', hold: 3200},

      {at: 33000, caption: 'THE BRIDGE WILL CARRY THEIR MEMORY.', hold: 2200}],

  };

  return {...clip, cues: [...clip.cues, ...(lines[clip.id] || [])].sort((a, b) => a.at - b.at)};

}
