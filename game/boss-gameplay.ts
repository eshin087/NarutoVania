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
import {UltimateBurst} from './ultimate-burst';

type BodyObject = Phaser.GameObjects.Rectangle & {body: Phaser.Physics.Arcade.Body};
interface Fighter {key: string; model: Combatant; body: BodyObject; sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Ellipse; animation: AnimationName; animationAt: number; lastStep: number; ally: boolean; hostile: boolean; expires: number; nextAttack: number; rush?: {x: number; until: number; serial: number};}
interface Projectile {image: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; damage: number; posture: number; red: boolean; friendly: boolean; owner: Fighter; expires: number; rx: number; ry: number; kind: string; hit: Set<string>; returnAt?: number; waterRow?:number; born:number; trail:{x:number;y:number}[];}
interface VisualEffect {image: Phaser.GameObjects.Image; born: number; duration: number; width: number; grow: number; spin: number; waterRow?:number;}
interface MirrorVisual {image: Phaser.GameObjects.Image; reflection: Phaser.GameObjects.Sprite; halo: Phaser.GameObjects.Ellipse;}
interface Decoy {image: Phaser.GameObjects.Image; x: number; y: number; expires: number;}
interface CinemaVisual {sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image; id: ActorId; character?: CharacterId; animation: AnimationName; animationAt: number; facing: -1 | 1;}

export class BossGameScene extends Phaser.Scene {
  inputs!: BattleInput; sounds!: RecordedAudio; director!: StoryDirector; phase: StoryPhaseId = 'mist';
  player!: Fighter; boss!: Fighter; brain!: BossBrain; fighters: Fighter[] = []; projectiles: Projectile[] = []; effects: VisualEffect[] = []; decoys: Decoy[] = [];
  formation = new MirrorFormation(); mirrorVisuals: MirrorVisual[] = []; mirrorEnd = 0; mirrorInterruptUntil = 0; nextMirrorTransfer = 0;
  floors!: Phaser.Physics.Arcade.StaticGroup; floor = 592; arenaMin = 70; arenaMax = 1490;
  now = 0; elapsed = 0; phaseElapsed = 0; lastEmit = 0; hitStop = 0; lastHitStop = -9999; jumpQueued = -9999; lastGround = 0; landedAt = 0;
  backgrounds: Phaser.GameObjects.Image[] = []; mist: Phaser.GameObjects.Image[] = []; cueGraphics!: Phaser.GameObjects.Graphics;
  mistUntil = 0; readingUntil = 0; bossRestrainedUntil = 0; targetX = 0; targetY = 0; aimLocked = false; redCueAt = 0;
  clonesCreated = 0; parries = 0; retries = 0; protection = 100; protectionHits = 0; protectionUntil = 0;
  sharingan = false; narutoJoined = false; phaseEnding = false; gameOver = false; pausedFrom: 'playing' | 'intro' = 'playing';
  cinemaActors = new Map<ActorId, CinemaVisual>(); cinemaClock = 0; cinemaPrison: Phaser.GameObjects.Image | null = null;
  followups: {at: number; fighter: Fighter; event: AttackEvent; key: string; serial: number}[] = [];
  sceneryActors: Phaser.GameObjects.GameObject[] = []; snow: {x: number; y: number; speed: number}[] = []; snowActive = false;
  ultimateBurst: UltimateBurst | null = null;
  constructor() {super('BossGameplay');}
  init(data: {checkpoint?: StoryPhaseId; elapsed?: number; retries?: number; parries?: number; inputs: BattleInput; soundscape: RecordedAudio; viewIntro?: boolean}) {
    this.phase = data.checkpoint || 'mist'; this.inputs = data.inputs; this.sounds = data.soundscape; this.elapsed = data.elapsed || 0;
    this.retries = data.retries || 0; this.parries = data.parries || 0; this.registry.set('view-boss-intro', data.viewIntro === true);
    this.fighters = []; this.projectiles = []; this.effects = []; this.decoys = []; this.mirrorVisuals = []; this.backgrounds = []; this.mist = [];
    this.cinemaActors = new Map(); this.sceneryActors = []; this.followups = []; this.now = 0; this.hitStop = 0; this.lastHitStop = -9999; this.lastEmit = 0;
    this.phaseEnding = false; this.gameOver = false; this.snowActive = false; this.snow = []; this.formation = new MirrorFormation();
  }
  create() {
    this.director = new StoryDirector(this.phase, {enter: state => this.enterPhase(state), cinematic: clip => this.startCinema(clip), cue: cue => this.cinemaCue(cue), complete: () => this.finishChapter()});
    this.director.start(this.registry.get('view-boss-intro')); this.inputs.clear(); void this.sounds.unlock();
    // Phaser tears down physics before user shutdown listeners. Let its scene systems own disposal.
    this.events.once('shutdown', () => {this.inputs.clear(); this.sounds.stopEffects();});
  }
  private clearStage() {
    this.ultimateBurst?.destroy(); this.ultimateBurst = null;
    this.physics.world.resume(); this.tweens.killAll(); this.physics.world.colliders.destroy(); if (this.floors?.scene) this.floors.destroy(true);
    this.children.removeAll(true); this.fighters = []; this.projectiles = []; this.effects = []; this.decoys = []; this.mirrorVisuals = [];
    this.backgrounds = []; this.mist = []; this.sceneryActors = []; this.followups = []; this.cinemaActors.clear(); this.cinemaPrison = null;
    this.formation = new MirrorFormation(); this.snowActive = false;
  }
  private arena(name: 'lakeside' | 'bridge') {
    const arena = ARENAS[name]; this.floor = arena.floor; this.arenaMin = arena.min; this.arenaMax = arena.max;
    this.physics.world.setBounds(arena.min, -350, arena.max - arena.min, 1200);
    const back = this.add.image(640, 350, `v2-${name}-background`).setDisplaySize(1350, 760).setScrollFactor(0).setDepth(-30);
    this.backgrounds.push(back);
    const ground = this.add.image(arena.width / 2, arena.floor - 7, `v2-${name}-ground`).setOrigin(.5, 0).setDisplaySize(arena.width + 80, 145).setDepth(-4);
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
    this.protection = 100; this.protectionHits = 0; this.protectionUntil = 0; this.sharingan = state.sharinganAwakened; this.narutoJoined = state.narutoInMirrors;
    this.mirrorEnd = 0; this.mirrorInterruptUntil = 0; this.nextMirrorTransfer = 0; this.mistUntil = 0; this.readingUntil = 0; this.bossRestrainedUntil = 0;
    this.player = this.fighter('player', data.character, data.playerX, this.floor, false, 100);
    this.boss = this.fighter('boss', data.boss, data.bossX, this.floor, true, data.hp); this.boss.model.facing = -1;
    this.player.body.body.pushable = false; this.boss.body.body.pushable = false;
    this.physics.add.collider(this.player.body, this.boss.body, undefined, () => this.player.model.grounded && this.boss.model.grounded && !['dash', 'airdash', 'slide', 'substitute'].includes(this.player.model.action?.definition.action || '') && !this.formation.active);
    this.brain = new BossBrain(this.boss.model, this.phase); this.targetX = this.player.model.x; this.targetY = this.floor - 72;
    this.stageStoryActors(); this.cameras.main.scrollX = clamp((data.playerX + data.bossX) / 2 - 640, 0, ARENAS[data.arena].width - 1280);
    bridge.checkpoint(this.phase); this.inputs.clear(); bridge.patch({screen: 'playing', character: data.character, health: 100, stamina: 100, chakra: 100, ultimate: 0,
      stage: data.title, objective: data.objective, phaseProgress: 0, phaseElapsed: 0, cinematic: '', ultimateCinematic:'', protection: this.phase === 'protect' ? 100 : null});
    this.sounds.setTrack(data.boss === 'haku' ? 'mirrors' : 'lakeside'); this.sounds.sync(true); this.emit();
    this.cameras.main.fadeIn(450, 4, 16, 24);
  }
  private fighter(key: string, id: CharacterId, x: number, feet: number, isBoss: boolean, hp: number, ally = false): Fighter {
    const body = this.add.rectangle(x, feet - 52, 44, 104, 0, 0) as BodyObject; this.physics.add.existing(body);
    body.body.setCollideWorldBounds(true).setMaxVelocity(920, 1050).setDragX(1900);
    this.physics.add.collider(body, this.floors);
    const model = new Combatant(id, hp, isBoss); model.x = x; model.y = feet;
    const sprite = this.add.sprite(x, feet, `${id}-locomotion`, '6').setDepth(4);
    const shadow = this.add.ellipse(x, this.floor + 2, isBoss ? 78 : 60, 11, 0x08131c, .28).setDepth(-1);
    const fighter: Fighter = {key, model, body, sprite, shadow, animation: 'idle', animationAt: this.now, lastStep: 0, ally, hostile: isBoss || key.startsWith('water-clone'), expires: 0, nextAttack: this.now + 700};
    this.fighters.push(fighter); this.drawFighter(fighter); return fighter;
  }
  private stageStoryActors() {
    const prop = (name: string, x: number, width = 105) => {const p = namedArt(this, 'props', name, x, this.floor, width).setOrigin(.5, 1).setDepth(2); p.setScale(158 / p.height); this.sceneryActors.push(p); return p;};
    if (this.phase === 'rescue') {
      this.sceneryActors.push(namedArt(this, 'props', 'water-prison', 1350, this.floor - 93, 170).setDepth(5));
      const original = this.add.sprite(1240, this.floor, 'zabuza-techniques', '12').setDepth(2); poseBattle(original, 'zabuza', 'cast', 250, 1); this.sceneryActors.push(original);
      this.boss.sprite.setTint(0x85c6da).setAlpha(.83); this.fighter('sasuke-ally', 'sasuke', 300, this.floor, false, 100, true);
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
    if (animation === 'idle' && Math.abs(f.body.body.velocity.x) > 30) animation = 'run';
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
    poseBattle(f.sprite, model.id, animation, elapsed, model.facing, duration, this.phase === 'seal' && model.id === 'naruto' ? 'awakened' : undefined); f.sprite.setPosition(model.x, model.y + 2);
    f.shadow.setPosition(model.x, this.floor + 2).setScale(clamp(1 - (this.floor - model.y) / 550, .25, 1));
    const hidden = f === this.boss && this.formation.active && this.formation.occupied >= 0 && this.now >= this.mirrorInterruptUntil;
    f.sprite.setVisible(!hidden); f.shadow.setVisible(!hidden);
    if (f.key.startsWith('water-clone')) f.sprite.setAlpha(.55).setTint(0x7fdef0);
    else if (f.key.startsWith('clone')) f.sprite.setAlpha(.6).setTint(0xc1ddf5);
    else if (this.phase === 'rescue' && f === this.boss) f.sprite.setAlpha(.8).setTint(0x86c8dc);
    else {f.sprite.setAlpha(this.now < model.immuneUntil && !model.action?.definition.invulnerable && Math.floor(this.now / 70) % 2 ? .48 : 1);
      if (this.now < model.guardBrokenUntil) f.sprite.setTint(0xffb35b);
      else if (this.now < model.hurtUntil) f.sprite.setTint(0xffd18b);
      else if (this.now - model.damagedAt < 90) f.sprite.setTintFill(0xfff0dc);
      else if (this.phase === 'seal' && f === this.player) f.sprite.setTint(0xffbc9a); else f.sprite.clearTint();}
    if (this.now < model.hurtUntil || this.now < model.guardBrokenUntil) f.sprite.setAlpha(1);
    if (animation === 'run' && this.now - f.lastStep >= 255 && model.grounded) {f.lastStep = this.now; this.sounds.effect('step', .2);}
  }
  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50), screen = bridge.get().screen;
    this.inputs.poll();
    if (screen === 'paused' || screen === 'dead' || screen === 'victory') {this.inputs.endFrame(); return;}
    if (this.director.mode === 'cinematic') {this.updateCinema(dt); this.inputs.endFrame(); return;}
    if (screen !== 'playing' || this.gameOver || !this.player || !this.boss) {this.inputs.endFrame(); return;}
    if (this.ultimateBurst) {this.updateUltimate(dt); this.inputs.endFrame(); return;}
    if (this.hitStop > 0) {this.hitStop -= dt; this.physics.world.pause(); if (this.hitStop <= 0) this.physics.world.resume(); this.inputs.endFrame(); return;}
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
    this.progressStory(dt); this.trackCamera(); this.inputs.endFrame();
    if (this.now - this.lastEmit > 65) {this.lastEmit = this.now; this.emit();}
  }
  private trackCamera() {
    const width = ARENAS[PHASES[this.phase].arena].width;
    const target = clamp((this.player.model.x * .62 + this.boss.model.x * .38) - 640, 0, width - 1280);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, target, .065);
    this.backgrounds[0].x = 640 - this.cameras.main.scrollX * .075;
  }
  private stopForImpact(duration = 30) {if (this.now - this.lastHitStop < 150) return; this.lastHitStop = this.now; this.hitStop = duration;}
  private shake(amount = .0025, duration = 100) {if (!bridge.settings().reducedShake) this.cameras.main.shake(duration, amount);}
  private beginUltimate() {
    const p=this.player.model,b=this.boss.model,ability=kit(this.phase)[2];
    this.physics.world.pause(); this.hitStop=0; this.inputs.clear();
    if(this.formation.active) {
      const occupied=this.formation.mirrors[this.formation.occupied];
      this.mirrorInterruptUntil=this.now+2600;
      if(occupied)this.teleport(this.boss,clamp(occupied.x,this.arenaMin+90,this.arenaMax-90),this.floor);
      if(this.phase==='seal'){
        for(const mirror of this.formation.mirrors){mirror.hp=0;mirror.broken=true;this.burst('ice-shards',mirror.x,mirror.y,180,600);}
        this.endMirrors();
      }
    }
    p.facing=p.x<=b.x?1:-1; if(p.action)p.action.facing=p.facing;
    b.action=null;b.guard=false;this.brain.readyAt=Math.max(this.brain.readyAt,this.now+1000);
    this.ultimateBurst=new UltimateBurst(this,PHASES[this.phase].character,ability.label,p.x,b.x,this.floor,p.facing,beat=>{
      if(beat==='charge'){this.sounds.ultimate(p.id as 'kakashi'|'naruto'|'sasuke'|'sakura','charge');this.sounds.voice(p.id,'cast');}
      else if(beat==='finish'){this.sounds.ultimate(p.id as 'kakashi'|'naruto'|'sasuke'|'sakura','finish');this.shake(.006,180);}
      else this.sounds.effect('impact2',.75);
    });
    bridge.patch({ultimateCinematic:ability.label,ultimate:p.ultimate}); this.emit();
  }
  private updateUltimate(dt:number) {
    const burst=this.ultimateBurst!;this.physics.world.pause();const state=burst.update(dt),p=this.player.model;
    this.teleport(this.player,clamp(state.x,this.arenaMin+32,this.arenaMax-32),this.floor);
    poseBattle(this.player.sprite,p.id,burst.age<600?'ultimate':burst.age<930?'dash':'heavy',burst.age<600?burst.age:burst.age-930,p.facing,700);
    this.player.sprite.setPosition(p.x,p.y).setAlpha(1).setTint(burst.color);
    if(state.impact){
      burst.impacted=true;const event=kit(this.phase)[2].attack.events[0];
      this.boss.model.immuneUntil=0;
      this.hit(this.player,this.boss,{...event,kind:'hit',posture:64},`ultimate-${p.serial}`);
      if(this.boss.model.guardBrokenUntil<=this.now)this.boss.model.stagger(this.now,650);
      poseBattle(this.boss.sprite,this.boss.model.id,'hurt',120,this.boss.model.facing);
      this.boss.sprite.setTint(0xffe2ae).setAlpha(1);
    }
    this.trackCamera();
    if(state.complete){
      burst.destroy();this.ultimateBurst=null;p.action=null;p.immuneUntil=this.now+550;p.hitTargets.clear();
      this.hitStop=0;this.elapsed+=1.7;this.phaseElapsed+=1.7;this.sounds.duck(false);
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
    if (input.pressed('ultimate') && (this.phase !== 'mirrors' || this.sharingan) && p.start(abilities[2].attack, this.now)) {this.beginUltimate(); return;}
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
  private controlBoss() {
    const f = this.boss, p = f.model, body = f.body.body;
    if (p.health <= 0 || this.now < p.guardBrokenUntil || this.now < p.hurtUntil || this.now < this.bossRestrainedUntil) {body.setVelocityX(0); return;}
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
        this.sounds.voice(p.id, move.animation === 'cast' || move.animation === 'ultimate' ? 'cast' : 'attack');
      } else {
        const mirrored = this.formation.active && this.now >= this.mirrorInterruptUntil;
        const speed = !p.guard && this.now >= this.brain.readyAt - 250 && !mirrored ? (distance > 155 ? p.facing * (p.id === 'haku' ? 175 : 118) : distance < 70 ? -p.facing * 65 : 0) : 0;
        body.setVelocityX(speed);
      }
    }
    if (p.action) {
      const move = p.action.definition as BossMove, age = this.now - p.action.started;
      if (!this.aimLocked && age >= 220) {this.targetX = targetX; this.targetY = targetY; this.aimLocked = true;}
      const first = move.events[0]?.at || 500;
      const speed = move.move && age > 250 && age < first - 100 && !this.formation.active ? move.move * p.action.facing : 0;
      body.setVelocityX(speed);
      const nextRed = move.events.find(event => event.red && age < event.at);
      if (nextRed && nextRed.at - age < 800 && this.redCueAt !== nextRed.at) {this.redCueAt = nextRed.at; this.sounds.effect('warning', .55, 1);}
      if (move.id === 'ice-prison-rush' && this.formation.active && age > 900 && age < 2400 && this.now >= this.nextMirrorTransfer) {this.transferMirror(false); this.nextMirrorTransfer = this.now + 680;}
      if (move.id === 'ice-prison-rush' && age > 2440 && this.now >= this.mirrorInterruptUntil) {
        this.mirrorInterruptUntil = this.now + 1600; const x = clamp(this.player.model.x + (this.player.model.x < 830 ? 160 : -160), this.arenaMin + 50, this.arenaMax - 50);
        this.teleport(f, x, this.floor); p.facing = x < this.player.model.x ? 1 : -1; p.action.facing = p.facing;
      }
    }
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
    if (event.effect && event.kind !== 'technique' && event.kind !== 'hit') this.sounds.effect(event.effect==='swing'&&f.model.id==='zabuza'?'swing2':event.effect, f.ally ? .22 : .65);
    if (event.kind === 'effect') {
      if (event.effect === 'dash') this.burst('smoke', f.model.x - f.model.facing * 30, f.model.y - 25, 90, 260);
      return;
    }
    if (event.kind === 'technique') {if (f.hostile) this.bossTechnique(f, event, key); else this.playerTechnique(f, event, key); return;}
    if (event.kind === 'projectile') {
      if(event.effect!=='water'&&event.effect!=='fire')this.sounds.tool();
      const count = event.count || 1;
      for (let i = 0; i < count; i++) this.launch(f, event, (i - (count - 1) / 2) * .14, key);
      if (f !== this.boss) this.sounds.voice(f.model.id, 'attack'); return;
    }
    if (event.kind === 'hit') {
      const p = f.model, range = event.range || 120, bounds = attackBounds(p.x, p.y, p.action?.facing || p.facing, range, event.height || 105);
      this.sounds.voice(p.id, 'attack');
      const targets = f.hostile ? this.fighters.filter(a => !a.hostile) : this.fighters.filter(a => a.hostile);
      for (const target of targets) if (overlaps(bounds, this.box(target))) this.hit(f, target, {...event, damage: (event.damage || 10) * charge}, key);
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
    const multiplier = attacker.hostile ? COMBAT.enemyDamage : attacker === this.player && this.phase === 'seal' ? 1.28 : attacker.ally ? .33 : 1;
    const outcome = target.model.receive({damage: Math.round((event.damage || 10) * multiplier), posture: event.posture || 15, red: !!event.red, fromX: attacker.model.x}, this.now);
    if (outcome.result === 'immune') return;
    if (outcome.result === 'parry') {
      attacker.model.deflected(outcome.attackerPosture * (target === this.player && this.readingUntil > this.now ? 1.5 : 1), this.now); this.sounds.effect('parry', 1.1); this.burst('parry', target.model.x + target.model.facing * 35, target.model.y - 80, 150, 270);
      this.stopForImpact(45); this.shake(.0018, 85); if (target === this.player) {this.parries++; if (this.readingUntil > this.now) target.model.stamina = Math.min(100, target.model.stamina + 5);}
      if (attacker === this.boss && attacker.model.stamina <= 0) this.guardBreakEffect(attacker);
      return;
    }
    if (outcome.result === 'block') {this.sounds.effect('guard', .8); this.burst('parry', target.model.x + target.model.facing * 30, target.model.y - 75, 47, 140);
      attacker.model.exhaust(outcome.attackerPosture, this.now); return;}
    if (outcome.result === 'guardbreak') this.guardBreakEffect(target);
    if (!attacker.hostile) {
      if (attacker.model.action?.definition.action !== 'ultimate') attacker.model.ultimate = Math.min(100, attacker.model.ultimate + (outcome.damage * .18));
      if (attacker === this.player && ['light1','light2','light3','heavy','aerial'].includes(attacker.model.action?.definition.action || '')) attacker.model.chakra = Math.min(100, attacker.model.chakra + COMBAT.meleeChakra);
      target.model.exhaust(event.posture || 12, this.now); if (target.model.stamina <= 0 && target.model.isBoss) this.guardBreakEffect(target);
    }
    if(event.effect==='water')this.sounds.effect('water2',.8);
    else this.sounds.strike(attacker.model.id==='zabuza'?'sword':event.posture&&event.posture>=30?'heavy':attacker.model.action?.definition.action==='light2'?'kick':'palm',.85);
    this.sounds.voice(target.model.id, target.model.health <= 0 ? 'defeat' : 'hurt');
    this.burst(event.effect === 'ice' ? 'ice-shards' : 'parry', target.model.x, target.model.y - 65, 90, 210);
    if (target.ally && !target.key.startsWith('clone')) target.model.health = Math.max(1, target.model.health);
    if (!target.model.isBoss) target.body.body.setVelocityX((target.model.x >= attacker.model.x ? 1 : -1) * (event.red ? 245 : 135));
    else if (target.model.guardBrokenUntil > this.now) target.body.body.setVelocityX((target.model.x >= attacker.model.x ? 1 : -1) * 40);
    this.stopForImpact(event.red ? 40 : 25); this.shake(event.red ? .003 : .0015, 90);
  }
  private guardBreakEffect(f: Fighter) {
    if (Math.abs(f.model.guardBrokenUntil - this.now - (f.model.isBoss ? COMBAT.bossBreak : COMBAT.guardBreak)) > 60) return;
    this.sounds.effect('break', 1); this.burst('parry', f.model.x, f.model.y - 65, 235, 410); this.stopForImpact(65); this.shake(.003, 160);
  }
  private launch(f: Fighter, event: AttackEvent, offset: number, key: string) {
    if (this.projectiles.length >= 48) return;
    const friendly = !f.hostile, mirror = !friendly && this.formation.active && this.now >= this.mirrorInterruptUntil ? this.formation.mirrors[this.formation.occupied] : null;
    const x = mirror?.x ?? f.model.x + f.model.facing * (event.effect==='water'?68:36), y = mirror ? mirror.y - 35 : f.model.y - 73;
    const waterNeedle = event.effect === 'water' && f.model.id === 'haku';
    const name = event.effect === 'water' && !waterNeedle ? (event.red ? 'water-dragon' : 'waterfall') : event.effect === 'fire' ? 'fireball' : 'senbon';
    let image: Phaser.GameObjects.Image, rx = 15, ry = 6;const waterRow=event.effect==='water'&&!waterNeedle?(event.red?1:0):undefined;
    if (friendly && event.effect !== 'water' && event.effect !== 'fire') image = namedArt(this, 'props', f.model.id === 'sasuke' ? 'windmill-shuriken' : 'shuriken', x, y, f.model.id === 'sasuke' ? 43 : 24);
    else if (name === 'senbon') {
      if (f.model.action?.definition.id === 'sword-throw') {image = this.add.image(x, y, 'v2-zabuza-sword').setDisplaySize(166, 28); rx = 65; ry = 13;}
      else {image = namedArt(this, 'props', 'senbon', x, y, waterNeedle ? 65 : 47); if(waterNeedle)image.setTint(0x98e8ff);}
    }
    else if(waterRow!==undefined){const width=event.red?310:170;image=this.add.image(x,y,'v3-water',String(waterRow*4)).setDisplaySize(width,width*.5);rx=event.red?48:25;ry=event.red?52:12;}
    else {image = namedArt(this, 'effects', name, x, y, 138); rx = 44; ry = 40;}
    let target = friendly ? {x: x + f.model.facing * 1200, y} : {x: this.targetX, y: this.targetY};
    if (!friendly && event.red && event.effect === 'water') target = {x: this.targetX, y: this.floor - 62};
    const velocity = fixedAim({x, y}, target, event.speed || (friendly ? 770 : 440), offset);
    image.setDepth(5).setRotation(velocity.angle - (velocity.vx < 0 && (event.effect === 'water' || event.effect === 'fire') ? Math.PI : 0));
    if (event.effect === 'water' || event.effect === 'fire') image.setFlipX(velocity.vx < 0);
    if(waterRow!==undefined)image.setOrigin(velocity.vx<0?.2:.8,.5);
    if (event.red && waterRow===undefined) image.setTint(0xff797b);
    this.projectiles.push({image, x, y, vx: velocity.vx, vy: velocity.vy, damage: event.damage || 8, posture: event.posture || 8,
      red: !!event.red, friendly, owner: f, expires: this.now + 3900, rx, ry, kind: f.model.action?.definition.id === 'sword-throw' ? 'sword' : event.effect==='swing'?'tool':event.effect || 'tool', hit: new Set([key]),waterRow,born:this.now,trail:[]});
  }
  private updateProjectiles(dt: number) {
    for (const p of this.projectiles) {
      if (p.expires <= this.now) continue;
      const nx = p.x + p.vx * dt / 1000, ny = p.y + p.vy * dt / 1000, sweep = projectileSweep(p.x, p.y, nx, ny, p.rx, p.ry);
      p.x = nx; p.y = ny; p.image.setPosition(nx, ny);
      if(p.waterRow!==undefined){
        p.image.setFrame(String(p.waterRow*4+Math.floor((this.now-p.born)/85)%4));
        p.image.setFlipX(p.vx<0).setOrigin(p.vx<0?.2:.8,.5).setRotation(Math.atan2(p.vy,p.vx)-(p.vx<0?Math.PI:0));
        p.trail.push({x:nx,y:ny});if(p.trail.length>8)p.trail.shift();
      }
      if (p.kind === 'tool') p.image.rotation += dt * .023;
      if (p.kind === 'sword') p.image.rotation += dt * .009;
      if (p.returnAt && this.now >= p.returnAt) {p.returnAt = undefined; p.vx *= -1; p.hit.clear();}
      if (p.friendly) {
        if (this.formation.active) {
          for (let i = 0; i < this.formation.mirrors.length; i++) {const m = this.formation.mirrors[i]; if (m.broken || m.foreground) continue;
            if (overlaps(sweep, {x: m.x - 42, y: m.y - 96, width: 84, height: 185}) && !p.hit.has(`mirror-${i}`)) {
              p.hit.add(`mirror-${i}`); this.strikeMirror(i, p.damage * (this.phase === 'seal' ? 1.4 : 1), p.owner);
              if (!p.returnAt) p.expires = 0; break;
            }}
        }
        for (const target of this.fighters.filter(f => f.hostile)) if (p.expires && overlaps(sweep, this.box(target)) && !p.hit.has(target.key) && (target !== this.boss || !this.formation.active || this.now < this.mirrorInterruptUntil)) {
          p.hit.add(target.key); this.projectileHit(p, target); if (!p.returnAt) p.expires = 0;
        }
      } else {
        for (const target of this.fighters.filter(f => !f.hostile)) {
          if (overlaps(sweep, this.box(target)) && !p.hit.has(target.key)) {
            p.hit.add(target.key); const reflected = this.projectileHit(p, target);
            if (reflected) break; p.expires = 0; break;
          }
        }
        if (!p.friendly) for (const decoy of this.decoys) if (overlaps(sweep, {x: decoy.x - 25, y: decoy.y - 64, width: 50, height: 60})) {decoy.expires = 0; p.expires = 0;}
        if (!p.friendly && p.expires && this.phase === 'protect' && overlaps(sweep, {x: 168, y: this.floor - 115, width: 44, height: 110})) {this.hurtTazuna(p.damage); p.expires = 0;}
      }
      if (nx < -80 || nx > this.arenaMax + 120 || ny > this.floor + 30 || ny < -120) p.expires = 0;
    }
    this.projectiles = this.projectiles.filter(p => {if (p.expires <= this.now) {p.image.destroy(); return false;} return true;});
    this.decoys = this.decoys.filter(d => {if (d.expires <= this.now) {this.burst('smoke', d.x, d.y - 30, 90); d.image.destroy(); return false;} return true;});
  }
  private projectileHit(p: Projectile, target: Fighter) {
    const from = p.x - Math.sign(p.vx) * 50;
    const outcome = target.model.receive({damage: p.friendly ? p.damage : Math.max(1, Math.round(p.damage * COMBAT.enemyDamage)), posture: p.posture, red: p.red, fromX: from, projectile: true}, this.now);
    if (outcome.result === 'immune') return false;
    if (outcome.result === 'parry') {
      const source = p.owner;
      p.friendly = true; p.owner = target; p.vx = -p.vx; p.vy = -p.vy; p.hit.clear(); p.expires = this.now + 2300;
      p.image.rotation += Math.PI;
      source.model.deflected(outcome.attackerPosture * (this.readingUntil > this.now ? 1.5 : 1), this.now); this.sounds.effect('parry', 1); this.burst('parry', target.model.x, target.model.y - 70, 150, 270);
      if (target === this.player) this.parries++; this.stopForImpact(40); if (this.boss.model.stamina <= 0) this.guardBreakEffect(this.boss); return true;
    }
    if (outcome.result === 'block') {this.sounds.effect('guard', .7); this.burst('parry', target.model.x, target.model.y - 70, 50, 120); return false;}
    if (outcome.result === 'guardbreak') this.guardBreakEffect(target);
    if (p.friendly) {target.model.exhaust(p.posture, this.now); p.owner.model.ultimate = Math.min(100, p.owner.model.ultimate + outcome.damage * .1); if(target.model.isBoss && target.model.stamina <= 0)this.guardBreakEffect(target);}
    this.sounds.effect(p.kind === 'water' ? 'water2' : 'impact', .65); this.sounds.voice(target.model.id, target.model.health <= 0 ? 'defeat' : 'hurt');
    this.burst(p.kind === 'water' ? 'waterfall' : 'ice-shards', target.model.x, target.model.y - 70, 75, 190); this.shake(.0015, 70);
    if (target.ally && !target.key.startsWith('clone')) target.model.health = Math.max(1, target.model.health);
    return false;
  }
  private playerTechnique(f: Fighter, event: AttackEvent, key: string) {
    const p = f.model, id = p.action?.definition.id || '';
    this.sounds.effect(event.effect || 'smoke', .85); this.sounds.voice(p.id, 'cast');
    if (id === 'substitute' || id === 'feint') {
      const oldX = p.x, x = safeSubstitution(p.x, p.facing, this.arenaMin, this.arenaMax, this.boss.model.x);
      this.burst('smoke', oldX, p.y - 48, 155, 400); const image = namedArt(this, 'props', 'log', oldX, p.y, 84).setOrigin(.5, 1).setDepth(3);
      this.decoys.push({image, x: oldX, y: p.y, expires: this.now + 2600}); this.teleport(f, x, Math.min(p.y, this.floor));
      if (id === 'feint') {p.immuneUntil = this.now + 180; this.launch(f, {kind: 'projectile', at: 0, damage: 35, speed: 690}, 0, key);} return;
    }
    if (id === 'clones') {
      for (const clone of [...this.fighters].filter(a => a.key.startsWith('clone'))) this.removeFighter(clone);
      for (const offset of [-56, 56]) {const clone = this.fighter(`clone-${++this.clonesCreated}`, 'naruto', clamp(p.x + offset, this.arenaMin + 30, this.arenaMax - 30), p.y, false, 1, true);
        clone.expires = this.now + 6000; this.burst('smoke', clone.model.x, clone.model.y - 40, 120, 330);} return;
    }
    if (id === 'reading') {this.readingUntil = this.now + 6000; this.burst('parry', p.x, p.y - 118, 44, 450); return;}
    if (id === 'protect') {this.protectionUntil = this.now + 6000; p.stamina = Math.min(100, p.stamina + 40); p.immuneUntil = this.now + 240;
      this.burst('parry', p.x, p.y - 70, 120, 450); return;}
    if (id === 'hounds') {
      this.bossRestrainedUntil = this.now + 1700; this.boss.model.action = null; this.brain.stagger(this.now, 2300);
      for (const offset of [-50, 40, 90]) {const dog = namedArt(this, 'props', 'hound', this.boss.model.x + offset, this.floor, 72).setOrigin(.5, 1).setDepth(4);
        this.tweens.add({targets: dog, alpha: 0, delay: 1450, duration: 300, onComplete: () => dog.destroy()});}
      this.boss.model.exhaust(28, this.now); this.hit(f, this.boss, event, key); return;
    }
    if (id === 'dragon' || id === 'waterfall') {this.launch(f, {at: 0, kind: 'projectile', effect: 'water', red: id === 'waterfall', damage: event.damage, posture: event.posture, speed: 550}, 0, key); return;}
    if (id === 'fireball') {this.launch(f, {at: 0, kind: 'projectile', effect: 'fire', damage: event.damage, posture: 28, speed: 540}, 0, key); return;}
    if (id === 'windmill') {
      this.launch(f, {at: 0, kind: 'projectile', damage: event.damage, posture: 24, speed: 620}, 0, key);
      const projectile = this.projectiles.at(-1); if (projectile) {projectile.returnAt = this.now + 730; projectile.expires = this.now + 2100; projectile.image.setDisplaySize(84, 84); projectile.rx = 36; projectile.ry = 36;} return;
    }
    if (id === 'intercept') {
      for (const projectile of this.projectiles) if (!projectile.friendly && Math.abs(projectile.x - p.x) < 380 && !projectile.red) {projectile.expires = 0; this.burst('parry', projectile.x, projectile.y, 45, 150); p.ultimate = Math.min(100, p.ultimate + 3);}
      for (const angle of [-.12, 0, .12]) this.launch(f, {at: 0, kind: 'projectile', damage: 18, posture: 12, speed: 690}, angle, key); return;
    }
    if (['red-rush', 'fury', 'lightning', 'barrage', 'focus', 'resolve'].includes(id)) {
      p.immuneUntil = this.now + 300;
      const distance = Math.min(id === 'red-rush' ? 240 : 330, Math.abs(this.boss.model.x - p.x));
      const x = clamp(p.x + p.facing * Math.max(0, distance - 70), this.arenaMin + 32, this.arenaMax - 32);
      this.burst(id === 'lightning' ? 'lightning' : this.phase === 'seal' ? 'chakra-aura' : 'smoke', p.x, p.y - 65, 180, 500);
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
    this.waterBurst(x,this.floor-125,510,650,2); this.sounds.effect('water', .9);
    const bounds = {x: x - 95, y: this.floor - 270, width: 190, height: 270};
    for (const target of this.fighters.filter(a => !a.hostile)) if (overlaps(bounds, this.box(target))) this.hit(f, target, event, key);
    if (this.phase === 'protect' && x < 280) this.hurtTazuna(event.damage || 10);
  }
  private makeMirrors() {
    this.destroyMirrorVisuals(); this.formation.create(830, this.floor); this.mirrorEnd = this.now + (this.phase === 'seal' ? 24500 : 23000);
    this.boss.model.action = null; this.brain.readyAt = this.now + 1800; this.mirrorInterruptUntil = 0;
    this.formation.mirrors.forEach(m => {
      const image = namedArt(this, 'props', 'ice-mirror', m.x, m.y, m.foreground ? 78 : 67).setDepth(m.foreground ? 7 : 1).setAlpha(m.foreground ? .38 : .82);
      const reflection = this.add.sprite(m.x, m.y + 62, 'haku-locomotion', '6').setDepth(m.foreground ? 7 : 2).setAlpha(.22); poseBattle(reflection, 'haku', 'idle', 0, m.x > 830 ? -1 : 1); reflection.setScale(reflection.scaleX * .69);
      const halo = this.add.ellipse(m.x, m.y - 5, 82, 214, 0xacefff, 0).setStrokeStyle(2, 0xa4f0ff, 0).setDepth(3);
      this.mirrorVisuals.push({image, reflection, halo});
    });
    this.transferMirror(false); this.burst('ice-shards', 830, 360, 300, 600); this.sounds.effect('ice', .9);
  }
  private transferMirror(feint: boolean) {
    const mirror = this.formation.transfer(this.now); if (!mirror) return;
    this.teleport(this.boss, mirror.x, this.floor); this.boss.model.facing = this.player.model.x > mirror.x ? 1 : -1;
    if (this.boss.model.action) this.boss.model.action.facing = this.boss.model.facing;
    this.targetX = this.player.model.x; this.targetY = this.player.model.y - 65;
    this.boss.model.exhaust(6, this.now); this.burst('ice-shards', mirror.x, mirror.y, 95, 220);
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
    if (result.interrupt) {
      this.boss.model.health = Math.max(0, this.boss.model.health - Math.max(18, damage * .85));
      this.boss.model.exhaust(26, this.now); f.model.ultimate = Math.min(100, f.model.ultimate + 9);
      this.mirrorInterruptUntil = this.now + 2450; this.boss.model.action = null;
      this.brain.stagger(this.now, 2450); this.teleport(this.boss, clamp(mirror.x, 170, 1490), this.floor);
      this.boss.model.hurtUntil = this.now + 230; this.stopForImpact(35);
    }
    if (result.broken) {this.boss.model.exhaust(18, this.now); f.model.ultimate = Math.min(100, f.model.ultimate + 7); this.shake(.002, 100);}
    if (this.formation.count() <= 2) this.endMirrors();
  }
  private updateMirrors() {
    if (this.boss.model.id !== 'haku') return;
    if (!this.formation.active && this.now >= this.formation.nextFormationAt && (this.boss.model.health / this.boss.model.maxHealth < .78 || this.phaseElapsed > 26)) this.makeMirrors();
    if (!this.formation.active) return;
    if (this.now >= this.mirrorEnd || this.boss.model.guardBrokenUntil > this.now) {this.endMirrors(); return;}
    if (this.boss.model.action?.definition.id === 'mirror-feint' && this.now >= this.nextMirrorTransfer && this.now - this.boss.model.action.started < 900) this.transferMirror(false);
    this.mirrorVisuals.forEach((visual, i) => {
      const mirror = this.formation.mirrors[i]; visual.image.setVisible(!mirror.broken); visual.reflection.setVisible(!mirror.broken);
      const occupied = i === this.formation.occupied && this.now >= this.mirrorInterruptUntil;
      visual.reflection.setAlpha(occupied ? .88 : .13);
      const pulse = occupied ? .3 + Math.sin(this.now / 110) * .16 : 0;
      visual.halo.setFillStyle(0xabefff, pulse * .22).setStrokeStyle(occupied ? 3 : 1, 0xb9f5ff, occupied ? .65 : 0).setVisible(!mirror.broken);
    });
  }
  private endMirrors() {
    this.formation.clear(this.now); this.destroyMirrorVisuals(); this.boss.model.action = null;
    this.teleport(this.boss, clamp(this.boss.model.x, 200, 1460), this.floor); this.brain.readyAt = this.now + 1750;
    this.boss.model.hurtUntil = this.now + 350; this.burst('ice-shards', this.boss.model.x, this.floor - 85, 160, 450);
  }
  private destroyMirrorVisuals() {for (const v of this.mirrorVisuals) {v.image.destroy(); v.reflection.destroy(); v.halo.destroy();} this.mirrorVisuals = [];}
  private burst(name: string, x: number, y: number, width: number, duration = 350, direction = 1) {
    if (this.effects.length >= 38) {this.effects[0].image.destroy(); this.effects.shift();}
    const image = namedArt(this, 'effects', name, x, y, width).setDepth(9).setFlipX(direction < 0);
    this.effects.push({image, born: this.now, duration, width, grow: name === 'smoke' ? .65 : .2, spin: name === 'ice-shards' ? .15 : 0}); return image;
  }
  private waterBurst(x:number,y:number,width:number,duration:number,row:number){
    if(this.effects.length>=38){this.effects[0].image.destroy();this.effects.shift();}
    const image=this.add.image(x,y,'v3-water',String(row*4)).setDisplaySize(width,width*.5).setDepth(9);
    this.effects.push({image,born:this.now,duration,width,grow:.16,spin:0,waterRow:row});
  }
  private updateEffects(dt: number) {
    this.effects = this.effects.filter(effect => {
      const progress = (this.now - effect.born) / effect.duration;
      if (progress >= 1) {effect.image.destroy(); return false;}
      if(effect.waterRow!==undefined)effect.image.setFrame(String(effect.waterRow*4+Math.min(3,Math.floor(progress*4))));
      const ratio = effect.image.height / effect.image.width;
      effect.image.setAlpha(1 - progress).setDisplaySize(effect.width * (1 + progress * effect.grow), effect.width * ratio * (1 + progress * effect.grow));
      effect.image.rotation += effect.spin * dt / 1000; return true;
    });
  }
  private updateCues(dt: number) {
    const graphics = this.cueGraphics; graphics.clear();
    for(const projectile of this.projectiles){
      if(projectile.waterRow===undefined)continue;
      const direction=Math.sign(projectile.vx);
      projectile.trail.forEach((point,i)=>{graphics.fillStyle(0xb4f2ff,i/projectile.trail.length*.25);graphics.fillEllipse(point.x-direction*48,point.y+Math.sin(i*2+this.now/85)*12,8,3);});
      if(projectile.red){graphics.lineStyle(3,0xff6670,.88);graphics.strokeCircle(projectile.x,projectile.y,projectile.ry+7);}
    }
    for (let i = 0; i < this.mist.length; i++) {
      const mist = this.mist[i]; mist.x += dt * (.006 + i * .004); if (mist.x > 1690) mist.x = -400;
      mist.setAlpha(Phaser.Math.Linear(mist.alpha, this.now < this.mistUntil ? .17 : .045, .035));
    }
    if (this.phase === 'seal') {
      graphics.lineStyle(2, 0xfb6850, .22 + Math.sin(this.now / 90) * .05);
      graphics.strokeEllipse(this.player.model.x, this.player.model.y - 62, 100 + Math.sin(this.now / 100) * 9, 155);
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
          const radius = 12 + clamp(timeLeft / 75, 0, 12); graphics.strokeCircle(x, y, radius);
          if (next.red) {graphics.beginPath(); graphics.moveTo(x, y - 9); graphics.lineTo(x, y + 2); graphics.strokePath(); graphics.fillStyle(color, 1); graphics.fillCircle(x, y + 8, 2.5);}
          if (next.red && action.definition.id === 'great-waterfall') {graphics.fillStyle(0xff4e59, .12 + (1 - timeLeft / 1000) * .1); graphics.fillRect(this.targetX - 95, this.floor - 270, 190, 270); graphics.lineStyle(2, color, .55); graphics.lineBetween(this.targetX - 95, this.floor - 2, this.targetX + 95, this.floor - 2);}
          else if (next.red) {graphics.lineStyle(5, color, .45); graphics.lineBetween(this.boss.model.x, this.boss.model.y - 80, this.boss.model.x + this.boss.model.facing * 110, this.boss.model.y - 55);}
          if (mirror && visible) {graphics.lineStyle(1, color, .16); graphics.lineBetween(mirror.x, mirror.y, this.targetX, this.targetY);}
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
      this.gameOver = true; this.physics.world.pause(); this.inputs.clear(); this.sounds.sync(false); bridge.patch({screen: 'dead', health: this.player.model.health, protection: this.phase === 'protect' ? this.protection : null}); return;
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
    const completed = this.phase === 'protect' ? this.phaseElapsed >= (PHASES.protect.protectionSeconds || 65) : this.boss.model.health <= 0;
    if (completed && !this.phaseEnding) {
      this.phaseEnding = true; this.inputs.clear(); this.sounds.stopEffects();
      if (this.phase === 'mirrors') {this.director.state.narutoInMirrors = true; this.director.state.sharinganAwakened = true;}
      this.director.finishObjective();
    }
  }
  private emit() {
    if (!this.player || !this.boss || this.director.mode !== 'fight') return;
    const p = this.player.model, b = this.boss.model, abilities = kit(this.phase), data = PHASES[this.phase];
    bridge.patch({character: data.character, health: p.health, stamina: p.stamina, chakra: p.chakra, ultimate: p.ultimate,
      guardBroken: this.now < p.guardBrokenUntil, guarding: p.guard, stunned:this.now<p.hurtUntil, recovery:Math.max(0,Math.max(p.hurtUntil,p.guardBrokenUntil)-this.now)/1000, subCooldown: p.cooldown('substitute', this.now),
      cloneCount: this.fighters.filter(f => f.key.startsWith('clone')).length, elapsed: this.elapsed, phaseElapsed: this.phaseElapsed,
      abilities: abilities.map((ability, i) => ({id:ability.attack.id, label: ability.label, description:ability.description, icon: ability.icon, cooldown: p.cooldown(ability.attack.id, this.now), cost: ability.attack.chakra || 0,
        ready: (i !== 2 || this.phase !== 'mirrors' || this.sharingan) && p.cooldown(ability.attack.id, this.now) === 0 && p.chakra >= (ability.attack.chakra || 0) && p.stamina >= ability.attack.stamina && p.ultimate >= (ability.attack.ultimate || 0)})),
      phaseProgress: this.phase === 'protect' ? this.phaseElapsed / (PHASES.protect.protectionSeconds || 50) : 1 - b.health / b.maxHealth,
      objective: data.objective, protection: this.phase === 'protect' ? this.protection : null, retries: this.retries, parries: this.parries,
      device: this.inputs.device, fps: Math.round(this.game.loop.actualFps),
      boss: {name: this.phase === 'rescue' ? 'Zabuza · Water Clone' : CHARACTER[b.id].name, health: b.health, max: b.maxHealth, stamina: b.stamina,
        guardBroken: this.now < b.guardBrokenUntil, stunned:this.now<b.hurtUntil, postureFlash:this.now-b.postureHitAt<250, recovery:Math.max(0,Math.max(b.hurtUntil,b.guardBrokenUntil)-this.now)/1000,
        phase: this.formation.active ? 'Crystal Ice Mirrors' : this.now < this.mistUntil ? 'Silent Killing' : ''}});
  }
  private startCinema(clip: CinemaClip) {
    this.clearStage(); this.arena(clip.arena); this.physics.world.pause(); this.sounds.stopEffects(); this.sounds.sync(true); this.cinemaClock = 0;
    for (const a of clip.actors) {
      const character: CharacterId | undefined = ['kakashi', 'naruto', 'sasuke', 'sakura', 'zabuza', 'haku'].includes(a.id) ? a.id as CharacterId : a.id === 'prisoner' ? 'kakashi' : a.id === 'clone' ? 'naruto' : undefined;
      let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
      if (character) {sprite = this.add.sprite(a.x, a.y, `${character}-locomotion`, '6').setDepth(a.animation === 'defeat' ? 1 : 4); poseBattle(sprite as Phaser.GameObjects.Sprite, character, a.animation, a.animation === 'defeat' ? 1400 : 0, a.facing);}
      else {const prop = a.id.startsWith('hound') ? a.id === 'hound1' ? 'hound' : `hound-${a.id.slice(-1)}` : a.id.startsWith('henchman') ? a.id === 'henchman1' ? 'henchman' : `henchman-${a.id.slice(-1)}` : a.id; sprite = namedArt(this, 'props', prop, a.x, a.y, 100).setOrigin(.5, 1).setDepth(3).setFlipX(a.facing < 0); sprite.setScale((a.id.startsWith('hound') ? 45 : a.id === 'gato' ? 124 : 158) / sprite.height);}
      sprite.setAlpha(a.alpha ?? 1);
      this.cinemaActors.set(a.id, {sprite, id: a.id, character, animation: a.animation, animationAt: 0, facing: a.facing});
    }
    if (clip.id === 'a-demon-in-the-snow') {for (const id of ['hound1', 'hound2', 'hound3'] as ActorId[]) this.cinemaActors.get(id)?.sprite.setAlpha(0);}
    this.inputs.clear(); bridge.patch({screen: 'intro', boss: null, cinematic: clip.id, elapsed: this.elapsed});
  }
  private cinemaCue(cue: CinemaCue) {
    const actor = cue.actor ? this.cinemaActors.get(cue.actor) : undefined;
    if (actor) {
      if (cue.animation) {actor.animation = cue.animation; actor.animationAt = this.cinemaClock;}
      if (cue.facing) actor.facing = cue.facing;
      if (cue.alpha !== undefined) actor.sprite.setAlpha(cue.alpha);
      if (cue.actor?.startsWith('hound') && cue.x !== undefined) actor.sprite.setAlpha(1);
      if (cue.x !== undefined || cue.y !== undefined) {
        if (cue.duration) this.tweens.add({targets: actor.sprite, x: cue.x ?? actor.sprite.x, y: cue.y ?? actor.sprite.y, duration: cue.duration, ease: cue.animation === 'run' ? 'Linear' : 'Cubic.easeInOut',
          onComplete: () => {if (actor.animation === 'run' || actor.animation === 'dash' || actor.animation === 'airdash') {actor.animation = 'idle'; actor.animationAt = this.cinemaClock;}}});
        else actor.sprite.setPosition(cue.x ?? actor.sprite.x, cue.y ?? actor.sprite.y);
      }
      if (actor.character && ['hurt', 'cast', 'ultimate', 'heavy'].includes(cue.animation || '')) this.sounds.voice(actor.character, cue.animation === 'hurt' ? 'hurt' : 'cast');
    }
    if (cue.camera !== undefined) this.tweens.add({targets: this.cameras.main, scrollX: cue.camera, duration: cue.duration || 1, ease: 'Sine.easeInOut'});
    if (cue.zoom) this.cameras.main.zoomTo(cue.zoom, cue.duration || 600);
    if (cue.fade === 'out') this.cameras.main.fadeOut(650, 4, 15, 22); if (cue.fade === 'in') this.cameras.main.fadeIn(750, 4, 15, 22);
    if (!cue.effect) return;
    const x = actor?.sprite.x ?? 830, y = (actor?.sprite.y ?? this.floor) - 70;
    if (cue.effect === 'prison') {this.cinemaPrison?.destroy(); actor?.sprite.setAlpha(0); this.cinemaPrison = namedArt(this, 'props', 'water-prison', x, y - 8, 190).setDepth(5); this.sounds.effect('water', .8);}
    else if (cue.effect === 'mirrors') {
      const formation = new MirrorFormation(); formation.create(830, this.floor);
      for (const m of formation.mirrors) namedArt(this, 'props', 'ice-mirror', m.x, m.y, m.foreground ? 104 : 94).setDepth(m.foreground ? 7 : 1).setAlpha(m.foreground ? .28 : .66);
      this.sounds.effect('ice', .7);
    } else if (cue.effect === 'snow') {this.snowActive = true; this.snow = Array.from({length: 85}, () => ({x: Math.random() * 1660, y: Math.random() * 720, speed: 15 + Math.random() * 22})); this.sounds.setTrack('snow');}
    else if (cue.effect === 'shuriken') {
      const tool = (cue.actor === 'zabuza' ? this.add.image(x, y, 'v2-zabuza-sword').setDisplaySize(240, 40) : namedArt(this, 'props', cue.actor === 'sasuke' ? 'windmill-shuriken' : 'shuriken', x, y, cue.actor === 'sasuke' ? 90 : 32)).setDepth(5);
      this.tweens.add({targets: tool, x: x + (actor?.facing || 1) * 630, rotation: Math.PI * 8, duration: 1050, onComplete: () => tool.destroy()}); this.sounds.effect('swing', .65);
    } else if (cue.effect === 'mask') {const mask = namedArt(this, 'props', 'haku-mask', x, y - 40, 40).setDepth(5); this.tweens.add({targets: mask, y: this.floor, rotation: 2, x: x - 90, duration: 750}); this.burst('ice-shards', x, y, 120, 450);}
    else {
      const effect = cue.effect === 'aura' ? 'chakra-aura' : cue.effect === 'water' ? 'water-dragon' : cue.effect === 'ice' ? 'ice-shards' : cue.effect === 'impact' ? 'parry' : cue.effect;
      this.burst(effect, x, y, cue.effect === 'water' ? 280 : cue.effect === 'aura' ? 185 : 130, cue.effect === 'aura' ? 2300 : 650, actor?.facing || 1);
      this.sounds.effect(cue.effect === 'aura' ? 'fire' : cue.effect as EffectName, .75);
      if (cue.effect === 'water' && cue.actor === 'prisoner') {this.cinemaPrison?.destroy(); this.cinemaPrison = null; actor?.sprite.setAlpha(1);}
    }
  }
  private updateCinema(dt: number) {
    this.now += dt; this.cinemaClock += dt;
    this.director.update(dt); if (this.director.mode !== 'cinematic') return;
    for (const actor of this.cinemaActors.values()) {
      if (actor.character) {const clip = this.director.clip?.id;
        const variant = actor.character === 'zabuza' && clip === 'a-demon-in-the-snow' && this.cinemaClock >= 18700 ? 'final-stand' : actor.character === 'haku' && (clip === 'a-demon-in-the-snow' || clip === 'narutos-hesitation' && this.cinemaClock >= 2200) ? 'unmasked' : actor.character === 'naruto' && (clip === 'narutos-hesitation' || clip === 'sasuke-protects-naruto' && this.cinemaClock >= 12800) ? 'awakened' : undefined;
        poseBattle(actor.sprite as Phaser.GameObjects.Sprite, actor.character, actor.animation, this.cinemaClock - actor.animationAt, actor.facing, undefined, variant);
        if (actor.animation === 'defeat') actor.sprite.setDepth(1);}
      else if (actor.animation === 'defeat') actor.sprite.setRotation(actor.facing > 0 ? Math.PI / 2 : -Math.PI / 2).setOrigin(.5, .65);
    }
    if (this.director.clip?.id === 'hunter-nin-deception' && this.cinemaClock > 15100 && this.cinemaClock < 16600) {
      // Zabuza is carried in the hunter-nin's arms during the retreat.
      const haku = this.cinemaActors.get('haku'), zabuza = this.cinemaActors.get('zabuza');
      if (haku && zabuza) zabuza.sprite.setPosition(haku.sprite.x - 18, haku.sprite.y - 57).setAlpha(1).setDepth(4);
    }
    this.updateEffects(dt); this.cueGraphics.clear();
    if (this.snowActive) for (const flake of this.snow) {
      flake.y += flake.speed * dt / 1000; flake.x += Math.sin(flake.y / 80) * dt * .004; if (flake.y > 730) flake.y = -10;
      this.cueGraphics.fillStyle(0xf0faff, .7); this.cueGraphics.fillCircle(flake.x, flake.y, 1.1 + flake.speed / 24);
    }
  }
  private finishChapter() {
    this.physics.world.pause(); this.inputs.clear(); this.sounds.setTrack('snow'); this.cameras.main.fadeIn(500, 4, 15, 22);
    bridge.patch({screen: 'victory', elapsed: this.elapsed, boss: null, phaseProgress: 1, parries: this.parries, retries: this.retries});
  }
  command(command: Command) {
    if (command === 'pause' && ['playing', 'intro'].includes(bridge.get().screen)) {
      this.emit();
      this.pausedFrom = bridge.get().screen as 'playing' | 'intro'; this.physics.world.pause(); this.tweens.pauseAll(); this.inputs.clear(); this.sounds.sync(false); bridge.patch({screen: 'paused'});
    } else if (command === 'resume' && bridge.get().screen === 'paused') {
      this.inputs.clear(); this.tweens.resumeAll(); if (this.pausedFrom === 'playing') this.physics.world.resume(); this.sounds.sync(true); void this.sounds.unlock(); bridge.patch({screen: this.pausedFrom});
    } else if (command === 'skip' && this.director.mode === 'cinematic' && bridge.get().screen === 'intro') {this.inputs.clear(); this.director.skip();}
  }
  status() {
    if (!this.director) return {mode: 'inactive'};
    return {phase: this.phase, story: this.director.state, mode: this.director.mode, time: Math.round(this.now), phaseElapsed: this.phaseElapsed,
      player: this.player ? {x: Math.round(this.player.model.x), y: Math.round(this.player.model.y), health: this.player.model.health, stamina: Math.round(this.player.model.stamina),
        chakra: Math.round(this.player.model.chakra), ultimate: Math.round(this.player.model.ultimate), action: this.player.model.action?.definition.id, guarding: this.player.model.guard, facing: this.player.model.facing} : null,
      boss: this.boss ? {x: Math.round(this.boss.model.x), y: Math.round(this.boss.model.y), health: this.boss.model.health, stamina: Math.round(this.boss.model.stamina),
        move: this.boss.model.action?.definition.id, started: this.boss.model.action?.started, readyAt: Math.round(this.brain?.readyAt), recovery: !this.boss.model.action,
        hitAt: this.boss.model.action?.definition.events.map(e => ({at: e.at, red: !!e.red, kind: e.kind})), guardBrokenUntil: this.boss.model.guardBrokenUntil} : null,
      mirrors: {active: this.formation.active, occupied: this.formation.occupied, exposedUntil: this.formation.exposedUntil, count: this.formation.count(), mirrors: this.formation.mirrors},
      counts: {fighters: this.fighters.length, projectiles: this.projectiles.length, effects: this.effects.length, decoys: this.decoys.length, displayObjects: this.children.length}, audio: this.sounds.status()};
  }
}
