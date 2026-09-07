import type {AttackDefinition, CharacterId, PlayerId} from './combat-core';

export const PHASE_IDS = ['mist', 'rescue', 'copy', 'protect', 'mirrors', 'seal', 'lightning'] as const;
export const PLAYABLE_PHASE_IDS = ['mist', 'rescue', 'mirrors', 'seal'] as const;
export type StoryPhaseId = typeof PHASE_IDS[number];
export type ArenaId = 'lakeside' | 'bridge';
export type CinematicId = 'arrival' | 'prison' | 'shuriken' | 'hunter' | 'bridge' | 'sacrifice' | 'hesitation' | 'ending';
export interface PhaseDefinition {
  id: StoryPhaseId; number: number; title: string; character: PlayerId; boss: 'zabuza' | 'haku';
  arena: ArenaId; hp: number; objective: string; intro: CinematicId; outro: CinematicId;
  playerX: number; bossX: number; targetSeconds: number; protectionSeconds?: number;
}
export const PHASES: Record<StoryPhaseId, PhaseDefinition> = {
  mist: {id: 'mist', number: 1, title: 'Assassin of the Mist', character: 'kakashi', boss: 'zabuza', arena: 'lakeside', hp: 1250,
    objective: 'Deflect the sword. Punish a broken guard.', intro: 'arrival', outro: 'prison', playerX: 400, bossX: 990, targetSeconds: 50},
  rescue: {id: 'rescue', number: 2, title: 'Rescue Kakashi', character: 'naruto', boss: 'zabuza', arena: 'lakeside', hp: 550,
    objective: 'With Sasuke, overcome the water clone.', intro: 'prison', outro: 'shuriken', playerX: 430, bossX: 850, targetSeconds: 35},
  copy: {id: 'copy', number: 3, title: 'The Copy Ninja', character: 'kakashi', boss: 'zabuza', arena: 'lakeside', hp: 1200,
    objective: 'Restrain Zabuza. Strike with Lightning Blade.', intro: 'shuriken', outro: 'hunter', playerX: 420, bossX: 1010, targetSeconds: 50},
  protect: {id: 'protect', number: 4, title: 'Protect the Bridge Builder', character: 'sakura', boss: 'zabuza', arena: 'bridge', hp: 1400,
    objective: 'Protect Tazuna for 50s or defeat Zabuza.', intro: 'bridge', outro: 'bridge', playerX: 370, bossX: 1010, targetSeconds: 50, protectionSeconds: 50},
  mirrors: {id: 'mirrors', number: 3, title: 'Crystal Ice Mirrors', character: 'sasuke', boss: 'haku', arena: 'bridge', hp: 1200,
    objective: 'Hold out for 45 seconds. Break Haku’s guard once inside the mirrors.', intro: 'bridge', outro: 'sacrifice', playerX: 480, bossX: 1080, targetSeconds: 50},
  seal: {id: 'seal', number: 4, title: 'The Broken Seal', character: 'naruto', boss: 'haku', arena: 'bridge', hp: 1200,
    objective: 'Break the mirrors. Reach Haku.', intro: 'sacrifice', outro: 'hesitation', playerX: 530, bossX: 1090, targetSeconds: 50},
  lightning: {id: 'lightning', number: 7, title: 'Lightning Blade', character: 'kakashi', boss: 'zabuza', arena: 'bridge', hp: 2000,
    objective: 'Counter silent killing. Restrain Zabuza.', intro: 'hesitation', outro: 'ending', playerX: 410, bossX: 1030, targetSeconds: 70},
};
export const ARENAS = {lakeside: {width: 1560, floor: 592, min: 70, max: 1490}, bridge: {width: 1660, floor: 590, min: 70, max: 1590}} as const;
export const CHARACTER = {
  kakashi: {name: 'Kakashi Hatake', short: 'Kakashi', color: '#beca9d', height: 157},
  naruto: {name: 'Naruto Uzumaki', short: 'Naruto', color: '#ffad58', height: 132},
  sasuke: {name: 'Sasuke Uchiha', short: 'Sasuke', color: '#84a9ec', height: 135},
  sakura: {name: 'Sakura Haruno', short: 'Sakura', color: '#eca0b2', height: 135},
  zabuza: {name: 'Zabuza Momochi', short: 'Zabuza', color: '#b1ccd2', height: 167},
  haku: {name: 'Haku', short: 'Haku', color: '#a8e5e2', height: 146},
} satisfies Record<CharacterId, {name: string; short: string; color: string; height: number}>;

export interface Ability {label: string; description: string; icon: 'eye' | 'water' | 'dog' | 'bolt' | 'clone' | 'feint' | 'rush' | 'fire' | 'shuriken' | 'kunai' | 'shield'; attack: AttackDefinition;}
function technique(id: string, action: 'skill1' | 'skill2' | 'ultimate', chakra: number, cooldown: number, effect: 'water' | 'fire' | 'smoke' | 'lightning' | 'impact', damage = 0): AttackDefinition {
  const ultimate = action === 'ultimate';
  return {id, action, animation: ultimate ? 'ultimate' : 'cast', duration: ultimate ? 1100 : 496, cancelAt: ultimate ? 950 : 392,
    stamina: ultimate ? 12 : 9, chakra, cooldown, ultimate: ultimate ? 100 : 0,
    events: [{at: ultimate ? 370 : 192, kind: 'technique', effect, damage, posture: ultimate ? 62 : 26}]};
}
const ABILITIES = {
  read: {label: 'Sharingan', icon: 'eye', description: 'Slow time for 3s. For 6s reveal attacks; perfect parries deal double guard damage and empower your next strike. 24 chakra.', attack: technique('reading', 'skill1', 24, 9000, 'smoke')},
  dragon: {label: 'Water Dragon', icon: 'water', description: 'A copied water dragon strikes across the arena.', attack: technique('dragon', 'skill2', 30, 7200, 'water', 105)},
  waterfall: {label: 'Great Waterfall', icon: 'water', description: 'A powerful copied water surge breaks Zabuza’s stance.', attack: technique('waterfall', 'ultimate', 0, 0, 'water', 290)},
  hounds: {label: 'Ninja Hounds', icon: 'dog', description: 'Pin Zabuza for 1s and damage his guard. 32 chakra.', attack: technique('hounds', 'skill2', 32, 11000, 'smoke', 80)},
  blade: {label: 'Chidori', icon: 'bolt', description: 'ULTIMATE · Lightning Blade. Lock on, charge lightning, then pierce the guard with a cinematic rush.', attack: technique('lightning', 'ultimate', 0, 0, 'lightning', 420)},
  clones: {label: 'Shadow Clones', icon: 'clone', description: 'Two allies distract and attack for six seconds; each disappears after one hit.', attack: technique('clones', 'skill1', 30, 8500, 'smoke')},
  feint: {label: 'Sexy no Jutsu', icon: 'feint', description: 'A fully clothed adult glamour illusion dazzles a nearby opponent for 1 second. 24 chakra.', attack: technique('glamour', 'skill2', 24, 10000, 'smoke')},
  teamwork: {label: 'Clone Barrage', icon: 'rush', description: 'ULTIMATE · Clones surround the target for a coordinated three-strike takedown.', attack: technique('barrage', 'ultimate', 0, 0, 'impact', 370)},
  redRush: {label: 'Chakra Rush', icon: 'rush', description: 'Nine-Tails chakra drives a rush that can shatter ice mirrors.', attack: technique('red-rush', 'skill2', 25, 6500, 'impact', 125)},
  nineTails: {label: 'Unsealed Fury', icon: 'rush', description: 'ULTIMATE · Erupt in red chakra, smash the mirrors, and unleash a brutal rush.', attack: technique('fury', 'ultimate', 0, 0, 'impact', 450)},
  fireball: {label: 'Great Fireball', icon: 'fire', description: 'Breathe a broad fireball toward an exposed mirror or Haku.', attack: technique('fireball', 'skill1', 27, 5600, 'fire', 100)},
  windmill: {label: 'Windmill Shuriken', icon: 'shuriken', description: 'A wide spinning projectile with a returning pass.', attack: technique('windmill', 'skill2', 18, 4200, 'impact', 63)},
  focus: {label: 'Sharingan Focus', icon: 'eye', description: 'ULTIMATE · Read Haku, leave three afterimages, and strike with a precise kunai finisher.', attack: technique('focus', 'ultimate', 0, 0, 'impact', 390)},
  intercept: {label: 'Kunai Intercept', icon: 'kunai', description: 'A fan of kunai intercepts incoming projectiles and protects Tazuna.', attack: technique('intercept', 'skill1', 18, 4200, 'impact', 44)},
  protection: {label: 'Protective Stance', icon: 'shield', description: 'Brace near Tazuna, restoring guard stamina and drawing attacks.', attack: technique('protect', 'skill2', 22, 7800, 'smoke')},
  resolve: {label: 'Resolve Counter', icon: 'kunai', description: 'ULTIMATE · Intercept the threat to Tazuna and deliver a decisive kunai counter.', attack: technique('resolve', 'ultimate', 0, 0, 'impact', 340)},
} satisfies Record<string, Ability>;
export function kit(phase: StoryPhaseId): [Ability, Ability, Ability] {
  switch (phase) {
    case 'mist': case 'copy': return [ABILITIES.read, ABILITIES.hounds, ABILITIES.blade];
    case 'rescue': return [ABILITIES.clones, ABILITIES.feint, ABILITIES.teamwork];
    case 'protect': return [ABILITIES.intercept, ABILITIES.protection, ABILITIES.resolve];
    case 'mirrors': return [ABILITIES.fireball, ABILITIES.windmill, ABILITIES.focus];
    case 'seal': return [ABILITIES.clones, ABILITIES.redRush, ABILITIES.nineTails];
    case 'lightning': return [ABILITIES.read, ABILITIES.hounds, ABILITIES.blade];
  }
}
export interface StoryState {
  phase: StoryPhaseId; kakashiCaptured: boolean; firstDuelFinished: boolean;
  narutoInMirrors: boolean; sharinganAwakened: boolean; sasukeFallen: boolean;
  sealBroken: boolean; hakuDefeated: boolean; hakuIntercepted: boolean; complete: boolean;
}
export function stateForPhase(phase: StoryPhaseId): StoryState {
  const i = PHASE_IDS.indexOf(phase);
  return {phase, kakashiCaptured: phase === 'rescue', firstDuelFinished: i >= 3, narutoInMirrors: i >= 5,
    sharinganAwakened: i >= 5, sasukeFallen: i >= 5, sealBroken: i >= 5, hakuDefeated: i >= 6,
    hakuIntercepted: false, complete: false};
}
export function nextPhase(phase: StoryPhaseId) {return PHASE_IDS[PHASE_IDS.indexOf(phase) + 1] ?? null;}
export const STORY_SOURCES = [
  {title: 'Official Kakashi story recap — manga chapters 11–33', url: 'https://naruto-official.com/en/news/01_1903'},
  {title: 'The Broken Seal — Naruto arrives before Sasuke’s sacrifice', url: 'https://naruto-official.com/en/anime/naruto1/list/01_240'},
  {title: 'The Weapons Known as Shinobi — Haku intercepts Kakashi', url: 'https://naruto-official.com/en/anime/naruto1/list/01_242'},
  {title: 'The Demon in the Snow — Land of Waves ending', url: 'https://naruto-official.com/en/anime/naruto1/list/01_243'},
];
