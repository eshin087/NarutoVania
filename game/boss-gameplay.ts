import {StoryRepairs} from './story-repairs-v21';
import {pose21,effect21,HoundPack} from './art-v21';
import {HOSTILE_SPEED,ultimateGain,mirrorOrigins,diveTarget} from './revision-v21';
import {waterHand,launchFromHand,aimedWaterRoute,visibleBodyBounds} from './presentation-v16';
import {waterImpact,waveGroundAnchor} from './art-v15';
import {mirrorVisual,poseReflection,fitAllMirrors} from './mirror-v15';
import {animateEffect,makeEffect} from './effects-v14';
import {chooseCorridor,entersCorridor,sweptContact,groundContact,waterFrame,type WaterPresentation,type WaterEndReason} from './presentation-v15';
import {mirrorFeet} from './presentation-v14';
import {CinematicMotionV14} from './cinematic-v14';
import {poseHakuV13} from './art-v13';
import {MirrorExit} from './cinematic-motion';
import {poseWaterCast,poseHurt,waveOutline} from './art-v11';
import {BARRAGES,BarrageTimeline,chooseVariant,type BarrageId,type PreparedVolley} from './barrages';
import {reactionPose,swordPose,swordHand,endingPose} from './art-v10';
import {ReturningSword} from './returning-sword';
import {bossParryEligible} from './boss-ai';
import {redOutline,outlineHits} from './attack-geometry';
import type {StorySceneId} from './scene-catalog';
import * as Phaser from 'phaser';
import {bossBridge as bridge, type Command} from './boss-bridge';
import {ARENAS, CHARACTER, PHASES, kit, type StoryPhaseId, type StoryState} from './chapter';
import {COMBAT, Combatant, UNIVERSAL, clamp, hurtbox, overlaps, safeSubstitution, type AnimationName, type AttackEvent, type CharacterId, type EffectName} from './combat-core';
import {BossBrain, MirrorFormation, type BossMove} from './boss-ai';
import {BattleInput} from './battle-input';
import {RecordedAudio} from './recorded-audio';
import {namedArt, poseBattle} from './battle-art';
import {StoryDirector, type ActorId, type CinemaClip, type CinemaCue} from './story-director';
import {attackBounds, fixedAim, projectileSweep} from './projectile-rules';
import {CinemaPresentation} from './cinema-presentation';
import {SupportBrain} from './support-ai';
import {swordPresentation} from './sword-presentation';
import {poseZabuzaSword} from './battle-art';
import {UltimateBurst} from './ultimate-burst';

type BodyObject = Phaser.GameObjects.Rectangle & {body: Phaser.Physics.Arcade.Body};
interface Fighter {key: string; model: Combatant; body: BodyObject; sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Ellipse; animation: AnimationName; animationAt: number; lastStep: number; ally: boolean; hostile: boolean; expires: number; nextAttack: number; support?: SupportBrain; guardUntil?: number; supportCasts?: number; rush?: {x: number; until: number; serial: number};}
interface Projectile {handLaunch?:boolean;water?:WaterPresentation;groundWave?:boolean;groundEndX?:number;image: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; damage: number; posture: number; red: boolean; friendly: boolean; owner: Fighter; expires: number; rx: number; ry: number; kind: string; hit: Set<string>; pooled?:boolean;barrage?:boolean;safeGap?:{left:number;right:number};sword?:ReturningSword; returnAt?: number; waterRow?:number;iceBarrage?:boolean; born:number; trail:{x:number;y:number}[];}
interface VisualEffect {attached?:Fighter;chakra21?:boolean;image: Phaser.GameObjects.Image; born: number; duration: number; width: number; grow: number; spin: number; effectName?:string; waterRow?:number;iceBarrage?:boolean; tidal?: {owner:Fighter;event:AttackEvent;key:string;x:number;hit:boolean};}
interface MirrorVisual {image: Phaser.GameObjects.Image; reflection: Phaser.GameObjects.Sprite; halo: Phaser.GameObjects.Ellipse;}
interface Decoy {image: Phaser.GameObjects.Image; x: number; y: number; expires: number;}
interface CinemaVisual {sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image; id: ActorId; character?: CharacterId; animation: AnimationName; animationAt: number; facing: -1 | 1; settleAt?: number;}

export class BossGameScene extends Phaser.Scene {
  inputs!: BattleInput; sounds!: RecordedAudio; director!: StoryDirector; phase: StoryPhaseId = 'mist';
  player!: Fighter; boss!: Fighter; brain!: BossBrain; fighters: Fighter[] = []; projectiles: Projectile[] = []; effects: VisualEffect[] = []; decoys: Decoy[] = [];
  mirrorExit:MirrorExit|null=null;mirrorExitAt=0;
  formation = new MirrorFormation(); mirrorVisuals: MirrorVisual[] = []; mirrorEnd = 0; mirrorInterruptUntil = 0; nextMirrorTransfer = 0;
  floors!: Phaser.Physics.Arcade.StaticGroup; floor = 592; arenaMin = 70; arenaMax = 1490;
  now = 0; elapsed = 0; phaseElapsed = 0; lastEmit = 0; hitStop = 0; lastHitStop = -9999; jumpQueued = -9999; lastGround = 0; landedAt = 0;
  backgrounds: Phaser.GameObjects.Image[] = []; mist: Phaser.GameObjects.Image[] = []; cueGraphics!: Phaser.GameObjects.Graphics;
  mistUntil = 0; readingUntil = 0; bossRestrainedUntil = 0; targetX = 0; targetY = 0; aimLocked = false; redCueAt = 0;
  mirrorGuardBreaks = 0; bossBreakAnnounced = 0;
  ultimatesUsed=0;clonesCreated = 0; parries = 0; retries = 0; protection = 100; protectionHits = 0; protectionUntil = 0;
  sharingan = false; narutoJoined = false; phaseEnding = false; gameOver = false; pausedFrom: 'playing' | 'intro' = 'playing';
  storyRepairs:StoryRepairs|null=null;cinemaMotion:CinematicMotionV14|null=null;cinemaActors = new Map<ActorId, CinemaVisual>(); cinemaClock = 0; presentationClock=0; entryScene:StorySceneId|undefined; cinemaPrison: Phaser.GameObjects.Graphics | null = null; prisonActor: CinemaVisual | null = null; glamour: {sprite:Phaser.GameObjects.Sprite;born:number} | null = null; parryFlashUntil=0; parryChain=0; lastParry=-9999;parrySignals:{x:number;y:number;born:number;text:Phaser.GameObjects.Text}[]=[];sharinganEchoes:Phaser.GameObjects.Sprite[]=[];lastEcho=0;
  followups: {at: number; fighter: Fighter; event: AttackEvent; key: string; serial: number}[] = [];
  sceneryActors: Phaser.GameObjects.GameObject[] = []; snow: {x: number; y: number; speed: number}[] = []; snowActive = false;
  cinemaPresentation: CinemaPresentation | null = null; panelExiting=false;
  barrage:{timeline:BarrageTimeline;originX:number;originY:number;airX:number;serial:number}|null=null; barrageLast=-12000;barrageAttack=0;barrageIndex=0;requestedBarrage?:BarrageId;requestedVariant?:0|1;variantHistory:Partial<Record<BarrageId,number>>={};projectilePool:Phaser.GameObjects.Image[]=[];barrageHazards:{x:number;born:number;hit:Set<string>;image:Phaser.GameObjects.Image}[]=[];barrageMirrors:Phaser.GameObjects.Image[]=[];barrageBuilds=new Map<number,Phaser.GameObjects.Image[]>();
  readingSlow = 0; counterUntil = 0; swordCatchUntil=0;
  ultimateBurst: UltimateBurst | null = null;
  houndPacks:{pack:HoundPack;f:Fighter;event:AttackEvent;key:string;hit:boolean}[]=[];
  ultimateTargetStart:{x:number;y:number}|null=null;ultimateCamera={zoom:1,scrollX:0};
  transitionOverlay?:Phaser.GameObjects.Rectangle;transitionAge=0;transitionNext:(()=>void)|null=null;transitionActive=false;
  private transition(next:()=>void){if(this.transitionActive)return;this.transitionNext=next;this.transitionAge=0;this.transitionActive=true;this.inputs.clear();this.physics.world.pause();this.tweens.pauseAll();this.transitionOverlay=this.add.rectangle(640,360,1280,720,0x040f16).setScrollFactor(0).setDepth(1000).setAlpha(0);}
  private updateTransition(dt:number){this.transitionAge+=dt;if(this.transitionAge>=250&&this.transitionNext){const next=this.transitionNext;this.transitionNext=null;next();this.physics.world.pause();this.tweens.pauseAll();}this.transitionOverlay?.setAlpha(this.transitionAge<250?this.transitionAge/250:Math.max(0,1-(this.transitionAge-250)/350));if(this.transitionAge>=600){this.transitionActive=false;this.transitionOverlay?.destroy();this.transitionOverlay=undefined;this.inputs.clear();this.inputs.quarantineConfirm();this.tweens.resumeAll();}}
  constructor() {super('BossGameplay');}
  init(data: {checkpoint?: StoryPhaseId; elapsed?: number; retries?: number; parries?: number; inputs: BattleInput; soundscape: RecordedAudio; viewIntro?: boolean;sceneId?:StorySceneId;barrageId?:BarrageId;barrageVariant?:0|1}) {
    this.transitionActive=false;this.transitionNext=null;this.transitionOverlay=undefined;this.panelExiting=false;
    this.requestedVariant=data.barrageVariant;this.requestedBarrage=data.barrageId;this.entryScene=data.sceneId;this.phase = data.checkpoint || 'mist'; this.inputs = data.inputs; this.sounds = data.soundscape; this.elapsed = data.elapsed || 0;
    this.retries = data.retries || 0; this.parries = data.parries || 0; this.registry.set('view-boss-intro', data.viewIntro === true);
    this.fighters = []; this.projectiles = []; this.effects = []; this.decoys = []; this.mirrorVisuals = []; this.backgrounds = []; this.mist = [];
    this.cinemaActors = new Map(); this.sceneryActors = []; this.followups = []; this.now = 0; this.hitStop = 0; this.lastHitStop = -9999; this.lastEmit = 0;
    this.phaseEnding = false; this.gameOver = false; this.snowActive = false; this.snow = []; this.formation = new MirrorFormation();
  }
  create() {
    this.director = new StoryDirector(this.phase, {enter: state => this.enterPhase(state), cinematic: clip => this.startCinema(clip), cue: cue => this.cinemaCue(cue), complete: () => this.finishChapter(),ready:()=>this.cinemaMotion?.ready!==false,transition:next=>this.transition(next)});
    if(this.entryScene)this.director.startScene(this.entryScene);else this.director.start(this.registry.get('view-boss-intro')); this.inputs.clear(); void this.sounds.unlock();
    // Phaser tears down physics before user shutdown listeners. Let its scene systems own disposal.
    this.events.once('shutdown', () => {this.cinemaPresentation?.destroy();this.cinemaPresentation=null;this.inputs.clear(); this.sounds.stopEffects();});
  }
  private clearStage() {
    this.diveVisual=null;this.divePuddle=null;this.pendingWater=[];this.mirrorShotQueue=[];this.mirrorEntering=null;this.mirrorExit=null;this.variantHistory={};this.barrage=null;this.projectilePool=[];this.barrageHazards=[];this.barrageMirrors=[];this.barrageBuilds=new Map();this.barrageLast=-12000;this.barrageAttack=0;this.barrageIndex=0;
    this.houndPacks.forEach(h=>h.pack.destroy());this.houndPacks=[];this.ultimateBurst?.destroy(); this.ultimateBurst = null; this.swordCatchUntil=0;
    this.physics.world.timeScale = 1; this.readingSlow = 0; this.counterUntil = 0; this.cinemaPresentation?.destroy();this.cinemaPresentation = null;this.cinemaMotion=null;this.storyRepairs=null;
    this.physics.world.resume(); this.tweens.killAll(); this.physics.world.colliders.destroy(); if (this.floors?.scene) this.floors.destroy(true);
    if(this.transitionOverlay)this.children.remove(this.transitionOverlay);this.children.removeAll(true);if(this.transitionOverlay)this.children.add(this.transitionOverlay); this.fighters = []; this.projectiles = []; this.effects = []; this.decoys = []; this.mirrorVisuals = [];
    this.backgrounds = []; this.mist = []; this.sceneryActors = []; this.followups = []; this.cinemaActors.clear(); this.cinemaPrison = null; this.prisonActor=null; this.glamour=null; this.parryFlashUntil=0; this.parryChain=0;this.parrySignals=[];this.sharinganEchoes=[];
    this.formation = new MirrorFormation(); this.snowActive = false;
  }
  private arena(name: 'lakeside' | 'bridge') {
    const arena = ARENAS[name]; this.floor = arena.floor; this.arenaMin = arena.min; this.arenaMax = arena.max;
    this.physics.world.setBounds(arena.min, -350, arena.max - arena.min, 1200);
    const back = this.add.image(640, 350, `v2-${name}-background`).setDisplaySize(1350, 760).setScrollFactor(0).setDepth(-30);
    this.backgrounds.push(back);
    const ground = this.add.image(arena.width / 2, arena.floor - 25, `v2-${name}-ground`).setOrigin(.5, 0).setDisplaySize(arena.width + 80, 145).setDepth(-4);
    this.backgrounds.push(ground);
    this.floors = this.physics.add.staticGroup();
    const floor = this.add.rectangle(arena.width / 2, arena.floor + 32, arena.width, 64, 0, 0); this.physics.add.existing(floor, true); this.floors.add(floor);
    for (let i = 0; i < 3; i++) this.mist.push(namedArt(this, 'effects', 'smoke', i * 570 + 120, 470 - i * 80, 1050).setScrollFactor(0).setAlpha(.055).setDepth(6));
    this.cueGraphics = this.add.graphics().setDepth(8);
    this.cameras.main.setBounds(0, 0, arena.width, 720); this.cameras.main.setZoom(1); this.cameras.main.scrollX = 0; this.cameras.main.scrollY = 0;
    this.cameras.main.resetFX();
  }
  private enterPhase(state: StoryState) {
    this.clearStage(); this.phase = state.phase; const data = PHASES[this.phase]; this.arena(data.arena);
    this.now = 0; this.lastEmit = -100; this.lastHitStop = -9999; this.landedAt = -9999; this.phaseElapsed = 0; this.phaseEnding = false; this.gameOver = false; this.hitStop = 0; this.lastGround = 0; this.jumpQueued = -9999;
    this.ultimatesUsed=0;this.protection = 100; this.protectionHits = 0; this.protectionUntil = 0; this.sharingan = state.sharinganAwakened; this.narutoJoined = state.narutoInMirrors;
    this.mirrorGuardBreaks = 0; this.bossBreakAnnounced = 0; this.mirrorEnd = 0; this.mirrorInterruptUntil = 0; this.nextMirrorTransfer = 0; this.mistUntil = 0; this.readingUntil = 0; this.bossRestrainedUntil = 0;
    this.player = this.fighter('player', data.character, data.playerX, this.floor, false, 100); this.player.model.ultimate=100;
    this.boss = this.fighter('boss', data.boss, data.bossX, this.floor, true, data.hp); this.boss.model.facing = -1;
    this.player.body.body.pushable = false; this.boss.body.body.pushable = false;
    this.physics.add.collider(this.player.body, this.boss.body, undefined, () => this.player.model.grounded && this.boss.model.grounded && !['dash', 'airdash', 'slide', 'substitute'].includes(this.player.model.action?.definition.action || '') && !this.formation.active);
    this.brain = new BossBrain(this.boss.model, this.phase); this.targetX = this.player.model.x; this.targetY = this.floor - 72;
    this.stageStoryActors(); this.cameras.main.scrollX = clamp((data.playerX + data.bossX) / 2 - 640, 0, ARENAS[data.arena].width - 1280);
    bridge.checkpoint(this.phase); this.inputs.clear(); bridge.patch({screen: 'playing', character: data.character, health: 100, stamina: 100, chakra: 100, ultimate: 100,
      stage: data.title, objective: this.phase === 'mirrors' ? `Hold out ${Math.min(45,Math.floor(this.phaseElapsed))}/45s · Break Haku’s guard ${Math.min(1,this.mirrorGuardBreaks)}/1` : data.objective, phaseProgress: 0, phaseElapsed: 0, cinematic: '', ultimateCinematic:'', protection: this.phase === 'protect' ? 100 : null});
    this.sounds.setTrack(data.boss === 'haku' ? 'mirrors' : 'lakeside'); this.sounds.sync(true); this.emit();
    this.cameras.main.fadeIn(450, 4, 16, 24);
  }
  private fighter(key: string, id: CharacterId, x: number, feet: number, isBoss: boolean, hp: number, ally = false): Fighter {
    const body = this.add.rectangle(x, feet - 52, 44, 104, 0, 0) as BodyObject; this.physics.add.existing(body);
    body.body.setCollideWorldBounds(true).setMaxVelocity(920, 1050).setDragX(1900);
    this.physics.add.collider(body, this.floors);
    const model = new Combatant(id, hp, isBoss); model.x = x; model.y = feet;
    const sprite = this.add.sprite(x, feet, `${id}-locomotion`, '6').setDepth(isBoss?4:ally?4.5:5);
    const shadow = this.add.ellipse(x, this.floor + 2, isBoss ? 78 : 60, 11, 0x08131c, .28).setDepth(-1);
    const fighter: Fighter = {key, model, body, sprite, shadow, animation: 'idle', animationAt: this.now, lastStep: 0, ally, hostile: isBoss || key.startsWith('water-clone'), expires: 0, nextAttack: this.now + 700};
    this.fighters.push(fighter); this.drawFighter(fighter); return fighter;
  }
  private stageStoryActors() {
    const prop = (name: string, x: number, width = 105) => {const p = namedArt(this, 'props', name, x, this.floor, width).setOrigin(.5, 1).setDepth(2); p.setScale(158 / p.height); this.sceneryActors.push(p); return p;};
    if (this.phase === 'rescue') {
      const captive=this.add.sprite(1160,this.floor-48,'kakashi-techniques','8').setDepth(4);
      reactionPose(captive,'kakashi','restrained',0,-1); this.sceneryActors.push(captive);
      this.drawPrison(this.add.graphics().setDepth(5),captive.x,captive.y-78,0);
      const original = this.add.sprite(1050, this.floor, 'zabuza-techniques', '12').setDepth(2); poseBattle(original, 'zabuza', 'cast', 250, 1); this.sceneryActors.push(original);
      this.boss.sprite.setTint(0x85c6da).setAlpha(.83); const support=this.fighter('sasuke-ally', 'sasuke', 300, this.floor, false, 100, true); support.support=new SupportBrain();
    } else if (this.phase === 'protect') {prop('tazuna', 190, 92);}
    else if (this.phase === 'mirrors') {prop('tazuna', 120, 82);}
    else if (this.phase === 'seal' || this.phase === 'lightning') {
      const fallen = this.add.sprite(this.phase === 'seal' ? 260 : 1430, this.floor + 2, 'sasuke-techniques', '23').setDepth(1); poseBattle(fallen, 'sasuke', 'defeat', 1300, 1); this.sceneryActors.push(fallen);
      if (this.phase === 'lightning') {const haku = this.add.sprite(1490, this.floor, 'haku-techniques', '8').setDepth(1); poseBattle(haku, 'haku', 'guardbreak', 0, -1, undefined, 'unmasked'); this.sceneryActors.push(haku);}
    }
  }
  private modelPosition(f: Fighter) {f.model.x = f.body.x; f.model.y = f.body.y + 52; f.model.grounded = f.body.body.blocked.down || f.body.body.touching.down;}
  private box(f: Fighter) {const box = hurtbox(f.model.x, f.model.y, f.model.action?.definition.action === 'slide'); if (f.model.action?.definition.action !== 'slide') {box.height = CHARACTER[f.model.id].height * .8; box.y = f.model.y - box.height;} return box;}
  private drawFighter(f: Fighter) {
    const model = f.model; let animation = model.animation(this.now), duration = model.action?.definition.duration;
    if (animation === 'idle' && Math.abs(f.body.body.velocity.x) > 30) animation = 'run';if(animation==='run')duration=464;
    if (animation === 'idle' && model.grounded && f === this.player && this.now - this.landedAt < 145 && !model.guard) animation = 'land';
    let elapsed = this.now - f.animationAt;
    if (animation !== f.animation) {f.animation = animation; f.animationAt = this.now; elapsed = 0;}
    if (model.action) elapsed = this.now - model.action.started;
    if (model.chargeStarted !== null) {elapsed = 120; duration = 770;}
    if (animation === 'parry' && model.deflectUntil > this.now) elapsed = 240 - (model.deflectUntil - this.now);
    if (f === this.boss && model.action?.definition.action === 'boss') {
      const hits = model.action.definition.events.filter(e => e.kind === 'hit');
      if (hits.length) {const age = this.now - model.action.started; let index = hits.findIndex(e => age < e.at + 250); if (index < 0) index = hits.length - 1;
        const h = hits[index]; animation = h.red ? 'heavy' : (`light${index % 3 + 1}` as AnimationName); duration = 620; elapsed = clamp(280 + age - h.at, 0, 619);}
    }
    if(f===this.boss&&!model.grounded&&model.action?.definition.action==='boss'&&model.action.definition.events.some(e=>e.kind==='hit'))animation='aerial';
    if(f===this.player&&animation==='aerial'&&model.grounded&&this.now-this.landedAt<145){animation='land';elapsed=this.now-this.landedAt;duration=145;}
    f.sprite.setData('choreography',model.choreography);
    poseBattle(f.sprite, model.id, animation, elapsed, model.facing, duration, this.phase === 'seal' && model.id === 'naruto' ? 'awakened' : undefined); f.sprite.setPosition(model.x+(this.now<model.hurtUntil?model.lastHitDirection*7*Math.exp(-(this.now-model.damagedAt)/110):0), model.y + 2);
    if(model.id==='zabuza'&&animation!=='aerial'&&model.action?.definition.action==='boss'&&this.now>=model.hurtUntil&&this.now>=model.guardBrokenUntil){
      const sword=swordPresentation(model.action.definition,this.now-model.action.started);if(sword)poseZabuzaSword(f.sprite,sword.frame,model.facing);
    }
    if(model.id==='zabuza'){const flying=this.projectiles.find(p=>p.owner===f&&p.sword);const age=model.action?.definition.id==='sword-throw'?this.now-model.action.started:-1;
      if(f===this.boss&&this.barrage?.timeline.id==='water-spirits')poseWaterCast(f.sprite,this.barrage.timeline.age<700?this.barrage.timeline.age:this.barrage.timeline.age<5100?900:3400+(this.barrage.timeline.age-5100)*600/650,model.facing);
      else if(flying)swordPose(f.sprite,flying.sword?.phase==='returning'?13:6+Math.floor((this.now-flying.born)/150)%6,model.facing);
      else if(this.now<this.swordCatchUntil&&f===this.boss)swordPose(f.sprite,Math.min(17,14+Math.floor((500-this.swordCatchUntil+this.now)/125)),model.facing);
      else if(age>=0&&age<700)swordPose(f.sprite,age<220?0:age<520?1:2,model.facing);
    }
    if(this.now<model.hurtUntil&&this.now>=model.guardBrokenUntil&&model.health>0)poseHurt(f.sprite,model.id,this.now-model.damagedAt,model.lastHitDirection,model.id==='zabuza'&&this.projectiles.some(p=>p.owner===f&&p.sword));
    else if(this.now-model.damagedAt<100&&model.isBoss&&model.action){f.sprite.x+=model.lastHitDirection*4*Math.sin((this.now-model.damagedAt)/100*Math.PI);}
    if(f===this.boss&&this.mirrorEntering)poseBattle(f.sprite,'haku','jump',430,model.facing);
    if(f===this.boss&&this.mirrorExit){if(this.mirrorExit.stunned)pose21(f.sprite,0,this.mirrorExit.landedAt!==null?(this.mirrorExit.age-this.mirrorExit.landedAt<450?4:5):this.mirrorExit.age<100?0:this.mirrorExit.age<180?1:this.mirrorExit.vy<380?2:3,model.facing);else poseBattle(f.sprite,'haku',this.mirrorExit.landedAt!==null?'land':'jump',this.mirrorExit.landedAt!==null?this.mirrorExit.age-this.mirrorExit.landedAt:430,model.facing);}
    f.shadow.setPosition(model.x, this.floor + 2).setScale(clamp(1 - (this.floor - model.y) / 550, .25, 1));
    const hidden = f === this.boss && this.formation.active && this.formation.occupied >= 0 && this.now >= this.mirrorInterruptUntil;
    f.sprite.setVisible(!hidden); f.shadow.setVisible(!hidden);
    if (f.key.startsWith('water-clone')) f.sprite.setAlpha(.55).setTint(0x7fdef0);
    else if (f.key.startsWith('clone')) f.sprite.setAlpha(.6).setTint(0xc1ddf5);
    else if (this.phase === 'rescue' && f === this.boss) f.sprite.setAlpha(.8).setTint(0x86c8dc);
    else {f.sprite.setAlpha(this.now < model.immuneUntil && !model.action?.definition.invulnerable && Math.floor(this.now / 70) % 2 ? .48 : 1);
      if(this.now<model.hurtUntil&&this.now-model.damagedAt<65&&!bridge.settings().reducedShake)f.sprite.setTintFill(0xfff1d4);
      else if (this.now < model.guardBrokenUntil) f.sprite.setTint(0xffb35b);
      else if (this.now < model.hurtUntil) f.sprite.setTint(0xffd18b);
      else if (this.now - model.damagedAt < 65) f.sprite.setTint(0xb4d6e3);
      else if (this.phase === 'seal' && f === this.player) f.sprite.setTint(0xffbc9a); else f.sprite.clearTint();}
    if (this.now < model.hurtUntil || this.now < model.guardBrokenUntil) f.sprite.setAlpha(1);
    if (animation === 'run' && this.now - f.lastStep >= 255 && model.grounded) {f.lastStep = this.now; this.sounds.effect('step', .2);}
  }
  update(_time: number, delta: number) {
    let dt = Math.min(delta, 50); const screen = bridge.get().screen;
    this.inputs.poll();
    this.backgrounds[0]?.setDisplaySize(1350/this.cameras.main.zoom,760/this.cameras.main.zoom);
    if(this.transitionActive&&screen!=='paused'){this.updateTransition(dt);this.inputs.endFrame();return;}
    if (screen === 'paused' || screen === 'dead' || screen === 'victory') {this.inputs.endFrame(); return;}
    if (this.director.mode === 'cinematic') {this.updateCinema(dt); this.inputs.endFrame(); return;}
    if (screen !== 'playing' || this.gameOver || !this.player || !this.boss) {this.inputs.endFrame(); return;}
    if (this.ultimateBurst) {this.updateUltimate(dt); this.inputs.endFrame(); return;}
    if (this.hitStop > 0) {this.hitStop -= dt; this.physics.world.pause(); if (this.hitStop <= 0) this.physics.world.resume(); this.inputs.endFrame(); return;}
    this.readingSlow = Math.max(0, this.readingSlow - dt);
    const timeScale = this.readingSlow > 0 ? .55 : 1; this.physics.world.timeScale = 1 / timeScale; dt *= timeScale;
    this.physics.world.resume(); this.now += dt; this.elapsed += dt / 1000; this.phaseElapsed += dt / 1000;
    for (const f of this.fighters) this.modelPosition(f);
    this.controlPlayer();
    if (this.ultimateBurst) {this.inputs.endFrame(); return;}
    this.controlBoss(); this.controlAllies();
    for (const f of this.fighters) {for (const event of f.model.update(this.now, dt)) this.actionEvent(f, event.event, event.key, event.charge);}
    for (const followup of this.followups.filter(e => e.at <= this.now && e.fighter.model.action?.serial === e.serial)) this.actionEvent(followup.fighter, followup.event, followup.key, 1);
    this.followups = this.followups.filter(e => e.at > this.now);
    this.updateProjectiles(dt); this.updateMirrors(); this.updateEffects(dt); this.updateCues(dt);
    for (const f of this.fighters) this.drawFighter(f);
    if(this.boss.model.guardBrokenUntil>this.now)this.guardBreakEffect(this.boss);
    this.progressStory(dt); this.trackCamera(); this.inputs.endFrame();
    if (this.now - this.lastEmit > 65) {this.lastEmit = this.now; this.emit();}
  }
  private trackCamera() {
    this.backgrounds[0].setDisplaySize(1350/this.cameras.main.zoom,760/this.cameras.main.zoom);
    if(this.barrage?.timeline.id==='diving-dragon'){const camera=this.cameras.main;camera.removeBounds();camera.setZoom(Phaser.Math.Linear(camera.zoom,.72,.1));camera.centerOn(ARENAS[PHASES[this.phase].arena].width/2,320);return;}
    if(this.barrage||this.formation.active){const camera=this.cameras.main,arena=ARENAS[PHASES[this.phase].arena];camera.setZoom(Phaser.Math.Linear(camera.zoom,1280/(arena.width+40),.075));camera.centerOn(arena.width/2,360);return;}
    this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom,this.effects.some(e=>e.chakra21)?.85:1,.09));
    this.cameras.main.scrollY=Phaser.Math.Linear(this.cameras.main.scrollY,0,.09);
    const width = ARENAS[PHASES[this.phase].arena].width;
    const target = clamp((this.player.model.x * .62 + this.boss.model.x * .38) - 640, 0, width - 1280);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, target, .065);
    this.backgrounds[0].x = 640 - this.cameras.main.scrollX * .075;
  }
  private stopForImpact(duration = 30) {if(this.barrage)duration=Math.min(duration,12);if (this.now - this.lastHitStop < 150) return; this.lastHitStop = this.now; this.hitStop = duration;}
  private shake(amount = .0025, duration = 100) {if (!bridge.settings().reducedShake) this.cameras.main.shake(duration, amount);}
  private beginUltimate() {
    this.ultimatesUsed++;this.cameras.main.removeBounds();const p=this.player.model,b=this.boss.model,ability=kit(this.phase)[2];
    this.ultimateTargetStart={x:b.x,y:b.y};this.ultimateCamera={zoom:this.cameras.main.zoom,scrollX:this.cameras.main.scrollX};
    this.physics.world.pause(); this.hitStop=0; this.inputs.clear();
    if(this.formation.active) {
      const occupied=this.formation.mirrors[this.formation.occupied];this.mirrorExit=null;this.mirrorEntering=null;this.mirrorShotQueue=[];this.mirrorVisuals.forEach(v=>{v.reflection.setVisible(false);v.halo.setVisible(false);});
      this.mirrorInterruptUntil=this.now+2600;
      if(occupied){const reflection=this.mirrorVisuals[this.formation.occupied]?.reflection;this.ultimateTargetStart={x:reflection?.x??occupied.x,y:reflection?.y??mirrorFeet(occupied.y,this.floor)};this.teleport(this.boss,clamp(occupied.x,this.arenaMin+90,this.arenaMax-90),this.ultimateTargetStart.y);}

    }
    if(!this.ultimateTargetStart&&b.y<this.floor-4)this.ultimateTargetStart={x:b.x,y:b.y};
    p.facing=p.x<=b.x?1:-1; if(p.action)p.action.facing=p.facing;
    this.boss.sprite.setVisible(true).setAlpha(1);
    b.action=null;b.guard=false;this.brain.readyAt=Math.max(this.brain.readyAt,this.now+1000);
    this.ultimateBurst=new UltimateBurst(this,PHASES[this.phase].character,ability.label,p.x,b.x,this.floor,p.facing,beat=>{
      if(beat==='charge'){this.sounds.ultimate(p.id as 'kakashi'|'naruto'|'sasuke'|'sakura','charge');this.sounds.voice(p.id,'cast');}
      else if(beat==='finish'){this.sounds.ultimate(p.id as 'kakashi'|'naruto'|'sasuke'|'sakura','finish');this.shake(.006,180);}
      else this.sounds.effect('impact2',.75);
    },bridge.settings().reducedShake);
    bridge.patch({ultimateCinematic:ability.label,ultimate:p.ultimate}); this.emit();
  }
  private updateUltimate(dt:number) {
    const burst=this.ultimateBurst!;this.physics.world.pause();const state=burst.update(dt),p=this.player.model;
    this.teleport(this.player,clamp(state.x,this.arenaMin+32,this.arenaMax-32),this.floor);
    burst.pose(this.player.sprite);
    const landing=clamp(burst.age/500,0,1),start=this.ultimateTargetStart;
    if(start){const y=Phaser.Math.Linear(start.y,this.floor,landing*landing);this.teleport(this.boss,start.x,y);this.boss.sprite.setPosition(start.x,y).setVisible(true).setAlpha(1);
      if(landing<1&&this.boss.model.id==='haku')poseHakuV13(this.boss.sprite,'mirror-knockdown',landing<.35?1:3,-1);
      else poseBattle(this.boss.sprite,this.boss.model.id,burst.impacted?'hurt':'idle',burst.impacted?Math.min(180,burst.age-1330):burst.age,this.boss.model.facing);
    }

    if(state.impact){
      if(this.phase==='seal'){
        const targets = this.formation.mirrors.filter(m => !m.broken).sort((a,b) => Math.abs(a.x-this.boss.model.x)-Math.abs(b.x-this.boss.model.x)).slice(0,2);
        for (const mirror of targets) {mirror.hp=0;mirror.broken=true;const visual=this.mirrorVisuals[this.formation.mirrors.indexOf(mirror)];visual?.image.setVisible(false);visual?.reflection.setVisible(false);visual?.halo.setVisible(false);burst.shatterMirror(mirror.x,mirror.y);}
        if(this.formation.count()<=2)this.endMirrors();
      }
      burst.impacted=true;const event=kit(this.phase)[2].attack.events[0];
      this.boss.model.immuneUntil=0;
      this.hit(this.player,this.boss,{...event,kind:'hit',posture:64},`ultimate-${p.serial}`);
      if(this.boss.model.guardBrokenUntil<=this.now)this.boss.model.stagger(this.now,650);
      poseBattle(this.boss.sprite,this.boss.model.id,'hurt',120,this.boss.model.facing);
      this.boss.sprite.setTint(0xffe2ae).setAlpha(1);
    }
    const camera=this.cameras.main,settling=burst.age>=1650;
    camera.setZoom(Phaser.Math.Linear(camera.zoom,settling?this.ultimateCamera.zoom:Math.min(.84,1100/(Math.abs(burst.toX-burst.fromX)+640)),.12));
    if(!settling)camera.centerOn((burst.fromX+burst.toX)/2,this.floor-200);else{camera.scrollX=Phaser.Math.Linear(camera.scrollX,this.ultimateCamera.scrollX,.12);camera.scrollY=Phaser.Math.Linear(camera.scrollY,0,.12);}
    if(state.complete){
      camera.setBounds(0,0,ARENAS[PHASES[this.phase].arena].width,720);camera.setZoom(this.ultimateCamera.zoom);camera.scrollY=0;camera.scrollX=this.ultimateCamera.scrollX;burst.destroy();this.ultimateBurst=null;this.ultimateTargetStart=null;p.action=null;p.immuneUntil=this.now+550;p.hitTargets.clear();
      if(this.formation.active){this.formation.occupied=-1;this.mirrorInterruptUntil=this.now+900;this.nextMirrorTransfer=this.now+900;}this.hitStop=0;this.elapsed+=2;this.phaseElapsed+=2;this.sounds.duck(false);
      this.physics.world.resume();this.inputs.clear();bridge.patch({ultimateCinematic:''});this.updateCues(0);this.emit();this.progressStory(0);
    }
  }
  private controlPlayer() {
    const f = this.player, p = f.model, body = f.body.body, input = this.inputs;
    const axis = Number(input.held('right')) - Number(input.held('left'));
    if (p.grounded) {if (this.now - this.lastGround > 100) this.landedAt = this.now; this.lastGround = this.now;}
    if (input.pressed('jump')) this.jumpQueued = this.now;
    if (axis && (!p.action || p.canAct(this.now, true) && (input.pressed('dash') || input.pressed('parry'))) && this.now >= p.hurtUntil) p.facing = axis as -1 | 1;
    p.setGuard(input.held('parry'), input.pressed('parry'), this.now);
    if (input.pressed('dash')) {
      const action = !p.grounded ? 'airdash' : input.held('down') && axis ? 'slide' : 'dash';
      if (axis) p.facing = axis as -1 | 1;
      if (p.start(UNIVERSAL[action], this.now) && action === 'airdash') body.setVelocityY(-35);
    }
    if (input.pressed('substitute')) p.start(UNIVERSAL.substitute, this.now);
    if (this.now - this.jumpQueued <= COMBAT.jumpBuffer && this.now - this.lastGround <= COMBAT.coyote && p.canAct(this.now) && !p.guard) {
      body.setVelocityY(-COMBAT.jump); p.grounded = false; this.lastGround = -9999; this.jumpQueued = -9999;
    }
    if (input.released('jump') && body.velocity.y < -200) body.setVelocityY(body.velocity.y * .48);
    if (input.pressed('melee')) {
      if (input.held('down') && p.grounded) p.beginCharge(this.now); else p.bufferMelee(this.now);
    }
    if (input.released('melee') && p.chargeStarted !== null) p.releaseCharge(this.now);
    if (!p.guard && p.chargeStarted === null) p.consumeMelee(this.now);
    if (input.pressed('tool') || input.held('tool') && p.canAct(this.now)) p.start(UNIVERSAL.tool, this.now);
    const abilities = kit(this.phase);
    if (input.pressed('skill1')) p.start(abilities[0].attack, this.now);
    if (input.pressed('skill2')) p.start(abilities[1].attack, this.now);
    if (input.pressed('ultimate') && p.start(abilities[2].attack, this.now)) {this.beginUltimate(); return;}
    if (this.now < p.guardBrokenUntil || this.now < p.hurtUntil) return;
    if (f.rush && (this.now >= f.rush.until || p.action?.serial !== f.rush.serial)) f.rush = undefined;
    if (f.rush) {body.setVelocityX(clamp((f.rush.x - p.x) * 16, -900, 900)); return;}
    const action = p.action;
    if (action) {
      const def = action.definition, age = this.now - action.started;
      if (['dash', 'airdash', 'slide'].includes(def.action)) {
        body.setVelocityX(action.facing * (def.move || 0) * (1 - Math.max(0, age / def.duration - .5) * .8));
        if (def.action === 'airdash') body.setVelocityY(-15);
      } else if (def.move) body.setVelocityX(action.facing * def.move * (age > 80 && age < def.cancelAt ? 1 : .2));
      else body.setVelocityX(0);
    } else if (p.chargeStarted !== null) body.setVelocityX(0);
    else {const speed = p.guard ? COMBAT.guardSpeed : COMBAT.speed; body.setVelocityX(Phaser.Math.Linear(body.velocity.x, axis * speed, p.grounded ? .42 : .2));}
  }
  private diveVisual:Phaser.GameObjects.Image|null=null;private divePuddle:Phaser.GameObjects.Image|null=null;private diveHit=false;
  private startBarrage(id:BarrageId){
    const d=BARRAGES[id],b=this.boss.model;
    if(!b.start({id:`barrage-${id}`,action:'boss',animation:'cast',duration:d.duration,cancelAt:d.duration,stamina:35,events:[{at:d.recovery,kind:'technique'}]},this.now))return;
    this.barrageLast=this.now;this.barrageAttack=this.brain.attacks;this.barrageIndex++;
    this.projectiles.forEach(p=>{if(!p.friendly){if(p.water)this.endWater(p,'cancel');else p.expires=0;}});
    const seed=(Math.floor(this.now)*101+this.barrageIndex*719)>>>0,variant=this.requestedVariant??chooseVariant(seed,this.variantHistory[id]);this.variantHistory[id]=variant;
    this.barrage={timeline:new BarrageTimeline(id,this.arenaMin,this.arenaMax,this.player.model.x<(this.arenaMin+this.arenaMax)/2?-1:1,variant,seed),originX:b.x,originY:this.floor,airX:this.player.model.x<(this.arenaMin+this.arenaMax)/2?this.arenaMax-170:this.arenaMin+170,serial:b.action!.serial};
    this.boss.body.body.setVelocity(0).setAllowGravity(false);this.mirrorInterruptUntil=Infinity;this.diveHit=false;this.mirrorVisuals.forEach(v=>v.reflection.setVisible(false));
    this.mirrorVisuals.forEach(m=>m.image.setAlpha(.2));if(d.boss==='zabuza')this.sounds.softWater();else this.sounds.effect('ice',.6);
  }
  private endBarrage(interrupted=false){
    const active=this.barrage;if(!active)return;
    const b=this.boss.model;this.cameras.main.setBounds(0,0,ARENAS[PHASES[this.phase].arena].width,720);this.barrage=null;this.pendingWater=[];this.diveVisual?.destroy();this.diveVisual=null;this.divePuddle?.destroy();this.divePuddle=null;
    this.projectiles.forEach(p=>{if(p.barrage){if(p.water){if(interrupted)this.endWater(p,'cancel');}else{p.expires=0;p.image.setVisible(false);}}});this.barrageHazards.forEach(h=>h.image.destroy());this.barrageHazards=[];this.barrageMirrors.forEach(m=>m.destroy());this.barrageMirrors=[];for(const images of this.barrageBuilds.values())images.forEach(i=>i.destroy());this.barrageBuilds.clear();
    this.boss.body.body.setAllowGravity(true).setVelocity(0);this.teleport(this.boss,clamp(b.x,this.arenaMin+45,this.arenaMax-45),this.floor);
    this.mirrorInterruptUntil=this.now+800;this.mirrorVisuals.forEach(m=>m.image.setAlpha(.65));
    if(b.action?.definition.id.startsWith('barrage-'))b.action=null;
    this.brain.readyAt=Math.max(this.brain.readyAt,this.now+(interrupted?800:100));
  }
  private mirrorEntering:{at:number;from:{x:number;y:number};to:{x:number;y:number};index:number}|null=null;
  private mirrorShotQueue:{f:Fighter;event:AttackEvent;key:string;indices:number[];target:{x:number;y:number};at:number;tries:number}[]=[];
  private mirrorAttackOrigins(){return mirrorOrigins(this.formation.occupied,this.formation.mirrors.map((m,i)=>m.broken?-1:i).filter(i=>i>=0),this.boss.model.action?.serial||0,this.boss.model.action?.definition.id==='ice-prison-rush'?3:2);}
  private fireMirrorGroup(q:typeof this.mirrorShotQueue[number]){
    const shots=q.indices.filter(i=>!this.formation.mirrors[i]?.broken).flatMap(i=>{const r=this.mirrorVisuals[i]?.reflection;if(!r)return [];const origin={x:r.x+(q.target.x>r.x?20:-20),y:r.y-95};return Array.from({length:q.event.count||1},(_,n)=>{const offset=(n-((q.event.count||1)-1)/2)*.14;return{...origin,...fixedAim(origin,q.target,(q.event.speed||440)*1.25*HOSTILE_SPEED,offset),rx:18,ry:3,i,offset};});});
    const existing=this.projectiles.filter(p=>!p.friendly&&p.expires>this.now&&(!p.water||p.water.phase==='travel'));
    const gap=aimedWaterRoute(this.player.model.x,{x:this.player.model.x,y:this.floor-400},this.arenaMin,this.arenaMax,[...existing,...shots],this.floor,this.player.model.stamina>=22,1020);if(!gap)return false;
    for(const shot of shots)this.launch(q.f,q.event,shot.offset,q.key,{x:shot.x,y:shot.y,target:q.target});return true;
  }
  private pendingWater:{volley:PreparedVolley;at:number;tries:number}[]=[];
  private updateBarrage(){
    const active=this.barrage;if(!active)return;const b=this.boss.model,t=active.timeline;
    if(b.health<=0||b.action?.serial!==active.serial||this.now<b.guardBrokenUntil||this.now<b.hurtUntil||this.now<this.bossRestrainedUntil){this.endBarrage(true);return;}
    const age=this.now-this.barrageLast;
    const volleys=t.tick(Math.max(0,age-t.age),this.player.model.x);
    if(t.id==='diving-dragon'){this.updateDiveDragon(age);if(t.done)this.endBarrage();return;}
    this.boss.body.body.setVelocity(0);b.guard=false;
    if(t.id==='water-spirits'){
      b.facing=this.player.model.x>=active.airX?1:-1;
      const rise=Math.min(1,age/700),land=age>5100?Math.max(0,1-(age-5100)/650):1;
      this.teleport(this.boss,Phaser.Math.Linear(active.originX,active.airX,rise),this.floor-Math.sin(rise*Math.PI/2)*230*land);
    }
    for(const v of t.warnings){if(v.style==='pairs'||v.style==='streams')continue;if(!v.secured){const gap=chooseCorridor(this.player.model.x,v.gap,this.arenaMin,this.arenaMax,this.projectiles.filter(p=>!p.friendly&&p.expires>this.now&&(!p.water||p.water.phase==='travel')),this.floor);v.secured=true;v.omit=!gap;if(gap){v.gap=gap;v.lanes=[];for(let x=this.arenaMin+38;x<this.arenaMax-38;x+=76)if(x<gap.left-52||x>gap.right+52)v.lanes.push(x);}}}
    for(const v of volleys)if(v.style==='pairs'||v.style==='streams')this.pendingWater.push({volley:v,at:this.now,tries:0});else if(!v.omit)this.emitBarrageVolley(v);
    const pending=this.pendingWater;this.pendingWater=[];for(const p of pending){if(this.now<p.at){this.pendingWater.push(p);continue;}if(!this.aimedWater(p.volley)&&p.tries<3){p.tries++;p.at=this.now+100;this.pendingWater.push(p);}}
    if(t.warnings.some(v=>v.style==='lunge'))this.projectiles.forEach(p=>{if(p.barrage){p.expires=0;p.image.setVisible(false);}});
    for(const h of this.barrageHazards){const a=this.now-h.born;animateEffect(h.image,'water-dragon',a,650);h.image.setAlpha(Math.min(1,(650-a)/180));if(a>=70&&a<500)for(const f of this.fighters.filter(f=>!f.hostile))if(!h.hit.has(f.key)&&overlaps(this.box(f),{x:h.x-42,y:this.floor-165,width:84,height:165})){h.hit.add(f.key);this.hit(this.boss,f,{at:0,kind:'hit',damage:12,posture:20,red:true,effect:'water'},`barrage-${active.serial}-${h.born}-${h.x}`);}}
    this.barrageHazards=this.barrageHazards.filter(h=>{if(this.now-h.born>650){h.image.destroy();return false;}return true;});
    if(t.done)this.endBarrage();
  }
  private updateDiveDragon(age:number){
    const active=this.barrage!,b=this.boss.model;this.boss.body.body.setVelocity(0);b.facing=this.player.model.x>=b.x?1:-1;
    const hand=waterHand(b.x,b.y,b.facing),t=active.timeline;
    if(!this.diveVisual)this.diveVisual=makeEffect(this,'water-dragon',hand.x,hand.y,80,45).setDepth(10);
    const dragon=this.diveVisual;
    const v=t.prepared.get(0);if(v&&!v.releaseTarget){v.targetX=diveTarget(v.targetX,this.arenaMin,this.arenaMax);v.releaseTarget={x:v.targetX,y:this.floor};}
    const target=v?.targetX??this.player.model.x;
    if(age<900){dragon.setPosition(hand.x,hand.y).setDisplaySize(45+age*.08,40+age*.05);animateEffect(dragon,'waterfall',age%500,500);}
    else if(age<1800){const u=(age-900)/900;dragon.setPosition(Phaser.Math.Linear(hand.x,active.originX+(t.variant?170:-170),u),Phaser.Math.Linear(hand.y,240,u)).setDisplaySize(180+u*270,90+u*140).setRotation(-Math.PI/2);animateEffect(dragon,'water-dragon',age,3900);}
    else if(age<2450){dragon.setPosition(clamp(target+(t.variant?-180:180),this.arenaMin+120,this.arenaMax-120),240).setDisplaySize(450,225).setRotation(Math.atan2(this.floor-240,target-dragon.x));animateEffect(dragon,'water-dragon',age,3900);
      if(!this.divePuddle)this.divePuddle=this.add.image(target,this.floor,'v15-water','0').setOrigin(.5,282/320).setDisplaySize(250,145).setDepth(8);
      this.divePuddle.setFrame(String(Math.min(7,Math.floor((age-1800)/650*8))));
    }else if(age<2900){const u=(age-2450)/450,startX=clamp(target+(t.variant?-180:180),this.arenaMin+120,this.arenaMax-120);dragon.setPosition(Phaser.Math.Linear(startX,target,u),Phaser.Math.Linear(240,this.floor-45,u)).setRotation(Math.atan2(this.floor-285,target-startX));animateEffect(dragon,'water-dragon',age,3900);}
    else {this.divePuddle?.setVisible(false);waterImpact(dragon,target,this.floor,age-2900,true);dragon.setDisplaySize(370,250);if(!this.diveHit){this.diveHit=true;this.sounds.softWater();this.shake(.003,160);for(const f of this.fighters.filter(f=>!f.hostile))if(overlaps(this.box(f),{x:target-125,y:this.floor-140,width:250,height:140}))this.hit(this.boss,f,{at:0,kind:'hit',damage:13,posture:25,red:true,effect:'water'},`dive-${active.serial}`);}if(age>3380)dragon.setVisible(false);}
    if(age>=900&&age<1800)effect21(dragon,2,Math.min(3,Math.floor((age-900)/300)),220+Math.min(1,(age-900)/900)*170,260+Math.min(1,(age-900)/900)*100).setRotation(0);
    else if(age>=1800&&age<2450)effect21(dragon,2,3,420,270).setRotation(0);
    else if(age>=2450&&age<2900)effect21(dragon,2,4,280,380).setRotation(0);
    else if(age>=2900)effect21(dragon,2,age<3050?5:age<3250?6:7,370,230).setRotation(0);
  }
  private barrageShot(x:number,y:number,tx:number,ty:number,water=false){
    if(this.projectiles.filter(p=>!p.friendly&&p.expires>this.now).length>=48)return;
    const image=this.projectilePool.pop()||this.add.image(x,y,water?'v11-spirit':'v8-needle');
    const aim=fixedAim({x,y},{x:tx,y:ty},(water?850:787.5)*HOSTILE_SPEED,0);
    image.setTexture(water?'v14-dragon':'v14-ice',water?'4':'0').setActive(true).setVisible(true).clearTint().setAlpha(1).setOrigin(water?.85:.85,.5).setDisplaySize(water?200:74,water?88:17).setPosition(x,y).setRotation(aim.angle).setFlipX(false).setDepth(10);
    this.projectiles.push({image,x,y,vx:aim.vx,vy:aim.vy,damage:7,posture:6,red:false,friendly:false,owner:this.boss,expires:water?Infinity:this.now+2600,water:water?{phase:'travel',at:this.now}:undefined,rx:water?20:18,ry:water?12:3,kind:water?'spirit':'needle',hit:new Set(),born:this.now,trail:[],pooled:true,barrage:true});
  }
  private aimedWater(v:PreparedVolley){
    const b=this.boss.model,target={x:this.player.model.x,y:this.player.model.y-65},hand=waterHand(b.x,b.y,b.facing),origins=[-9,9].map(d=>launchFromHand(hand,target,d));
    const proposed=origins.map(o=>({...o,...fixedAim(o,target,850*HOSTILE_SPEED,0),rx:20,ry:12}));
    const existing=this.projectiles.filter(p=>!p.friendly&&p.expires>this.now&&(!p.water||p.water.phase==='travel'));
    const gap=aimedWaterRoute(this.player.model.x,hand,this.arenaMin,this.arenaMax,[...existing,...proposed],this.floor,this.player.model.stamina>=22,1020);
    if(!gap)return false;
    v.releaseTarget=target;v.handOrigin=hand;v.gap=gap;this.clearBarrageCorridor(v);this.sounds.softWater();
    for(const o of origins){const before=this.projectiles.length;this.barrageShot(o.x,o.y,target.x,target.y,true);if(this.projectiles.length>before){const p=this.projectiles.at(-1)!;p.handLaunch=true;p.image.setDisplaySize(24,11);}}
    return true;
  }
  private eruptionLanes(v:PreparedVolley){
    if(v.style==='central')return v.lanes.filter(x=>Math.abs(x-(this.arenaMin+this.arenaMax)/2)<220).filter((_,i)=>i%2===0);
    if(v.style==='inward'){const center=(this.arenaMin+this.arenaMax)/2,step=v.index%3;return v.lanes.filter(x=>Math.abs(x-center)>(2-step)*175).filter((_,i)=>i%2===0);}
    return v.lanes.filter((_,i)=>i%2===v.index%2);
  }
  private clearBarrageCorridor(v:PreparedVolley){
    // Launched shots keep their flight; the next route was secured before its warning.
    // Floor eruptions are distinct successive bursts; no residual hitbox blocks the changing gap.
    this.barrageHazards.forEach(h=>h.image.destroy());this.barrageHazards=[];
    if(!['mirror-fan','opposed'].includes(v.style)){for(const image of this.barrageBuilds.get(v.index)||[])image.destroy();this.barrageBuilds.delete(v.index);}
  }
  private emitBarrageVolley(v:PreparedVolley){
    const t=this.barrage!.timeline,id=t.id,b=this.boss.model;this.clearBarrageCorridor(v);
    if(id.startsWith('water'))this.sounds.softWater();else this.sounds.effect('ice',.6);
    const shot=(x:number,y:number,tx:number,ty:number,water=false)=>{const aim=fixedAim({x,y},{x:tx,y:ty},(water?850:787.5)*HOSTILE_SPEED,0);if(v.style!=='surge'&&entersCorridor({x,y,...aim,rx:water?20:18,ry:water?12:3},v.gap,this.floor))return null;const count=this.projectiles.length;this.barrageShot(x,y,tx,ty,water);const p=this.projectiles.length>count?this.projectiles.at(-1)!:null;if(p){p.safeGap=v.gap;if(id==='needle-curtain')p.image.setDisplaySize(148,25);}return p;};
    if(['mirror-fan','opposed'].includes(v.style)){for(const m of this.barrageBuilds.get(v.index)||[]){const r=m.getData('mirrorReflection') as Phaser.GameObjects.Sprite;if(!r)continue;const lanes=v.lanes.filter((_,i)=>i%2===v.index%2);for(const tx of lanes.slice(0,5))shot(r.x,r.y-95,tx,this.floor+110);}return;}
    if(['eruption','inward','central'].includes(v.style)){
      for(const x of this.eruptionLanes(v)){const image=makeEffect(this,'water-dragon',x,this.floor-(v.style==='central'?135:117.5),v.style==='central'?270:235,v.style==='central'?155:135).setRotation(-Math.PI/2).setDepth(9);this.barrageHazards.push({x,born:this.now,hit:new Set(),image});}return;
    }
    if(v.style==='surge'){
      for(const side of [-1,1]){const x=side<0?this.arenaMin+45:this.arenaMax-45,target=side<0?v.gap.left-65:v.gap.right+65;const p=shot(x,this.floor-28,target,this.floor-28,true);if(!p)continue;p.groundWave=true;p.groundEndX=target;p.waterRow=0;p.image.setTexture('v14-wave','4').setDisplaySize(300,126);p.rx=42;p.ry=28;p.red=true;p.damage=13;}
      return;
    }
    if(v.style==='lunge'){
      this.projectiles.forEach(p=>{if(p.barrage&&!p.friendly){p.expires=0;p.image.setVisible(false);}});
      const dir=v.targetX>=b.x?1:-1,range=Math.min(480,Math.abs(v.targetX-b.x)+60),event:AttackEvent={at:0,kind:'hit',damage:13,posture:25,red:true,range,height:100,effect:'ice'};
      const outline=redOutline('crimson-lunge',b.x,this.floor,dir,event);for(const f of this.fighters.filter(f=>!f.hostile))if(outlineHits(outline,this.box(f)))this.hit(this.boss,f,event,`barrage-lunge-${this.barrage!.serial}`);
      this.teleport(this.boss,clamp(b.x+dir*(range-50),this.arenaMin+40,this.arenaMax-40),this.floor);this.burst('ice-shards',b.x,this.floor-70,260,240);return;
    }
    if(v.style==='curtain'||v.style==='diagonal'){
      for(const tx of v.lanes){const side=tx<v.gap.left?-1:1,offset=v.style==='diagonal'?side*(100+v.spread*45):0;
        shot(clamp(tx+offset,this.arenaMin+20,this.arenaMax-20),this.floor-395,tx,this.floor+100);}
      return;
    }
    const both=['opposed','crossing','fan'].includes(v.style),sides=both?[v.leftFirst,!v.leftFirst]:[v.index%2===0? v.leftFirst:!v.leftFirst];
    for(const left of sides){const lanes=v.lanes.filter(x=>left?x<v.gap.left:x>v.gap.right);if(!lanes.length)continue;
      const origin=left?Math.min(...lanes):Math.max(...lanes),water=v.style==='crossing';
      let originY=this.floor-355;
      if(!water){const mirror=mirrorVisual(this,origin,this.floor-355,this.floor,'crossfire',3);originY=mirror.image.y;this.barrageMirrors.push(mirror.image,mirror.reflection as unknown as Phaser.GameObjects.Image);}
      const count=water?4:v.style==='opposed'?5:7;
      for(let i=0;i<count;i++){const tx=lanes[Math.round(i*(lanes.length-1)/(count-1))];shot(water?(left?this.arenaMax-50:this.arenaMin+50):origin,water?this.floor-520:originY,tx,this.floor+110,water);}
    }
  }
  private redWarning(x:number,y:number){const g=this.cueGraphics;g.lineStyle(4,0xff4e59,1);g.lineBetween(x,y-11,x,y+1);g.fillStyle(0xff4e59,1);g.fillCircle(x,y+9,3);}
  private drawBarrageCues(){
    if(!this.barrage)return;const t=this.barrage.timeline,b=this.boss.model;if(t.id==='diving-dragon'){if(t.age>=1800&&t.age<2900)this.redWarning(b.x,b.y-190);return;}
    for(const v of t.warnings){
      if(v.omit)continue;
      const progress=clamp((t.age-v.at+650)/650,0,1);
      if(['mirror-fan','opposed'].includes(v.style)){
        if(!this.barrageBuilds.has(v.index)){const xs=[this.arenaMin+155,this.arenaMax-155,v.leftFirst?this.arenaMin+425:this.arenaMax-425];const images=xs.map(x=>{const m=mirrorVisual(this,x,this.floor-350,this.floor,'crossfire',3);this.barrageMirrors.push(m.image,m.reflection as unknown as Phaser.GameObjects.Image);return m.image;});this.barrageBuilds.set(v.index,images);}
        for(const m of this.barrageBuilds.get(v.index)||[]){const r=m.getData('mirrorReflection') as Phaser.GameObjects.Sprite;poseReflection(r,m,'crossfire',t.age>=v.at-400,this.now,this.player.model.x>r.x?1:-1);m.setAlpha(.82);r.setAlpha(.82);}continue;
      }
      const floorHazard=['eruption','inward','central'].includes(v.style),red=floorHazard||v.style==='lunge'||v.style==='surge';
      if(red)this.redWarning(b.x,b.y-CHARACTER[b.id].height-24);
      if(!this.barrageBuilds.has(v.index)){
        const palm=waterHand(b.x,b.y,b.facing);
        const origins=floorHazard?this.eruptionLanes(v):v.style==='surge'?[this.arenaMin+45,this.arenaMax-45]:v.style==='pairs'||v.style==='streams'?[palm.x]:v.lanes;
        const images=origins.map(x=>this.add.image(x,floorHazard||v.style==='surge'?this.floor:v.style==='pairs'||v.style==='streams'?palm.y:this.floor-360,floorHazard||v.style==='surge'?'v11-eruption':t.id.startsWith('water')?'v11-spirit':'v11-ice','0').setOrigin(.5,floorHazard?480/512:.5).setDisplaySize(floorHazard?140:t.id.startsWith('water')?115:50,floorHazard?90:t.id.startsWith('water')?60:48).setDepth(8));
        this.barrageBuilds.set(v.index,images);
      }
      for(const image of this.barrageBuilds.get(v.index)||[]){if(floorHazard||v.style==='surge')image.setTexture('v15-water',String(Math.min(7,Math.floor(progress*8)))).setOrigin(.5,282/320).setPosition(image.x,this.floor).setDisplaySize(195,170);else if(v.style==='pairs'||v.style==='streams'){const hand=waterHand(b.x,b.y,b.facing);image.setPosition(hand.x,hand.y);animateEffect(image,'waterfall',progress*280,650);image.setDisplaySize(40+progress*18,36+progress*14);}else animateEffect(image,t.id.startsWith('water')?'water-dragon':'ice-shards',progress*280,650);image.setAlpha(.25+progress*.65);}
    }
  }

  private controlBoss() {
    const f = this.boss, p = f.model, body = f.body.body;
    if(this.mirrorEntering){const e=this.mirrorEntering,t=clamp((this.now-e.at)/360,0,1);this.boss.body.body.setVelocity(0);this.teleport(this.boss,Phaser.Math.Linear(e.from.x,e.to.x,t),Phaser.Math.Linear(e.from.y,e.to.y,t)-Math.sin(t*Math.PI)*30);if(t>=1){this.formation.occupied=e.index;this.mirrorEntering=null;this.mirrorInterruptUntil=this.now;this.brain.readyAt=this.now+600;this.teleport(this.boss,this.formation.mirrors[e.index].x,this.floor);}return;}
    if(this.mirrorExit){this.updateMirrorExit();return;}
    if(this.barrage){this.updateBarrage();return;}
    if(!p.action&&p.canAct(this.now)&&this.now>=this.brain.readyAt&&!this.projectiles.some(q=>q.sword)&&this.now>=this.swordCatchUntil&&this.now>=this.bossRestrainedUntil&&this.now>=(this.requestedBarrage?1800:10000)&&this.now-this.barrageLast>=12000&&(this.requestedBarrage||this.brain.attacks-this.barrageAttack>=2)&&p.stamina>=35){const ids:BarrageId[]=p.id==='zabuza'?['diving-dragon','water-spirits','water-encirclement']:['needle-curtain','mirror-crossfire'];this.startBarrage(this.requestedBarrage||ids[this.barrageIndex%ids.length]);return;}
    if(this.requestedBarrage){body.setVelocityX(0);p.guard=false;return;}
    if (p.health <= 0 || this.now < p.guardBrokenUntil || this.now < p.hurtUntil || this.now < this.bossRestrainedUntil) {body.setVelocityX(0); return;}
    if(p.action?.definition.id==='parry-stance'){body.setVelocityX(0);return;}
    if(this.projectiles.some(q=>q.sword&&q.owner===f)||this.now<this.swordCatchUntil){body.setVelocityX(0);p.guard=false;return;}
    const targets = [this.player, ...this.fighters.filter(a => a.ally && a.model.health > 0)];
    const nearest = targets.sort((a, b) => Math.abs(a.model.x - p.x) - Math.abs(b.model.x - p.x))[0];
    const decoy = this.decoys.find(d => Math.abs(d.x - p.x) < Math.abs(nearest.model.x - p.x) + 40);
    let targetX = decoy?.x ?? nearest.model.x, targetY = decoy ? decoy.y - 50 : nearest.model.y - 65;
    if (this.phase === 'protect' && this.protectionUntil < this.now && this.brain.attacks % 3 === 2) {targetX = 190; targetY = this.floor - 72;}
    const distance = Math.abs(targetX - p.x);
    if (!p.action) {
      p.facing = targetX >= p.x ? 1 : -1;
      const guarding = this.now < this.brain.readyAt - 400 && this.now > this.brain.readyAt - 1250 && this.player.model.action?.definition.action.startsWith('light') && p.stamina > 28;
      p.guard = !!guarding; p.parryAt = -Infinity;
      const move = this.brain.choose(this.now, this.formation.active ? 800 : distance, this.formation.active);
      if (move) {
        this.targetX = targetX; this.targetY = targetY; this.aimLocked = false; this.redCueAt = 0;
        if (move.mist) {this.mistUntil = this.now + 4300;
          const side = this.brain.attacks % 2 ? -1 : 1; const x = clamp(this.player.model.x + side * 220, this.arenaMin + 40, this.arenaMax - 40);
          this.burst('smoke', p.x, this.floor - 70, 155); this.teleport(f, x, this.floor); p.facing = x > targetX ? -1 : 1; Object.assign(p.action || {}, {facing: p.facing});
        }
        if (this.formation.active && this.now >= this.mirrorInterruptUntil) this.transferMirror(move.id === 'mirror-feint');

      } else {
        const mirrored = this.formation.active && this.now >= this.mirrorInterruptUntil;
        const speed = !p.guard && this.now >= this.brain.readyAt - 250 && !mirrored ? (distance > 155 ? p.facing * (p.id === 'haku' ? 193 : 130) : distance < 70 ? -p.facing * 65 : 0) : 0;
        body.setVelocityX(speed);
      }
    }
    if (p.action) {
      const move = p.action.definition as BossMove, age = this.now - p.action.started;
      if (!this.aimLocked && age >= 220) {this.targetX = targetX; this.targetY = targetY; this.aimLocked = true;}
      const first = move.events[0]?.at || 500;
      const speed = move.move && age > 250 && age < first - 100 && !this.formation.active ? move.move * 1.1 * p.action.facing : 0;
      body.setVelocityX(speed);
      if(p.id==='zabuza')move.events.forEach((e,i)=>{const token=-100-i;if(e.kind==='hit'&&age>=e.at-130&&age<e.at&&!p.action!.emitted.has(token)){p.action!.emitted.add(token);this.sounds.effect('swing2',.65);}});
      const nextRed = move.events.find(event => event.red && age < event.at);
      if (nextRed && nextRed.at - age < 800 && this.redCueAt !== nextRed.at) {this.redCueAt = nextRed.at; this.sounds.effect('warning', .55, 1);}
      const rushWindup = (move.events.find(e => e.red)?.at || 3200) - 750;
      if (move.id === 'ice-prison-rush' && this.formation.active && age > 900 && age < rushWindup && this.now >= this.nextMirrorTransfer&&move.events.every(e=>e.at<=age||e.at-age>450)) {this.transferMirror(false); this.nextMirrorTransfer = this.now + 680;}
      if (move.id === 'ice-prison-rush' && age >= rushWindup && this.now >= this.mirrorInterruptUntil) {
        this.mirrorInterruptUntil = this.now + 1600; const x = clamp(this.player.model.x + (this.player.model.x < 830 ? 160 : -160), this.arenaMin + 50, this.arenaMax - 50);
        this.teleport(f, x, this.floor); p.facing = x < this.player.model.x ? 1 : -1; p.action.facing = p.facing;
      }
    }
  }
  private controlSasukeSupport(f:Fighter) {
    const p=f.model,b=this.boss.model,body=f.body.body;
    if(p.action){body.setVelocityX(p.action.definition.action==='dash'?p.action.facing*820:0);return;}
    p.facing=b.x>p.x?1:-1;
    p.setGuard(this.now<(f.guardUntil||0),false,this.now);
    let redIn=Infinity,ordinaryIn=Infinity,threatX=b.x;
    if(b.action){const age=this.now-b.action.started;for(const e of b.action.definition.events){
      if(e.kind==='hit'&&e.at>=age&&Math.abs(b.x-p.x)<(e.range||180)+80){if(e.red)redIn=Math.min(redIn,e.at-age);else ordinaryIn=Math.min(ordinaryIn,e.at-age);}
    }}
    for(const shot of this.projectiles){if(shot.friendly||shot.expires<=this.now||shot.vx===0)continue;
      const t=((p.x-shot.x)/shot.vx-(shot.rx+22)/Math.abs(shot.vx))*1000;if(t<0||t>900||Math.abs(shot.y+shot.vy*t/1000-(p.y-70))>70)continue;
      if(t<Math.min(redIn,ordinaryIn))threatX=shot.x;
      if(shot.red)redIn=Math.min(redIn,t);else ordinaryIn=Math.min(ordinaryIn,t);
    }
    const decision=f.support!.decide({now:this.now,canAct:p.canAct(this.now),stamina:p.stamina,distance:Math.abs(b.x-p.x),redIn,ordinaryIn,
      recovering:!b.action&&this.brain.readyAt>this.now+350,spellReady:p.chakra>=28});
    body.setVelocityX(0);
    if(decision==='dodge'){
      p.setGuard(false,false,this.now);p.facing=threatX>p.x?-1:1;
      if(p.x+p.facing*185<this.arenaMin+30||p.x+p.facing*185>this.arenaMax-30)p.facing=p.facing===1?-1:1;
      if(p.start(UNIVERSAL.dash,this.now))body.setVelocityX(p.facing*820);
    }else if(decision==='parry'){p.facing=threatX>p.x?1:-1;p.setGuard(false,false,this.now);p.setGuard(true,true,this.now);f.guardUntil=this.now+180;}
    else if(decision==='retreat'){body.setVelocityX(p.x-p.facing*90>this.arenaMin&&p.x-p.facing*90<this.arenaMax?-p.facing*190:0);}
    else if(decision==='approach')body.setVelocityX(p.facing*170);
    else if(decision==='spell'){
      const ability=kit('mirrors')[(f.supportCasts||0)%2].attack;
      if(p.start({...ability,events:ability.events.map(e=>({...e,damage:(e.damage||0)*.35}))},this.now))f.supportCasts=(f.supportCasts||0)+1;
    }else if(decision==='melee'||decision==='tool')p.start(decision==='melee'?UNIVERSAL.light2:UNIVERSAL.tool,this.now);
  }
  private controlAllies() {
    for (const f of this.fighters) {
      if (f.hostile && f !== this.boss) {
        if (f.model.health <= 0 || this.now >= f.expires) {this.removeFighter(f); continue;}
        f.model.facing = this.player.model.x > f.model.x ? 1 : -1;
        const distance = Math.abs(this.player.model.x - f.model.x);
        f.body.body.setVelocityX(!f.model.action && distance > 100 ? f.model.facing * 175 : 0);
        if (distance < 190 && this.now > f.nextAttack && !f.model.action) {
          f.model.start({id: 'water-echo', action: 'boss', animation: 'light1', stamina: 8, duration: 1120, cancelAt: 1120,
            events: [{at: 550, kind: 'hit', damage: 8, posture: 18, range: 148, height: 115, effect: 'water'}]}, this.now); f.nextAttack = this.now + 2400;
        }
        continue;
      }
      if (!f.ally) continue;
      if(f.support){this.controlSasukeSupport(f);continue;}
      if (f.model.health <= 0 || f.expires && this.now >= f.expires) {this.removeFighter(f); continue;}
      const boss = this.boss.model, p = f.model; p.facing = boss.x > p.x ? 1 : -1;
      if (p.action) {f.body.body.setVelocityX(0); continue;}
      if (Math.abs(boss.x - p.x) > 100 && !this.formation.active) f.body.body.setVelocityX(p.facing * 230);
      else {f.body.body.setVelocityX(0); if (this.now >= f.nextAttack) {
        if (this.formation.active) p.start(UNIVERSAL.tool, this.now); else p.start(UNIVERSAL.light1, this.now);
        f.nextAttack = this.now + (f.key.startsWith('clone') ? 1100 : 1500);
      }}
    }
  }
  private removeFighter(f: Fighter) {this.burst('smoke', f.model.x, f.model.y - 45, 100); f.body.destroy(); f.sprite.destroy(); f.shadow.destroy(); this.fighters = this.fighters.filter(a => a !== f);}
  private teleport(f: Fighter, x: number, footY: number) {f.body.body.reset(x, footY - 52); f.model.x = x; f.model.y = footY;}
  private actionEvent(f: Fighter, event: AttackEvent, key: string, charge: number) {
    if (f.model.health <= 0 || this.phaseEnding) return;
    if(f.model.action?.definition.id.startsWith('barrage-'))return;
    if (f.model.action?.definition.id!=='sword-throw' && event.effect && event.kind !== 'technique' && event.kind !== 'hit') {if(f.model.id==='zabuza'&&event.effect==='water')this.sounds.softWater();else this.sounds.effect(event.effect==='swing'&&f.model.id==='zabuza'?'swing2':event.effect, f.ally ? .22 : .65);}
    if (event.kind === 'effect') {
      if (event.effect === 'dash') this.burst('smoke', f.model.x - f.model.facing * 30, f.model.y - 25, 90, 260);
      return;
    }
    if (event.kind === 'technique') {if (f.hostile) this.bossTechnique(f, event, key); else this.playerTechnique(f, event, key); return;}
    if (event.kind === 'projectile') {
      if(event.effect!=='water'&&event.effect!=='fire')this.sounds.tool();
      if(f===this.boss&&this.formation.active&&this.formation.occupied>=0&&this.now>=this.mirrorInterruptUntil){const q={f,event,key,indices:this.mirrorAttackOrigins(),target:{x:this.targetX,y:this.targetY},at:this.now,tries:0};if(!this.fireMirrorGroup(q))this.mirrorShotQueue.push({...q,at:this.now+100,tries:1});return;}
      const count = event.count || 1;
      for (let i = 0; i < count; i++) this.launch(f, event, (i - (count - 1) / 2) * .14, key);
      if (f !== this.boss) this.sounds.voice(f.model.id, 'attack'); return;
    }
    if (event.kind === 'hit') {
      const p = f.model, range = event.range || 120, bounds = attackBounds(p.x, p.y, p.action?.facing || p.facing, range, event.height || 105);
      this.sounds.voice(p.id, 'attack');
      const targets = f.hostile ? this.fighters.filter(a => !a.hostile) : this.fighters.filter(a => a.hostile);
      for (const target of targets) if (event.red&&f.hostile?outlineHits(redOutline(p.action?.definition.id||'',p.x,p.y,p.action?.facing||p.facing,event),this.box(target)):overlaps(bounds, this.box(target))) this.hit(f, target, {...event, damage: (event.damage || 10) * charge}, key);
      if (!f.hostile) this.hitMirrors(f, bounds, (event.damage || 15) * charge, key);
      else {for (const decoy of this.decoys) if (overlaps(bounds, {x: decoy.x - 23, y: decoy.y - 62, width: 46, height: 60})) decoy.expires = 0;
        if (this.phase === 'protect' && overlaps(bounds, {x: 170, y: this.floor - 110, width: 40, height: 105})) this.hurtTazuna(event.damage || 10);}
      this.burst(event.red ? 'chakra-aura' : 'parry', p.x + p.facing * range * .65, p.y - 72, event.red ? 105 : 64, 150, p.facing);
    }
  }
  private hit(attacker: Fighter, target: Fighter, event: AttackEvent, key: string) {
    const token = `${key}:${target.key}`; if (attacker.model.hitTargets.has(token)) return;
    attacker.model.hitTargets.add(token);
    if (target === this.boss && this.formation.active && this.now >= this.mirrorInterruptUntil) return;
    const stance=target.model.action,age=stance?this.now-stance.started:0;
    if(target===this.boss&&stance?.definition.id==='parry-stance'&&bossParryEligible(age,attacker.model.action?.definition.action||'',!!event.red,attacker.model.x,target.model.x,target.model.facing,target.model.stamina,stance.emitted.has(-1))){
      stance.emitted.add(-1);target.model.deflectUntil=this.now+240;attacker.model.exhaust(10,this.now);attacker.model.stagger(this.now,180);this.perfectParry(target);return;
    }
    const multiplier = attacker.hostile ? COMBAT.enemyDamage : attacker === this.player && this.phase === 'seal' ? 1.28 : attacker.ally ? .33 : 1;
    const outcome = target.model.receive({damage: Math.round((event.damage || 10) * multiplier * (target.model.isBoss && this.now >= target.model.guardBrokenUntil ? .65 : 1) * (attacker === this.player && this.now < this.counterUntil ? 1.5 : 1)), posture: event.posture || 15, red: !!event.red, fromX: attacker.model.x}, this.now);
    if (outcome.result === 'immune') return;
    if (attacker === this.player && outcome.damage > 0) this.counterUntil = 0;
    if (outcome.result === 'parry') {
      attacker.model.deflected(outcome.attackerPosture * (target === this.player && this.readingUntil > this.now ? 2 : 1), this.now); this.perfectParry(target); if (target === this.player) {this.parries++; if (this.readingUntil > this.now) this.counterUntil = this.now + 1800; if (this.readingUntil > this.now) target.model.stamina = Math.min(100, target.model.stamina + 5);}
      if (attacker === this.boss && attacker.model.stamina <= 0) this.guardBreakEffect(attacker);
      return;
    }
    if (outcome.result === 'block') {this.sounds.effect('guard', .8); this.burst('parry', target.model.x + target.model.facing * 30, target.model.y - 75, 47, 140);
      attacker.model.exhaust(outcome.attackerPosture, this.now); return;}
    if (outcome.result === 'guardbreak') this.guardBreakEffect(target);
    if (!attacker.hostile) {
      if(attacker===this.player) attacker.model.ultimate=Math.min(100,attacker.model.ultimate+ultimateGain(this.phase,outcome.damage,attacker.model.action?.definition.action==='ultimate'));
      if (attacker === this.player && ['light1','light2','light3','heavy','aerial'].includes(attacker.model.action?.definition.action || '')) attacker.model.chakra = Math.min(100, attacker.model.chakra + COMBAT.meleeChakra);
      target.model.exhaust((event.posture || 12) * (attacker.ally ? .2 : 1), this.now); if (target.model.stamina <= 0 && target.model.isBoss) this.guardBreakEffect(target);
    }
    if(event.effect==='water'){if(attacker.model.id==='zabuza')this.sounds.softWater();else this.sounds.effect('water2',.8);}
    else this.sounds.strike(attacker.model.id==='zabuza'?'sword':event.posture&&event.posture>=30?'heavy':attacker.model.action?.definition.action==='light2'?'kick':'palm',.85);
    this.sounds.voice(target.model.id, target.model.health <= 0 ? 'defeat' : 'hurt');
    const armored=target.model.isBoss&&this.now>=target.model.hurtUntil&&this.now>=target.model.guardBrokenUntil;
    this.burst(event.effect === 'ice' ? 'ice-shards' : 'parry', target.model.x, target.model.y - 65, armored?42:90, armored?100:210).setTint(armored?0x93b9cc:0xfff0c7);
    if (target.ally && !target.key.startsWith('clone')) target.model.health = Math.max(1, target.model.health);
    if (!target.model.isBoss) target.body.body.setVelocityX((target.model.x >= attacker.model.x ? 1 : -1) * (event.red ? 245 : 135));
    else if (target.model.guardBrokenUntil > this.now) target.body.body.setVelocityX((target.model.x >= attacker.model.x ? 1 : -1) * 40);
    this.stopForImpact(event.red ? 40 : 25); this.shake(event.red ? .003 : .0015, 90);
  }
  private perfectParry(target:Fighter){
    this.parryChain=this.now-this.lastParry<1500?this.parryChain+1:1;this.lastParry=this.now;
    const x=target.model.x+target.model.facing*30,y=target.model.y-90;
    if(this.parrySignals.length>=6)this.parrySignals.shift()!.text.destroy();
    const text=this.add.text(x,target.model.y-CHARACTER[target.model.id].height-28,'PERFECT PARRY',{fontFamily:'Arial',fontSize:'18px',fontStyle:'bold',color:'#fff2b0',stroke:'#102635',strokeThickness:4}).setOrigin(.5).setDepth(14);
    this.parrySignals.push({x,y,born:this.now,text});this.sounds.effect('parry',1);this.burst('parry',x,y,130,200);this.stopForImpact(60);this.shake(.0015,70);
  }
  private guardBreakEffect(f: Fighter) {
    if (Math.abs(f.model.guardBrokenUntil - this.now - (f.model.isBoss ? COMBAT.bossBreak : COMBAT.guardBreak)) > 60) return;
    if (f === this.boss) {if(this.bossBreakAnnounced===f.model.guardBrokenUntil)return;this.bossBreakAnnounced=f.model.guardBrokenUntil;if(this.formation.active)this.mirrorGuardBreaks++;}
    this.sounds.effect('break', 1); this.burst('parry', f.model.x, f.model.y - 65, 235, 410); this.stopForImpact(65); this.shake(.003, 160);
  }
  private launch(f: Fighter, event: AttackEvent, offset: number, key: string,origin?:{x:number;y:number;target:{x:number;y:number}}) {
    if (this.projectiles.length >= 48) return;
    const friendly = !f.hostile, mirror = !friendly && this.formation.active && this.now >= this.mirrorInterruptUntil ? this.formation.mirrors[this.formation.occupied] : null;
    let x = mirror?.x ?? f.model.x + f.model.facing * (event.effect==='water'?68:36), y = mirror ? mirror.y - 35 : f.model.y - 73;
    if(f.model.action?.definition.id==='sword-throw'){const hand=swordHand(f.model.x,f.model.y,3,f.model.facing);x=hand.x;y=hand.y;}
    const waterNeedle = event.effect === 'water' && f.model.id === 'haku';
    const name = event.effect === 'water' && !waterNeedle ? (event.red ? 'water-dragon' : 'waterfall') : event.effect === 'fire' ? 'fireball' : 'senbon';
    let image: Phaser.GameObjects.Image, rx = 15, ry = 6;const waterRow=event.effect==='water'&&!waterNeedle?(event.red?1:0):undefined;
    if (friendly && event.effect !== 'water' && event.effect !== 'fire') image = namedArt(this, 'props', f.model.id === 'sasuke' ? 'windmill-shuriken' : 'shuriken', x, y, f.model.id === 'sasuke' ? 43 : 24);
    else if (name === 'senbon') {
      if (f.model.action?.definition.id === 'sword-throw') {image = this.add.image(x, y, 'v2-zabuza-sword').setDisplaySize(166, 28); rx = 65; ry = 13;}
      else {image = makeEffect(this,'needle',x,y,waterNeedle?76:68,waterNeedle?16:14); rx=18;ry=3;if(waterNeedle)image.setTint(0x98e8ff);}
    }
    else if(waterRow!==undefined){const width=event.red?310:170;image=makeEffect(this,waterRow===1?'water-dragon':'wave',x,y,width,width*.5);rx=event.red?48:25;ry=event.red?52:12;}
    else {image = makeEffect(this,name,x,y,138,100); rx = 44; ry = 40;}
    let target = friendly ? {x: x + f.model.facing * 1200, y} : {x: this.targetX, y: this.targetY};
    if (!friendly && event.red && event.effect === 'water') target = {x: this.targetX, y: this.floor - 62};
    if(waterRow===0){y=this.floor-12;target={x:target.x,y};}
    if(origin){x=origin.x;y=origin.y;target=origin.target;image.setPosition(x,y);}
    const velocity = fixedAim({x, y}, target, (event.speed || (friendly ? 770 : 440))*1.25*(friendly?1:HOSTILE_SPEED), offset);
    image.setDepth(5).setRotation(velocity.angle - (velocity.vx < 0 && (!waterNeedle && (event.effect === 'water' || event.effect === 'fire')) ? Math.PI : 0));
    if (!waterNeedle && (event.effect === 'water' || event.effect === 'fire')) image.setFlipX(velocity.vx < 0);
    if(waterRow!==undefined)image.setOrigin(velocity.vx<0?.2:.8,.5);
    if (event.red && waterRow===undefined) image.setTint(0xff797b);
    this.projectiles.push({image, x, y, vx: velocity.vx, vy: velocity.vy, damage: event.damage || 8, posture: event.posture || 8,
      red: !!event.red, friendly, owner: f, expires: waterRow!==undefined?Infinity:this.now+3900,water:waterRow!==undefined?{phase:'travel',at:this.now}:undefined,groundWave:waterRow===0, rx, ry, kind: !friendly&&f.model.id==='haku'?'needle':f.model.action?.definition.id === 'sword-throw' ? 'sword' : event.effect==='swing'?'tool':event.effect || 'tool', hit: new Set([key]),waterRow,born:this.now,trail:[]});
    if(f.model.action?.definition.id==='sword-throw'){const p=this.projectiles.at(-1)!;const d=Math.hypot(velocity.vx,velocity.vy);const dx=velocity.vx/d,dy=velocity.vy/d;const edge=dx>0?this.arenaMax-40:this.arenaMin+40;const distance=Math.max(30,Math.min(Math.hypot(target.x-x,target.y-y)+150,Math.abs((edge-x)/dx)));p.sword=new ReturningSword(x,y,dx,dy,distance);p.expires=this.now+6000;this.sounds.swordRelease();}
  }
  private updateProjectiles(dt: number) {
    for (const p of this.projectiles) {
      if(p.water&&p.water.phase!=='travel'){const age=this.now-p.water.at;p.water.phase=age<180?'impact':'dissipate';this.waterImpactPose(p,age);if(age>=480)p.expires=0;continue;}
      if(p.water&&p.expires<=this.now){this.endWater(p,'cancel');continue;}
      if (p.expires <= this.now) continue;
      const ox=p.x,oy=p.y;
      let nx=p.x+p.vx*dt/1000,ny=p.y+p.vy*dt/1000,damaging=true;
      if(p.sword){
        if(p.owner.model.health<=0){p.expires=0;continue;}
        const step=p.sword.step(dt,swordHand(p.owner.model.x,p.owner.model.y,14,p.owner.model.facing));nx=step.to.x;ny=step.to.y;damaging=step.damaging;p.vx=(nx-p.x)*1000/Math.max(1,dt);p.vy=(ny-p.y)*1000/Math.max(1,dt);p.hit=p.sword.hit;
        if(p.sword.phase==='caught'){p.expires=0;this.swordCatchUntil=this.now+500;this.brain.readyAt=Math.max(this.brain.readyAt,this.swordCatchUntil);this.sounds.swordCatch();continue;}
      }
      if(p.groundEndX!==undefined&&(nx-p.groundEndX)*Math.sign(p.vx)>=0){p.x=p.groundEndX;p.y=this.floor;this.endWater(p,'ground');continue;}
      if(p.water&&!p.groundWave){const contact=groundContact(p.x,p.y,nx,ny,this.floor,p.ry);if(contact){p.x=contact.x;p.y=contact.y;this.endWater(p,'ground');continue;}}
      const sweep=projectileSweep(p.x,p.y,nx,ny,p.rx,p.ry);
      p.x = nx; p.y = ny; p.image.setPosition(nx, ny);
      if(p.waterRow!==undefined){
        p.image.setTexture(p.waterRow===1?'v14-dragon':'v14-wave',String(waterFrame(this.now-p.born)));
        p.image.setFlipX(p.vx<0).setOrigin(p.vx<0?.2:.8,.5).setRotation(Math.atan2(p.vy,p.vx)-(p.vx<0?Math.PI:0));
        p.trail.push({x:nx,y:ny});if(p.trail.length>8)p.trail.shift();
      }
      if(p.groundWave){p.image.setPosition(nx,this.floor).setOrigin(p.vx<0?.2:.8,waveGroundAnchor(waterFrame(this.now-p.born))).setRotation(0);}
      if(p.handLaunch){const size=Math.min(200,24+(this.now-p.born)*.85);p.image.setDisplaySize(size,size*.44);}
      if(p.kind==='spirit'&&!p.groundWave){p.image.setFrame(String(waterFrame(this.now-p.born)));p.trail.push({x:nx,y:ny});if(p.trail.length>5)p.trail.shift();}
      if(p.kind==='fire')animateEffect(p.image,'fireball',this.now-p.born,3900);
      if(p.kind==='needle'){p.image.setOrigin(.85,.5);animateEffect(p.image,'needle',this.now-p.born,3900);p.image.setRotation(Math.atan2(p.vy,p.vx));p.trail.push({x:nx,y:ny});if(p.trail.length>5)p.trail.shift();}
      if (p.kind === 'tool') p.image.rotation += dt * .023;
      if (p.kind === 'sword') p.image.rotation += dt * .018;
      if(!damaging)continue;
      if (p.returnAt && this.now >= p.returnAt) {p.returnAt = undefined; p.vx *= -1; p.hit.clear();}
      if (p.friendly) {
        if (this.formation.active) {
          for (let i = 0; i < this.formation.mirrors.length; i++) {const m = this.formation.mirrors[i]; if (m.broken) continue;
            if (overlaps(sweep, {x: m.x - 42, y: m.y - 96, width: 84, height: 185}) && !p.hit.has(`mirror-${i}`)) {
              p.hit.add(`mirror-${i}`); this.strikeMirror(i, p.damage * (this.phase === 'seal' ? 1.4 : 1), p.owner);
              if (!p.returnAt){if(p.water)this.endWater(p,'fighter',sweptContact(ox,oy,nx,ny,p.rx,p.ry,{x:m.x-42,y:m.y-96,width:84,height:185}));else p.expires = 0;} break;
            }}
        }
        for (const target of this.fighters.filter(f => f.hostile)) if ((!p.water||p.water.phase==='travel') && p.expires && overlaps(sweep, this.box(target)) && !p.hit.has(target.key) && (target !== this.boss || !this.formation.active || this.now < this.mirrorInterruptUntil)) {
          p.hit.add(target.key); this.projectileHit(p, target); if (!p.returnAt){if(p.water)this.endWater(p,'fighter',sweptContact(ox,oy,nx,ny,p.rx,p.ry,this.box(target)));else p.expires = 0;} break;
        }
      } else {
        for (const target of this.fighters.filter(f => !f.hostile)) {
          if (overlaps(sweep, this.box(target)) && !p.hit.has(target.key)) {
            p.hit.add(target.key); const reflected = this.projectileHit(p, target);
            if (reflected) break;if(p.water)this.endWater(p,'fighter',sweptContact(ox,oy,nx,ny,p.rx,p.ry,this.box(target)));else if(!p.sword)p.expires = 0; break;
          }
        }
        if (!p.friendly&&(!p.water||p.water.phase==='travel')) for (const decoy of this.decoys) if (overlaps(sweep, {x: decoy.x - 25, y: decoy.y - 64, width: 50, height: 60})) {decoy.expires = 0; if(p.water)this.endWater(p,'fighter');else if(!p.sword)p.expires = 0;}
        if (!p.friendly && p.expires && this.phase === 'protect' && overlaps(sweep, {x: 168, y: this.floor - 115, width: 44, height: 110})) {this.hurtTazuna(p.damage); p.expires = 0;}
      }
      if(p.water){const margin=Math.max(p.image.displayWidth,p.image.displayHeight);if(nx < -margin || nx > this.arenaMax+margin || ny < -margin)p.expires=0;}else if (!p.sword&&(nx < -80 || nx > this.arenaMax + 120 || ny > this.floor + 30 || ny < -120)) p.expires = 0;
    }
    this.projectiles = this.projectiles.filter(p => {if (p.expires <= this.now) {if(p.pooled){p.image.setVisible(false).setActive(false);this.projectilePool.push(p.image);}else p.image.destroy(); return false;} return true;});
    this.decoys = this.decoys.filter(d => {if (d.expires <= this.now) {this.burst('smoke', d.x, d.y - 30, 90); d.image.destroy(); return false;} return true;});
  }
  private endWater(p:Projectile,reason:WaterEndReason,contact?:{x:number;y:number}|null){if(!p.water||p.water.phase!=='travel')return;if(contact){p.x=contact.x;p.y=contact.y;}p.water={phase:'impact',at:this.now,reason};p.vx=0;p.vy=0;p.expires=this.now+480;p.image.setVisible(true);this.waterImpactPose(p,0);}
  private waterImpactPose(p:Projectile,age:number){waterImpact(p.image,p.x,p.water?.reason==='ground'?this.floor:p.y,age,p.water?.reason==='ground');}
  private projectileHit(p: Projectile, target: Fighter) {
    const from = p.x - Math.sign(p.vx) * 50;
    const outcome = target.model.receive({damage: p.friendly ? p.damage * (target.model.isBoss && this.now >= target.model.guardBrokenUntil ? .65 : 1) : Math.max(1, Math.round(p.damage * COMBAT.enemyDamage)), posture: p.posture, red: p.red, fromX: from, projectile: true}, this.now);
    if (outcome.result === 'immune') return true;
    if (outcome.result === 'parry') {
      const source = p.owner;
      if(p.sword)p.sword.parry();else{p.friendly = true; p.owner = target; p.vx = -p.vx; p.vy = -p.vy; p.hit.clear(); p.expires = p.water?Infinity:this.now + 2300;}
      p.image.rotation += Math.PI;
      source.model.deflected(outcome.attackerPosture * (this.readingUntil > this.now ? 2 : 1), this.now); this.perfectParry(target);
      if (target === this.player) {this.parries++; if(this.readingUntil>this.now)this.counterUntil=this.now+1800;} this.stopForImpact(40); if (this.boss.model.stamina <= 0) this.guardBreakEffect(this.boss); return true;
    }
    if (outcome.result === 'block') {this.sounds.effect('guard', .7); this.burst('parry', target.model.x, target.model.y - 70, 50, 120); return false;}
    if (outcome.result === 'guardbreak') this.guardBreakEffect(target);
    if (p.friendly) {target.model.exhaust(p.posture * (p.owner.ally ? .2 : 1), this.now); if(p.owner===this.player)p.owner.model.ultimate=Math.min(100,p.owner.model.ultimate+ultimateGain(this.phase,outcome.damage,false)); if(target.model.isBoss && target.model.stamina <= 0)this.guardBreakEffect(target);}
    if(p.kind==='spirit'||p.kind==='water'&&p.owner.model.id==='zabuza')this.sounds.softWater();else this.sounds.effect(p.kind === 'water' ? 'water2' : 'impact', .65); this.sounds.voice(target.model.id, target.model.health <= 0 ? 'defeat' : 'hurt');
    this.burst(p.kind === 'water' ? 'waterfall' : 'ice-shards', target.model.x, target.model.y - 70, 75, 190); this.shake(.0015, 70);
    if (target.ally && !target.key.startsWith('clone')) target.model.health = Math.max(1, target.model.health);
    return false;
  }
  private playerTechnique(f: Fighter, event: AttackEvent, key: string) {
    const p = f.model, id = p.action?.definition.id || '';
    this.sounds.effect(event.effect || 'smoke', .85); this.sounds.voice(p.id, 'cast');
    if (id === 'substitute') {
      const oldX = p.x, x = safeSubstitution(p.x, p.facing, this.arenaMin, this.arenaMax, this.boss.model.x);
      this.burst('smoke', oldX, p.y - 48, 155, 400); const image = namedArt(this, 'props', 'log', oldX, p.y, 84).setOrigin(.5, 1).setDepth(3);
      this.decoys.push({image, x: oldX, y: p.y, expires: this.now + 2600}); this.teleport(f, x, Math.min(p.y, this.floor));
      return;
    }
    if (id === 'clones') {
      for (const clone of [...this.fighters].filter(a => a.key.startsWith('clone'))) this.removeFighter(clone);
      for (const offset of [-56, 56]) {const clone = this.fighter(`clone-${++this.clonesCreated}`, 'naruto', clamp(p.x + offset, this.arenaMin + 30, this.arenaMax - 30), p.y, false, 1, true);
        clone.expires = this.now + 6000; this.burst('smoke', clone.model.x, clone.model.y - 40, 120, 330);} return;
    }
    if (id === 'glamour') {
      this.glamour?.sprite.destroy();
      const x=clamp(p.x+p.facing*90,this.arenaMin+40,this.arenaMax-40);
      const sprite=this.add.sprite(x,this.floor+2,'v8-glamour','0').setOrigin(.5,450/512).setScale(155/370).setDepth(4);
      this.glamour={sprite,born:this.now};this.burst('smoke',x,this.floor-65,160,350);
      if(Math.abs(this.boss.model.x-x)<450&&!this.formation.active){this.boss.model.stagger(this.now,1000);this.bossRestrainedUntil=this.now+1000;this.brain.stagger(this.now,1000);}
      return;
    }
    if (id === 'reading') {this.readingUntil = this.now + 4400; this.readingSlow = 3000; this.burst('parry', p.x, p.y - 118, 44, 450); return;}
    if (id === 'protect') {this.protectionUntil = this.now + 6000; p.stamina = Math.min(100, p.stamina + 40); p.immuneUntil = this.now + 240;
      this.burst('parry', p.x, p.y - 70, 120, 450); return;}
    if (id === 'hounds') {
      this.houndPacks.push({pack:new HoundPack(this,this.now,p.x,this.floor),f,event,key,hit:false});return;
    }
    if (id === 'dragon' || id === 'waterfall') {this.launch(f, {at: 0, kind: 'projectile', effect: 'water', red: id === 'waterfall', damage: event.damage, posture: event.posture, speed: 550}, 0, key); return;}
    if (id === 'fireball') {this.launch(f, {at: 0, kind: 'projectile', effect: 'fire', damage: event.damage, posture: 28, speed: 540}, 0, key); return;}
    if (id === 'windmill') {
      this.launch(f, {at: 0, kind: 'projectile', damage: event.damage, posture: 24, speed: 620}, 0, key);
      const projectile = this.projectiles.at(-1); if (projectile) {projectile.returnAt = this.now + 730; projectile.expires = this.now + 2100; projectile.image.setDisplaySize(84, 84); projectile.rx = 36; projectile.ry = 36;} return;
    }
    if (id === 'intercept') {
      for (const projectile of this.projectiles) if (!projectile.friendly && Math.abs(projectile.x - p.x) < 380 && !projectile.red) {projectile.expires = 0; this.burst('parry', projectile.x, projectile.y, 45, 150); p.ultimate = Math.min(100, p.ultimate + 6);}
      for (const angle of [-.12, 0, .12]) this.launch(f, {at: 0, kind: 'projectile', damage: 18, posture: 12, speed: 690}, angle, key); return;
    }
    if (['red-rush', 'fury', 'lightning', 'barrage', 'focus', 'resolve'].includes(id)) {
      p.immuneUntil = this.now + 300;
      const distance = Math.min(id === 'red-rush' ? 240 : 330, Math.abs(this.boss.model.x - p.x));
      const x = clamp(p.x + p.facing * Math.max(0, distance - 70), this.arenaMin + 32, this.arenaMax - 32);
      this.burst(id === 'lightning' ? 'lightning' : this.phase === 'seal' ? 'chakra-aura' : 'smoke', p.x, p.y - 65, 240, 600);if(id==='red-rush'){const effect=this.effects.at(-1)!;effect.attached=f;effect.chakra21=true;}
      f.rush = {x, until: this.now + 220, serial: p.action?.serial || 0};
      const multiple = ['fury', 'barrage', 'focus', 'resolve'].includes(id);
      const strikeDamage = (event.damage || 150) / (multiple ? 3 : 1);
      for (const [i, delay] of (multiple ? [220, 400, 590] : [220]).entries()) this.followups.push({at: this.now + delay, fighter: f, key: `${key}-followup-${i}`, serial: p.action?.serial || 0,
        event: {at: 0, kind: 'hit', damage: strikeDamage, posture: multiple ? 20 : event.posture, range: 210, height: 160, effect: id === 'lightning' ? 'lightning' : 'impact'}});
      this.shake(.003, 180);
    }
  }
  private bossTechnique(f: Fighter, event: AttackEvent, key: string) {
    if (f.model.action?.definition.id === 'water-clone') {
      this.burst('waterfall', f.model.x, this.floor - 70, 145, 450);
      for (const previous of [...this.fighters].filter(a => a.key.startsWith('water-clone'))) this.removeFighter(previous);
      const clone = this.fighter(`water-clone-${++this.clonesCreated}`, 'zabuza', clamp(f.model.x + f.model.facing * 90, this.arenaMin + 35, this.arenaMax - 35), this.floor, false, 65);
      clone.expires = this.now + 5200; clone.model.facing = f.model.facing; return;
    }
    const x = clamp(this.targetX, this.arenaMin + 60, this.arenaMax - 60);
    this.waterBurst(x-70*f.model.facing,this.floor,416,800,2); this.sounds.softWater();
    this.effects.at(-1)!.tidal = {owner:f,event,key,x,hit:false};
    if (this.phase === 'protect' && x < 280) this.hurtTazuna(event.damage || 10);
  }
  private makeMirrors() {
    this.destroyMirrorVisuals(); this.formation.create(830, this.floor); this.mirrorEnd = this.now + 38000;
    this.boss.model.action = null; this.brain.readyAt = this.now + 1800; this.mirrorInterruptUntil = 0;
    this.formation.mirrors.forEach(m => {
      const {image,reflection}=mirrorVisual(this,m.x,m.y,this.floor,'prison',m.foreground?3:1);
      const halo = this.add.ellipse(m.x, m.y - 5, 82, 214, 0xacefff, 0).setStrokeStyle(2, 0xa4f0ff, 0).setDepth(3);
      this.mirrorVisuals.push({image, reflection, halo});
    });
    this.transferMirror(false); this.burst('ice-shards', 830, 360, 300, 600); this.sounds.effect('ice', .9);
  }
  private transferMirror(feint: boolean) {
    if(this.mirrorExit||this.mirrorEntering)return;
    const entering=this.formation.occupied<0,from={x:this.boss.model.x,y:this.boss.model.y};
    const mirror = this.formation.transfer(this.now); if (!mirror) return;this.formation.exposedUntil=0;
    if(entering){const index=this.formation.occupied,r=this.mirrorVisuals[index].reflection;this.mirrorEntering={at:this.now,from,to:{x:r.x,y:r.y},index};this.formation.occupied=-1;this.boss.model.action=null;this.boss.body.body.setAllowGravity(false);this.mirrorInterruptUntil=Infinity;this.brain.readyAt=Infinity;return;}
    this.teleport(this.boss, mirror.x, this.floor); this.boss.model.facing = this.player.model.x > mirror.x ? 1 : -1;
    if (this.boss.model.action) this.boss.model.action.facing = this.boss.model.facing;
    this.targetX = this.player.model.x; this.targetY = this.player.model.y - 65;
    this.boss.model.exhaust(6, this.now);
    this.nextMirrorTransfer = this.now + (feint ? 650 : 1600); this.sounds.effect('ice', .4, 1.1);
  }
  private hitMirrors(f: Fighter, bounds: {x: number; y: number; width: number; height: number}, damage: number, key: string) {
    if (!this.formation.active) return;
    this.formation.mirrors.forEach((m, i) => {
      const token = `${key}:mirror-${i}`;
      if (!m.broken && !f.model.hitTargets.has(token) && overlaps(bounds, {x: m.x - 48, y: m.y - 100, width: 96, height: 192})) {
        f.model.hitTargets.add(token); this.strikeMirror(i, damage, f);
      }
    });
  }
  private strikeMirror(index: number, damage: number, f: Fighter) {
    const mirror = this.formation.mirrors[index]; if (!mirror || mirror.broken) return;
    const result = this.formation.strike(index, damage, this.phase === 'seal', this.now);
    this.burst(result.broken ? 'ice-shards' : 'parry', mirror.x, mirror.y, result.broken ? 175 : 70, result.broken ? 430 : 190);
    this.sounds.effect('ice', .65, result.broken ? .8 : 1.15);
    if (result.interrupt && !this.mirrorExit && this.now >= this.mirrorInterruptUntil) {
      this.boss.model.health = Math.max(0, this.boss.model.health - Math.max(18, damage * .85));
      this.boss.model.exhaust(16, this.now); f.model.ultimate = Math.min(100, f.model.ultimate + 8);
      this.beginMirrorExit(mirror,true);this.stopForImpact(35);
    }
    if (result.broken) {this.boss.model.exhaust(18, this.now); f.model.ultimate = Math.min(100, f.model.ultimate + 8); this.shake(.002, 100);}
    if (this.formation.count() <= 2) this.endMirrors();
  }
  private updateMirrors() {const pending=this.mirrorShotQueue;this.mirrorShotQueue=[];for(const q of pending){if(this.mirrorExit||!this.formation.active||this.formation.occupied<0)continue;if(this.now<q.at)this.mirrorShotQueue.push(q);else if(!this.fireMirrorGroup(q)&&q.tries<3)this.mirrorShotQueue.push({...q,at:this.now+100,tries:q.tries+1});}if(this.barrage||this.mirrorExit){this.mirrorVisuals.forEach(v=>{v.reflection.setVisible(false);v.halo.setVisible(false);});return;}
    if (this.boss.model.id !== 'haku'||this.requestedBarrage) return;
    if (!this.formation.active && this.now >= this.formation.nextFormationAt && (this.boss.model.health / this.boss.model.maxHealth < .9 || this.phaseElapsed > 7)) this.makeMirrors();
    if (!this.formation.active) return;
    if (this.now >= this.mirrorEnd) {this.endMirrors(); return;}
    if (this.boss.model.guardBrokenUntil > this.now&&this.formation.occupied>=0){this.beginMirrorExit(this.formation.mirrors[this.formation.occupied],true);return;}
    if(this.formation.occupied<0&&!this.mirrorEntering&&this.now>=this.nextMirrorTransfer&&this.now>=this.mirrorInterruptUntil){this.transferMirror(false);return;}
    if (this.boss.model.action?.definition.id === 'mirror-feint' && this.now >= this.nextMirrorTransfer && this.now - this.boss.model.action.started < 900&&this.boss.model.action.definition.events.every(e=>e.at<=this.now-this.boss.model.action!.started||e.at-(this.now-this.boss.model.action!.started)>450)) this.transferMirror(false);
    this.mirrorVisuals.forEach((visual, i) => {
      const mirror = this.formation.mirrors[i]; visual.image.setVisible(!mirror.broken); visual.reflection.setVisible(!mirror.broken&&this.formation.occupied>=0&&this.now>=this.mirrorInterruptUntil);

      const action=this.boss.model.action,age=action?this.now-action.started:0;
      const next=action?.definition.events.find(e=>e.at>age&&(e.kind==='projectile'||e.kind==='hit'));
      const tell=this.mirrorAttackOrigins().includes(i)&&this.now>=this.mirrorInterruptUntil&&!!next&&next.at-age<=400;
      visual.reflection.setAlpha(.82);
      poseReflection(visual.reflection,visual.image,'prison',tell,this.now,mirror.x>830?-1:1);

      visual.halo.setPosition(visual.image.x,visual.image.y);visual.halo.setFillStyle(0xabefff,tell?.08:0).setStrokeStyle(tell?3:1,0xc9ffff,tell?.8:0).setVisible(!mirror.broken);
      if(tell)this.formation.exposedUntil=this.now+120;

    });
  }
  private beginMirrorExit(mirror:{x:number;y:number},stunned:boolean){
    if(this.mirrorExit)return;this.mirrorShotQueue=[];this.mirrorEntering=null;
    const index=this.formation.mirrors.indexOf(mirror as typeof this.formation.mirrors[number]),reflection=this.mirrorVisuals[index]?.reflection;
    this.mirrorExit=new MirrorExit(clamp(reflection?.x??mirror.x,this.arenaMin+45,this.arenaMax-45),Math.min(this.floor,reflection?.y??mirrorFeet(mirror.y,this.floor)),this.floor,stunned);
    this.mirrorVisuals.forEach(v=>{v.reflection.setVisible(false);v.halo.setVisible(false);});this.mirrorExitAt=this.now;
    this.mirrorInterruptUntil=Infinity;this.boss.model.action=null;this.boss.model.guard=false;this.boss.model.resolveUntil=this.now+2000;
    this.boss.body.body.setVelocity(0).setAllowGravity(false);this.teleport(this.boss,this.mirrorExit.x,this.mirrorExit.y);
    this.followups=this.followups.filter(f=>f.fighter!==this.boss);this.projectiles.forEach(p=>{if(!p.friendly&&p.owner===this.boss)p.expires=0;});
    this.formation.occupied=-1;this.brain.readyAt=Infinity;
  }
  private updateMirrorExit(){
    const exit=this.mirrorExit;if(!exit)return;const wasLanded=exit.landedAt!==null;
    exit.tick(Math.max(0,this.now-this.mirrorExitAt-exit.age));this.teleport(this.boss,exit.x,exit.y);
    this.boss.body.body.setVelocity(0);this.boss.model.action=null;
    if(!wasLanded&&exit.landedAt!==null){this.burst(exit.stunned?'ice-shards':'smoke',exit.x,this.floor-12,exit.stunned?145:85,260);this.sounds.effect('step',.5);if(exit.stunned)this.boss.model.hurtUntil=this.now+650;}
    if(exit.done){this.mirrorExit=null;this.boss.body.body.setAllowGravity(true);this.boss.model.hurtUntil=Math.min(this.boss.model.hurtUntil,this.now);this.mirrorInterruptUntil=this.now+350;this.brain.readyAt=this.now+350;if(this.formation.active)this.nextMirrorTransfer=this.now+350;}
  }
  private endMirrors() {
    this.mirrorShotQueue=[];this.mirrorEntering=null;const mirror=this.formation.mirrors[this.formation.occupied];if(mirror&&!this.mirrorExit)this.beginMirrorExit(mirror,false);
    this.formation.clear(this.now);this.destroyMirrorVisuals();this.boss.model.action=null;
    if(!this.mirrorExit){this.brain.readyAt=this.now+800;this.boss.body.body.setAllowGravity(true);}
  }
  private destroyMirrorVisuals() {for (const v of this.mirrorVisuals) {v.image.destroy(); v.reflection.destroy(); v.halo.destroy();} this.mirrorVisuals = [];}
  private burst(name: string, x: number, y: number, width: number, duration = 350, direction = 1) {
    if (this.effects.length >= 38) {this.effects[0].image.destroy(); this.effects.shift();}
    const image = makeEffect(this,name,x,y,width,name==='water-dragon'||name==='waterfall'?width*.5:width).setDepth(9).setFlipX(direction < 0);
    this.effects.push({image, born: this.now, duration, width, grow:0,spin:0,effectName:name}); return image;
  }
  private waterBurst(x:number,y:number,width:number,duration:number,row:number){
    if(this.effects.length>=38){this.effects[0].image.destroy();this.effects.shift();}
    const image=makeEffect(this,row===1?'water-dragon':'wave',x,y,width,width*.48).setDepth(9);
    if(row===2)image.setOrigin(.5,.85);
    this.effects.push({image,born:this.now,duration,width,grow:0,spin:0,waterRow:row,effectName:row===1?'water-dragon':'wave'});
  }
  private updateEffects(dt: number) {
    this.houndPacks=this.houndPacks.filter(h=>{const contact=h.pack.update(this.now,this.boss.model,this.boss.model.health<=0);if(contact&&!h.hit){h.hit=true;this.bossRestrainedUntil=this.now+1000;this.boss.model.action=null;this.brain.readyAt=this.now+1250;this.hit(h.f,this.boss,{...h.event,posture:22},h.key);}return !h.pack.done;});
    this.effects = this.effects.filter(effect => {
      const progress = (this.now - effect.born) / effect.duration;
      if (progress >= 1) {effect.image.destroy(); return false;}
      if(effect.iceBarrage)effect.image.setFrame(String(4+Math.min(3,Math.floor(progress*4))));
      if(effect.attached)effect.image.setPosition(effect.attached.model.x-effect.attached.model.facing*45,effect.attached.model.y-72);
      if(effect.chakra21)effect21(effect.image,0,progress<.6?2+Math.floor(progress*8)%2:Math.min(7,4+Math.floor((progress-.6)*10)),240,160);
      else if(effect.effectName)animateEffect(effect.image,effect.effectName,this.now-effect.born,effect.duration);
      if(effect.tidal){const t=effect.tidal;effect.image.x=t.x+(progress-.5)*180*t.owner.model.facing;effect.image.setFlipX(t.owner.model.facing<0);
        if(progress>=.25&&progress<=.75){const shape=waveOutline(effect.image.x,this.floor,t.owner.model.facing,Math.min(7,Math.floor(progress*8)));
          for(const target of this.fighters.filter(a=>!a.hostile))if(outlineHits(shape,this.box(target)))this.hit(t.owner,target,t.event,t.key);}
      }
      if(effect.waterRow===2){effect.image.setAlpha(Math.min(1,(1-progress)*5));return true;}
      const ratio = effect.image.displayHeight / effect.image.displayWidth;
      effect.image.setAlpha(effect.tidal ? Math.min(1,(1-progress)*3) : 1 - progress).setDisplaySize(effect.width * (1 + progress * effect.grow), effect.width * ratio * (1 + progress * effect.grow));
      effect.image.rotation += effect.spin * dt / 1000; return true;
    });
  }
  private updateCues(dt: number) {
    const graphics = this.cueGraphics; graphics.clear();this.drawBarrageCues();fitAllMirrors(this);
    if(this.glamour){const age=this.now-this.glamour.born;if(age>1250){this.burst('smoke',this.glamour.sprite.x,this.floor-70,110,240);this.glamour.sprite.destroy();this.glamour=null;}
      else{const v=this.glamour.sprite;v.setFrame(String(Math.min(3,Math.floor(age/300))));v.setAlpha(Math.min(1,(1250-age)/200));
        for(let i=0;i<6;i++){const a=age/500+i*Math.PI/3;graphics.fillStyle(0xffbbdd,.8);graphics.fillCircle(v.x+Math.cos(a)*50,v.y-100+Math.sin(a)*38,3);}
        if(this.now<this.bossRestrainedUntil){const b=this.boss.model;graphics.lineStyle(2,0xff94c6,.9);graphics.strokeEllipse(b.x,b.y-180,52,15);}
      }}
    this.parrySignals=this.parrySignals.filter(signal=>{const age=this.now-signal.born;if(age>=450){signal.text.destroy();return false;}signal.text.setAlpha(Math.min(1,(450-age)/160));
      const alpha=1-age/220;if(alpha>0){graphics.lineStyle(bridge.settings().reducedShake?2:4,0xffefb0,alpha);for(let i=0;i<8;i++){const a=i*Math.PI/4;graphics.lineBetween(signal.x+Math.cos(a)*12,signal.y+Math.sin(a)*12,signal.x+Math.cos(a)*(35+age*.14),signal.y+Math.sin(a)*(35+age*.14));}}return true;});
    const technique=this.player.model.action;
    if(technique&&['skill1','skill2'].includes(technique.definition.action)){
      const p=this.player.model,age=this.now-technique.started,contact=technique.definition.events[0]?.at||192;
      const hue=p.id==='sasuke'?0xffb05c:p.id==='naruto'&&this.phase==='seal'?0xff6d47:0x9aecff;
      for(let i=0;i<(bridge.settings().reducedShake?3:7);i++){const phase=(age/260+i/7)%1,x=p.x+p.facing*(18+phase*50),y=p.y-84+Math.sin(i*2+age/95)*14;graphics.fillStyle(hue,age<contact?.7:.45);graphics.fillEllipse(x,y,3+phase*3,10+phase*14);}
      if(age>=contact&&age<contact+120){graphics.lineStyle(3,hue,(contact+120-age)/120);graphics.beginPath();graphics.arc(p.x+p.facing*35,p.y-82,25+(age-contact)*.25,-1.3,1.3);graphics.strokePath();}
    }
    const reading=this.player.model.id==='kakashi'&&this.readingUntil>this.now,reduced=bridge.settings().reducedShake;
    for(const bg of this.backgrounds){if(reading)bg.setTint(0x677e8b);else bg.clearTint();}
    this.sharinganEchoes=this.sharinganEchoes.filter(e=>{const age=this.now-Number(e.getData('born'));if(!reading||age>260){e.destroy();return false;}e.setAlpha((1-age/260)*.18);return true;});
    if(reading){
      const p=this.player.model;graphics.lineStyle(2,0xd63358,.4);graphics.strokeRect(this.cameras.main.scrollX+5,5,1270,710);
      const eyeX=p.x+p.facing*8,eyeY=p.y-CHARACTER[p.id].height*(p.action?.definition.action==='aerial'?.67:.84);
      graphics.fillStyle(0xff335b,1);graphics.fillEllipse(eyeX,eyeY,12,5);graphics.lineStyle(1,0xff6684,.7);graphics.strokeCircle(eyeX,eyeY,11);
      if(!reduced&&this.now-this.lastEcho>65){this.lastEcho=this.now;for(const f of [this.player,this.boss]){if(!f.sprite.visible)continue;const v=f.sprite;const echo=this.add.sprite(v.x,v.y,v.texture.key,v.frame.name).setOrigin(v.originX,v.originY).setScale(v.scaleX,v.scaleY).setFlipX(v.flipX).setTint(0x81cfd9).setAlpha(.18).setDepth(3);echo.setData('born',this.now);this.sharinganEchoes.push(echo);}}
      while(this.sharinganEchoes.length>8)this.sharinganEchoes.shift()!.destroy();
      for(const q of this.projectiles.slice(0,28)){const speed=Math.hypot(q.vx,q.vy)||1,dx=q.vx/speed,dy=q.vy/speed;
        graphics.lineStyle(1,0xbaf6ff,.22);graphics.lineBetween(q.x,q.y,q.x+dx*180,q.y+dy*180);
        for(let i=1;i<=(reduced?1:3);i++){graphics.lineStyle(1,0xc8ffff,.5-i*.1);graphics.strokeEllipse(q.x-dx*i*20,q.y-dy*i*20,8+i*3,16+i*5);}
      }
    }
    if(this.boss.model.action?.definition.id==='parry-stance'){const b=this.boss.model,age=this.now-b.action!.started;graphics.lineStyle(age>=450?4:2,0xaaf4ff,.9);graphics.strokeCircle(b.x,b.y-120,age>=450?25:15+age/45);}
    for(const projectile of this.projectiles){
      if(projectile.kind==='needle'&&projectile.expires>this.now){
        const speed=Math.hypot(projectile.vx,projectile.vy),dx=projectile.vx/speed,dy=projectile.vy/speed;
        graphics.lineStyle(2,0xbdefff,.28);graphics.lineBetween(projectile.x-dx*18,projectile.y-dy*18,projectile.x-dx*70,projectile.y-dy*70);
      }
      if(projectile.waterRow===undefined)continue;
      const direction=Math.sign(projectile.vx);
      projectile.trail.forEach((point,i)=>{graphics.fillStyle(0xb4f2ff,i/projectile.trail.length*.25);graphics.fillEllipse(point.x-direction*48,point.y+Math.sin(i*2+this.now/85)*12,8,3);});
    }
    for (let i = 0; i < this.mist.length; i++) {
      const mist = this.mist[i]; mist.x += dt * (.006 + i * .004); if (mist.x > 1690) mist.x = -400;
      mist.setAlpha(Phaser.Math.Linear(mist.alpha, this.now < this.mistUntil ? .17 : .045, .035));
    }
    if (this.phase === 'seal') {

      for (let i = 0; i < 6; i++) {const age = (this.now / 500 + i / 6) % 1; graphics.fillStyle(0xff6a44, (1 - age) * .5); graphics.fillEllipse(this.player.model.x + Math.sin(i * 5 + this.now / 250) * 40, this.player.model.y - age * 155, 4, 14);}
    }
    if (this.player.model.guard) {graphics.lineStyle(2, this.now < this.player.model.deflectUntil ? 0xffe6a2 : 0xa8c8d9, .65);
      const x = this.player.model.x + this.player.model.facing * 32; graphics.beginPath(); graphics.moveTo(x, this.player.model.y - 112); graphics.lineTo(x + this.player.model.facing * 11, this.player.model.y - 35); graphics.strokePath();}
    for(const f of [this.player,this.boss]) {
      const m=f.model, broken=m.guardBrokenUntil>this.now, stunned=m.hurtUntil>this.now;
      if(!broken&&!stunned)continue;
      const x=m.x,y=m.y-CHARACTER[m.id].height-16, color=broken?0xffad53:0xffe4a4;
      graphics.lineStyle(broken?4:2,color,.95); graphics.strokeEllipse(x,y,66,19);
      for(let i=0;i<3;i++){const angle=this.now/180+i*Math.PI*2/3;graphics.fillStyle(color,1);graphics.fillCircle(x+Math.cos(angle)*31,y+Math.sin(angle)*9,broken?4:3);}
      const remaining=broken?(m.guardBrokenUntil-this.now)/(m.isBoss?COMBAT.bossBreak:COMBAT.guardBreak):(m.hurtUntil-this.now)/420;
      graphics.fillStyle(0x071b23,.95);graphics.fillRect(x-31,y+19,62,6);graphics.fillStyle(color,1);graphics.fillRect(x-30,y+20,60*Math.min(1,remaining),4);
    }
    const action = this.boss.model.action;
    if (action) {
      const age = this.now - action.started, next = action.definition.events.find(event => event.at > age && (event.kind === 'hit' || event.kind === 'projectile' || event.kind === 'technique'));
      if (next) {
        const timeLeft = next.at - age, visible = timeLeft < (this.readingUntil > this.now ? 1050 : 800);
        const mirror = this.formation.active && this.now >= this.mirrorInterruptUntil ? this.formation.mirrors[this.formation.occupied] : null;
        const x = mirror?.x ?? this.boss.model.x, y = mirror ? mirror.y - 120 : this.boss.model.y - CHARACTER[this.boss.model.id].height - 22;
        if (visible) {
          const color = next.red ? 0xff4e59 : 0xf3dda8; graphics.lineStyle(next.red ? 4 : 2, color, .8);
          if (next.red) {graphics.beginPath(); graphics.moveTo(x, y - 9); graphics.lineTo(x, y + 2); graphics.strokePath(); graphics.fillStyle(color, 1); graphics.fillCircle(x, y + 8, 2.5);}
          if (mirror && visible && timeLeft<=400) {graphics.lineStyle(1, color, .16); graphics.lineBetween(mirror.x, mirror.y, this.targetX, this.targetY);}
        }
      }
    }
    if (this.phase === 'protect') {graphics.lineStyle(2, this.protectionUntil > this.now ? 0xdaf2af : 0xc4d4da, .4); graphics.strokeEllipse(190, this.floor + 1, 115, 15);}
  }
  private hurtTazuna(damage: number) {
    if (this.now < this.protectionHits + 800 || this.protectionUntil > this.now && Math.abs(this.player.model.x - 190) < 240) return;
    this.protectionHits = this.now; this.protection = Math.max(0, this.protection - damage * .65); this.burst('parry', 190, this.floor - 75, 75, 200); this.sounds.effect('impact', .5);
  }
  private progressStory(_dt: number) {
    if (this.player.model.health <= 0 || this.phase === 'protect' && this.protection <= 0) {
      this.endBarrage(true); this.gameOver = true; this.physics.world.pause(); this.inputs.clear(); this.sounds.sync(false); bridge.patch({screen: 'dead', health: this.player.model.health, protection: this.phase === 'protect' ? this.protection : null}); return;
    }
    if (this.phase === 'mirrors') {
      if (!this.narutoJoined && (this.boss.model.health < this.boss.model.maxHealth * .66 || this.phaseElapsed > 48)) {
        this.narutoJoined = true; this.director.state.narutoInMirrors = true;
        const ally = this.fighter('naruto-ally', 'naruto', this.arenaMin + 40, this.floor, false, 100, true); ally.body.body.setVelocityX(250); this.burst('smoke', ally.model.x, this.floor - 60, 130);
      }
      if (!this.sharingan && this.narutoJoined && (this.boss.model.health < this.boss.model.maxHealth * .60 || this.phaseElapsed > 32)) {
        this.sharingan = true; this.director.state.sharinganAwakened = true; this.readingUntil = this.now + 600000; this.player.model.stamina = 100;
        this.burst('parry', this.player.model.x, this.player.model.y - 105, 55, 700); this.sounds.effect('parry', .6, .8);
      }
    }
    const completed = this.director.objectiveComplete(this.boss.model.health, this.phaseElapsed, this.mirrorGuardBreaks);
    if (completed && !this.phaseEnding) {
      this.phaseEnding = true; this.inputs.clear(); this.sounds.stopEffects();
      if (this.phase === 'mirrors') {this.director.state.narutoInMirrors = true; this.director.state.sharinganAwakened = true;}
      this.director.finishObjective();
    }
  }
  private emit() {
    if (!this.player || !this.boss || this.director.mode !== 'fight') return;
    const p = this.player.model, b = this.boss.model, abilities = kit(this.phase), data = PHASES[this.phase];
    bridge.patch({reading: p.id === 'kakashi' ? Math.max(0,this.readingUntil-this.now)/1000 : 0, counter: this.counterUntil>this.now, character: data.character, health: p.health, stamina: p.stamina, chakra: p.chakra, ultimate: p.ultimate,
      guardBroken: this.now < p.guardBrokenUntil, guarding: p.guard, stunned:this.now<p.hurtUntil, recovery:Math.max(0,Math.max(p.hurtUntil,p.guardBrokenUntil)-this.now)/1000, subCooldown: p.cooldown('substitute', this.now),
      cloneCount: this.fighters.filter(f => f.key.startsWith('clone')).length, elapsed: this.elapsed, phaseElapsed: this.phaseElapsed,
      abilities: abilities.map((ability, i) => ({id:ability.attack.id, label: ability.label, description:ability.description, icon: ability.icon, cooldown: p.cooldown(ability.attack.id, this.now), cost: ability.attack.chakra || 0,
        ready: (i !== 2 || this.phase !== 'mirrors' || this.sharingan) && p.cooldown(ability.attack.id, this.now) === 0 && p.chakra >= (ability.attack.chakra || 0) && p.stamina >= ability.attack.stamina && p.ultimate >= (ability.attack.ultimate || 0)})),
      phaseProgress: this.phase === 'mirrors' ? (Math.min(1,this.phaseElapsed/45)+Math.min(1,this.mirrorGuardBreaks))/2 : 1 - b.health / b.maxHealth,
      objective: this.phase === 'mirrors' ? `Hold out ${Math.min(45,Math.floor(this.phaseElapsed))}/45s · Break Haku’s guard ${Math.min(1,this.mirrorGuardBreaks)}/1` : data.objective, protection: this.phase === 'protect' ? this.protection : null, retries: this.retries, parries: this.parries,
      device: this.inputs.device, fps: Math.round(this.game.loop.actualFps),
      boss: {name: this.phase === 'rescue' ? 'Zabuza · Water Clone' : CHARACTER[b.id].name, health: b.health, max: b.maxHealth, stamina: b.stamina,
        guardBroken: this.now < b.guardBrokenUntil, stunned:this.now<b.hurtUntil, postureFlash:this.now-b.postureHitAt<250, recovery:Math.max(0,Math.max(b.hurtUntil,b.guardBrokenUntil)-this.now)/1000,
        phase: this.formation.active ? 'Crystal Ice Mirrors' : this.now < this.mistUntil ? 'Silent Killing' : ''}});
  }
  private drawPrison(g:Phaser.GameObjects.Graphics,x:number,y:number,time:number){
    g.clear();g.fillStyle(0x73d9ee,.16);g.fillCircle(x,y,108);g.lineStyle(4,0x94efff,.7);g.strokeCircle(x,y,108);
    g.lineStyle(2,0xdcffff,.7);g.beginPath();g.arc(x,y,99,-2.75,-1.05);g.strokePath();
    g.lineStyle(1,0x9ce8ff,.3);g.strokeEllipse(x,y+Math.sin(time/600)*8,207,54);
    for(let i=0;i<8;i++){const a=i*.78+time*.0002;g.fillStyle(0xe3ffff,.55);g.fillCircle(x+Math.cos(a)*95,y+Math.sin(a)*95,2);}
  }
  private startCinema(clip: CinemaClip) {
    this.clearStage(); this.arena(clip.arena); this.physics.world.pause(); this.sounds.stopEffects(); this.sounds.sync(true); this.cinemaClock = 0;this.presentationClock=0;
    this.panelExiting=false;this.cinemaPresentation = new CinemaPresentation(this);
    for (const a of clip.actors) {
      const character: CharacterId | undefined = ['kakashi', 'naruto', 'sasuke', 'sakura', 'zabuza', 'haku'].includes(a.id) ? a.id as CharacterId : a.id === 'prisoner' ? 'kakashi' : a.id === 'clone' ? 'naruto' : undefined;
      let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
      if (character) {sprite = this.add.sprite(a.x, a.y, `${character}-locomotion`, '6').setDepth(a.animation === 'defeat' ? 1 : 4); poseBattle(sprite as Phaser.GameObjects.Sprite, character, a.animation, a.animation === 'defeat' ? 1400 : 0, a.facing);}
      else {const prop = a.id.startsWith('hound') ? a.id === 'hound1' ? 'hound' : `hound-${a.id.slice(-1)}` : a.id.startsWith('henchman') ? a.id === 'henchman1' ? 'henchman' : `henchman-${a.id.slice(-1)}` : a.id; sprite = namedArt(this, 'props', prop, a.x, a.y, 100).setOrigin(.5, 1).setDepth(3).setFlipX(a.facing < 0); sprite.setScale((a.id.startsWith('hound') ? 45 : a.id === 'gato' ? 124 : 158) / sprite.height);}
      if(a.animation==='defeat'&&(a.id==='gato'||a.id==='henchman1'||a.id==='henchman2'))endingPose(sprite,a.id==='gato'?'gato':'mercenary','defeat',a.animation==='defeat'?1000:0,a.facing);
      sprite.setAlpha(a.alpha ?? 1);
      this.cinemaActors.set(a.id, {sprite, id: a.id, character, animation: a.animation, animationAt: 0, facing: a.facing});
    }
    this.storyRepairs=new StoryRepairs(this,this.cinemaActors,this.floor,this.sounds);
    this.cinemaMotion=new CinematicMotionV14(this,this.cinemaActors,this.floor,this.sounds,()=>this.releaseCinematicPrison(),()=>this.shake(.002,140));
    if (clip.id === 'a-demon-in-the-snow'||clip.id==='haku-interception') {for (const id of ['hound1', 'hound2', 'hound3','gato','henchman1','henchman2','henchman3'] as ActorId[]) this.cinemaActors.get(id)?.sprite.setAlpha(0);}
    this.inputs.clear();this.inputs.quarantineConfirm(); bridge.patch({panelWaiting:false,canAdvance:false,screen: 'intro', boss: null, cinematic: clip.id, elapsed: this.elapsed});
  }
  private cinemaCue(cue: CinemaCue) {
    this.cinemaPresentation?.cue(cue, this.presentationClock);
    const actor = cue.actor ? this.cinemaActors.get(cue.actor) : undefined;
    if (actor) {
      if (cue.animation) {actor.animation = cue.animation; actor.animationAt = this.cinemaClock; actor.settleAt=['idle','guardbreak','defeat','block'].includes(cue.animation)?undefined:this.cinemaClock+(cue.duration||(['ultimate'].includes(cue.animation)?1100:650));}
      if(this.director.clip?.id==='water-prison'&&cue.actor==='zabuza'&&cue.animation==='cast')actor.settleAt=undefined;
      if (cue.facing) actor.facing = cue.facing;
      else if (cue.x !== undefined && ['run','dash','airdash'].includes(cue.animation || '') && Math.abs(cue.x-actor.sprite.x)>1) actor.facing = cue.x > actor.sprite.x ? 1 : -1;
      if (cue.alpha !== undefined) actor.sprite.setAlpha(cue.alpha);
      if (cue.actor?.startsWith('hound') && cue.x !== undefined) actor.sprite.setAlpha(1);
      if (cue.x !== undefined || cue.y !== undefined) {
        this.tweens.killTweensOf(actor.sprite);
        if (cue.duration) this.tweens.add({targets: actor.sprite, x: cue.x ?? actor.sprite.x, y: cue.y ?? actor.sprite.y, duration: cue.duration, ease: cue.animation === 'run' ? 'Linear' : 'Cubic.easeInOut',
          onComplete: () => {if (actor.animation === cue.animation && ['run','dash','airdash','land'].includes(actor.animation)) {actor.animation = 'idle'; actor.animationAt = this.cinemaClock;}}});
        else actor.sprite.setPosition(cue.x ?? actor.sprite.x, cue.y ?? actor.sprite.y);
      }
      if (actor.character && ['hurt', 'cast', 'ultimate', 'heavy'].includes(cue.animation || '')) this.sounds.voice(actor.character, cue.animation === 'hurt' ? 'hurt' : 'cast');
    }
    if (cue.camera !== undefined) {this.tweens.killTweensOf(this.cameras.main);this.tweens.add({targets: this.cameras.main, scrollX: clamp(cue.camera, 0, ARENAS[this.director.clip!.arena].width - 1280), duration: cue.duration || 1, ease: 'Sine.easeInOut'});}
    if (cue.zoom) this.cameras.main.zoomTo(cue.zoom, cue.duration || 600);
    if (cue.fade === 'out') this.cameras.main.fadeOut(650, 4, 15, 22); if (cue.fade === 'in') this.cameras.main.fadeIn(750, 4, 15, 22);
    if(cue.motion)this.cinemaMotion?.start(cue.motion,cue.at);
    if (!cue.effect) return;
    const x = actor?.sprite.x ?? 830, y = (actor?.sprite.y ?? this.floor) - 70;
    if (cue.effect === 'prison') {this.cinemaPrison?.destroy();this.prisonActor=actor||null;actor?.sprite.setAlpha(1);this.cinemaPrison=this.add.graphics().setDepth(5);this.drawPrison(this.cinemaPrison,x,y,this.cinemaClock);this.sounds.effect('water',.8);}
    else if (cue.effect === 'mirrors') {
      const formation = new MirrorFormation(); formation.create(830, this.floor);
      for(const [i,m]of formation.mirrors.entries()){const {reflection}=mirrorVisual(this,m.x,m.y,this.floor,'prison',2);this.cinemaActors.set(`reflection-${i}`,{id:`reflection-${i}`,sprite:reflection,character:'haku',animation:'idle',animationAt:0,facing:m.x>830?-1:1});}
      this.sounds.effect('ice', .7);
    } else if (cue.effect === 'snow') {this.snowActive = true; this.snow = Array.from({length: 85}, () => ({x: Math.random() * 1660, y: Math.random() * 720, speed: 15 + Math.random() * 22})); this.sounds.setTrack('snow');}
    else if (cue.effect === 'shuriken' && cue.actor==='haku') {
      const target=this.cinemaActors.get('sasuke')?.sprite;for(let i=0;i<3;i++){const needle=makeEffect(this,'needle',x,y+(i-1)*7,72).setDisplaySize(72,14).setDepth(6);const tx=target?.x??x-500,ty=(target?.y??this.floor)-80+(i-1)*12;needle.setRotation(Math.atan2(ty-needle.y,tx-needle.x));this.tweens.add({targets:needle,x:tx,y:ty,duration:420+i*35,onComplete:()=>{this.burst('needle-impact',tx,ty,60,200);needle.destroy();}});}this.sounds.effect('ice',.5);
    } else if (cue.effect === 'shuriken') {
      const tool = (cue.actor === 'zabuza' ? this.add.image(x, y, 'v2-zabuza-sword').setDisplaySize(240, 40) : namedArt(this, 'props', cue.actor === 'sasuke' ? 'windmill-shuriken' : 'shuriken', x, y, cue.actor === 'sasuke' ? 90 : 32)).setDepth(5);
      this.tweens.add({targets: tool, x: x + (actor?.facing || 1) * 630, rotation: Math.PI * 8, duration: 1050, onComplete: () => tool.destroy()}); this.sounds.effect('swing', .65);
    } else if (cue.effect === 'mask') {const mask = namedArt(this, 'props', 'haku-mask', x, y - 40, 40).setDepth(5); this.tweens.add({targets: mask, y: this.floor, rotation: 2, x: x - 90, duration: 750}); this.burst('ice-shards', x, y, 120, 450);}
    else {
      const effect = cue.effect === 'aura' ? 'chakra-aura' : cue.effect === 'water' ? 'water-dragon' : cue.effect === 'ice' ? 'ice-shards' : cue.effect === 'impact' ? 'parry' : cue.effect;
      this.burst(effect, x, y, cue.effect === 'water' ? 280 : cue.effect === 'aura' ? 185 : 130, cue.effect === 'aura' ? 2300 : 650, actor?.facing || 1);
      this.sounds.effect(cue.effect === 'aura' ? 'fire' : cue.effect as EffectName, .75);
      if (cue.effect === 'water' && cue.actor === 'prisoner') {this.cinemaPrison?.destroy(); this.cinemaPrison = null;this.prisonActor=null; actor?.sprite.setAlpha(1);}
    }
  }
  private releaseCinematicPrison(){
    this.cinemaPrison?.destroy();this.cinemaPrison=null;this.prisonActor=null;
    const prisoner=this.cinemaActors.get('prisoner');if(prisoner){prisoner.animation='land';prisoner.animationAt=this.director.clock;prisoner.settleAt=this.director.clock+500;this.tweens.add({targets:prisoner.sprite,y:this.floor,duration:420,ease:'Quad.easeIn'});this.burst('waterfall',prisoner.sprite.x,prisoner.sprite.y-60,185,420);this.sounds.softWater();}
  }
  private updateCinema(dt: number) {
    this.now+=dt;this.presentationClock+=dt;
    this.director.update(dt);if(this.director.mode!=='cinematic')return;this.cinemaClock=this.director.clock;
    this.tweens.resumeAll();
    bridge.patch({panelWaiting:false,canAdvance:false});
    const storyClock=this.cinemaClock+(this.director.clip?.offset||0);

    for (const actor of this.cinemaActors.values()) {
      if(actor.settleAt&&this.cinemaClock>=actor.settleAt){actor.animation='idle';actor.animationAt=this.cinemaClock;actor.settleAt=undefined;}
      if (actor.character) {const clip = this.director.clip?.id;
        const variant = actor.character === 'zabuza' && ['a-demon-in-the-snow','gatos-betrayal','snowy-rest'].includes(clip||'') && storyClock >= 18700 ? 'final-stand' : actor.character === 'haku' && (['a-demon-in-the-snow','haku-interception','gatos-betrayal','snowy-rest'].includes(clip||'') || clip === 'narutos-hesitation' && this.cinemaClock >= 2200) ? 'unmasked' : actor.character === 'naruto' && (clip === 'narutos-hesitation' || clip === 'sasuke-protects-naruto' && this.cinemaClock >= 12800) ? 'awakened' : undefined;
        poseBattle(actor.sprite as Phaser.GameObjects.Sprite, actor.character, actor.animation, this.cinemaClock - actor.animationAt, actor.facing, undefined, variant);
        if(actor.animation==='guardbreak'&&variant!=='final-stand'&&!(actor.character==='naruto'&&clip==='narutos-hesitation')){const kind=actor.character==='kakashi'?(['water-prison','transformed-shuriken'].includes(clip||'')?'restrained':'exhausted'):actor.character==='naruto'?'kneeling-grief':actor.character==='sakura'?'kneeling':actor.character==='haku'?(variant==='unmasked'?'unmasked-weary':'weary'):actor.character==='zabuza'?'injured':'guard-break';reactionPose(actor.sprite,actor.character,kind,this.cinemaClock-actor.animationAt,actor.facing);}
        if(actor.character==='naruto'&&clip==='narutos-hesitation'&&actor.animation==='guardbreak')poseBattle(actor.sprite as Phaser.GameObjects.Sprite,'naruto','idle',0,actor.facing);
        if (actor.animation === 'defeat') actor.sprite.setDepth(1);}
      else {actor.sprite.setFlipX(actor.facing<0);if(actor.animation==='hurt'&&(actor.id==='gato'||actor.id.startsWith('henchman')))endingPose(actor.sprite,actor.id==='gato'?'gato':'mercenary','defeat',Math.min(120,this.cinemaClock-actor.animationAt),actor.facing);if(actor.animation==='defeat'&&(actor.id==='gato'||actor.id.startsWith('henchman')))endingPose(actor.sprite,actor.id==='gato'?'gato':'mercenary','defeat',this.cinemaClock-actor.animationAt,actor.facing);}
    }
    this.cinemaMotion?.update(this.cinemaClock);this.storyRepairs?.update(this.director.clip?.id||'',this.cinemaClock,storyClock);fitAllMirrors(this);
    if(this.cinemaPrison&&this.prisonActor)this.drawPrison(this.cinemaPrison,this.prisonActor.sprite.x,this.prisonActor.sprite.y-78,this.cinemaClock);
    this.updateEffects(dt); this.cueGraphics.clear();
    this.cinemaPresentation?.update(this.presentationClock, id => id ? this.cinemaActors.get(id)?.sprite : undefined);
    if (this.snowActive) for (const flake of this.snow) {
      flake.y += flake.speed * dt / 1000; flake.x += Math.sin(flake.y / 80) * dt * .004; if (flake.y > 730) flake.y = -10;
      this.cueGraphics.fillStyle(0xf0faff, .7); this.cueGraphics.fillCircle(flake.x, flake.y, 1.1 + flake.speed / 24);
    }
  }
  private finishChapter() {
    // Natural completion and skip reconstruct the same final bridge tableau.
    this.clearStage(); this.arena('bridge'); this.cameras.main.scrollX = 380;
    for (const a of [{id:'haku' as const,x:1120,animation:'defeat' as const,facing:-1},{id:'zabuza' as const,x:1260,animation:'defeat' as const,facing:1},{id:'kakashi' as const,x:990,animation:'idle' as const,facing:1},{id:'naruto' as const,x:830,animation:'idle' as const,facing:1},{id:'sasuke' as const,x:1430,animation:'idle' as const,facing:-1},{id:'sakura' as const,x:1530,animation:'idle' as const,facing:-1}]) {
      const sprite=this.add.sprite(a.x,this.floor,`${a.id}-locomotion`,'6').setDepth(a.animation==='defeat'?1:4);
      poseBattle(sprite,a.id,a.animation,1400,a.facing,undefined,a.id==='haku'?'unmasked':undefined);
    }
    this.cueGraphics.fillStyle(0xf5fbff,.75);for(let i=0;i<85;i++)this.cueGraphics.fillCircle((i*179)%1660,(i*83)%710,1.5+(i%3)*.4);
    this.physics.world.pause(); this.inputs.clear(); this.sounds.setTrack('snow'); this.cameras.main.fadeIn(500, 4, 15, 22);
    bridge.patch({screen: 'victory', elapsed: this.elapsed, boss: null, phaseProgress: 1, parries: this.parries, retries: this.retries});
  }
  command(command: Command) {
    if(typeof command!=='string')return;
    if(this.transitionActive&&command!=='pause'&&command!=='resume')return;
    if(command==='advance')return;
    if (command === 'pause' && ['playing', 'intro'].includes(bridge.get().screen)) {
      this.emit();
      this.pausedFrom = bridge.get().screen as 'playing' | 'intro'; this.physics.world.pause(); this.tweens.pauseAll(); this.inputs.clear(); this.sounds.sync(false); bridge.patch({screen: 'paused'});
    } else if (command === 'resume' && bridge.get().screen === 'paused') {
      this.inputs.clear(); this.tweens.resumeAll(); if (this.pausedFrom === 'playing') this.physics.world.resume(); this.sounds.sync(true); void this.sounds.unlock(); bridge.patch({screen: this.pausedFrom});
    } else if (command === 'skip' && this.director.mode === 'cinematic' && bridge.get().screen === 'intro') {this.inputs.clear();this.inputs.quarantineConfirm(); this.director.skip();}
  }
  status() {
    if (!this.director) return {mode: 'inactive'};
    return {mirrorPresentation:this.children.list.filter(c=>c.getData?.('mirrorReflection')).map(c=>{const image=c as Phaser.GameObjects.Image,reflection=image.getData('mirrorReflection') as Phaser.GameObjects.Sprite;return{mirror:image.getBounds(),reflection:visibleBodyBounds(reflection),reflectionVisible:reflection.visible,zoom:this.cameras.main.zoom,scrollY:this.cameras.main.scrollY};}),waterProjectiles:this.projectiles.filter(p=>p.water).map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy,born:p.born,phase:p.water!.phase,reason:p.water!.reason,groundWave:p.groundWave,frame:p.image.frame.name})),barrage:this.barrage?{id:this.barrage.timeline.id,variant:this.barrage.timeline.variant,seed:this.barrage.timeline.seed,age:this.barrage.timeline.age,recovering:this.barrage.timeline.recovering,warnings:this.barrage.timeline.warnings,releases:[...this.barrage.timeline.prepared.values()].filter(v=>v.releaseTarget)}:null,pool:this.projectilePool.length,sword:this.projectiles.filter(p=>p.sword).map(p=>({phase:p.sword!.phase,x:p.x,y:p.y,harmless:p.sword!.harmless,hit:[...p.hit]})),swordCatchUntil:this.swordCatchUntil,transitionActive:this.transitionActive,storyRepairs:this.storyRepairs?.status(),cinemaMotion:this.cinemaMotion?.status(),cinema: this.director.clip ? {id:this.director.clip.id,clock:this.cinemaClock,waiting:this.director.waiting,canAdvance:this.director.canAdvance&&!this.panelExiting,actors:[...this.cinemaActors.values()].map(a=>({id:a.id,x:a.sprite.x,y:a.sprite.y,facing:a.facing,animation:a.animation}))} : null, mirrorGuardBreaks:this.mirrorGuardBreaks, phase: this.phase, story: this.director.state, mode: this.director.mode, time: Math.round(this.now), phaseElapsed: this.phaseElapsed,ultimatesUsed:this.ultimatesUsed,
      player: this.player ? {x: Math.round(this.player.model.x), y: Math.round(this.player.model.y), health: this.player.model.health, stamina: Math.round(this.player.model.stamina),
        chakra: Math.round(this.player.model.chakra), ultimate: Math.round(this.player.model.ultimate), action: this.player.model.action?.definition.id, guarding: this.player.model.guard, facing: this.player.model.facing} : null,
      boss: this.boss ? {x: Math.round(this.boss.model.x), y: Math.round(this.boss.model.y), health: this.boss.model.health, stamina: Math.round(this.boss.model.stamina),
        move: this.boss.model.action?.definition.id, started: this.boss.model.action?.started, readyAt: Math.round(this.brain?.readyAt), recovery: !this.boss.model.action,
        hitAt: this.boss.model.action?.definition.events.map(e => ({at: e.at, red: !!e.red, kind: e.kind})), guardBrokenUntil: this.boss.model.guardBrokenUntil} : null,
      mirrorExit:this.mirrorExit?{x:this.mirrorExit.x,y:this.mirrorExit.y,frame:this.mirrorExit.frame,landed:this.mirrorExit.landedAt!==null,stunned:this.mirrorExit.stunned}:null, mirrors: {active: this.formation.active, occupied: this.formation.occupied, exposedUntil: this.formation.exposedUntil, count: this.formation.count(), mirrors: this.formation.mirrors},
      parryFeedback:this.parrySignals.map(p=>({x:p.x,y:p.y,age:this.now-p.born})),fps:Math.round(this.game.loop.actualFps),
      allies:this.fighters.filter(f=>f.support).map(f=>({id:f.key,action:f.model.action?.definition.id,casts:f.supportCasts||0,stamina:f.model.stamina,guarding:f.model.guard,x:f.model.x})), counts: {fighters: this.fighters.length, projectiles: this.projectiles.length, effects: this.effects.length, decoys: this.decoys.length, displayObjects: this.children.length}, audio: this.sounds.status()};
  }
}
