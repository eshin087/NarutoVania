import * as Phaser from 'phaser';
import { BattleInput } from '../battle-input';
import { RecordedAudio } from '../recorded-audio';
import chapterAudio from '../../public/audio-chunin/manifest.json';
import { COMBAT, UNIVERSAL, clamp, type AnimationName } from '../combat-core';
import { OwnedEffects } from '../presentation-lifecycle';
import { bridge, type Command } from './bridge';
import {
  Duel,
  FLOOR,
  LEFT,
  RIGHT,
  PHASE_INFO,
  LEE_SKILLS,
  hurricaneVelocity,
  type Phase,
} from './combat';
import { pose, framePose, contactFrame, preloadArt, registerArt } from './art';
import { lotusStaging } from './lotus-choreography';
import { JumpState } from '../jump-state';
import { sceneSpacing } from './scene-spacing';
interface FX {
  image: Phaser.GameObjects.Sprite;
  born: number;
  duration: number;
  kind: string;
  size: number;
  rotation: number;
}
type Story = 'opening' | 'weights' | 'gates' | 'ending';
export class ChuninScene extends Phaser.Scene {
  inputs!: BattleInput;
  sounds!: RecordedAudio;
  duel = new Duel();
  lee!: Phaser.GameObjects.Sprite;
  gaara!: Phaser.GameObjects.Sprite;
  body!: Phaser.GameObjects.Zone;
  bodyPhysics!: Phaser.Physics.Arcade.Body;
  graphics!: Phaser.GameObjects.Graphics;
  fx!: OwnedEffects<FX>;
  clock = 0;
  story: Story | null = null;
  storyAt = 0;
  storyFrom = { lx: 350, gx: 940 };
  storyEntry: {
    lx: number;
    ly: number;
    gx: number;
    gy: number;
    to: ReturnType<typeof sceneSpacing>;
  } | null = null;
  ultimateAt = -1;
  ultFrom = { lx: 0, ly: 0, gx: 0, gy: 0 };
  ultContact = false;
  storyContact = false;
  storySettled = false;
  ultVisualBeat = -1;
  lastCue = -1;
  shotSprites = new Map<number, Phaser.GameObjects.Sprite>();
  resumeScreen: 'playing' | 'intro' = 'playing';
  debugScene: Story | undefined;
  phase: Phase = 'shield';
  jumps = new JumpState();
  warning!: Phaser.GameObjects.Text;
  feedback!: Phaser.GameObjects.Text;
  feedbackAt = -10000;
  lastHud = 0;
  guy!: Phaser.GameObjects.Sprite;
  shield!: Phaser.GameObjects.Sprite;
  wrap!: Phaser.GameObjects.Sprite;
  aura!: Phaser.GameObjects.Sprite;
  lotusPair!: Phaser.GameObjects.Sprite;
  zoneFX = new Set<string>();
  failed = false;
  constructor() {
    super('Chunin');
  }
  init(data: { inputs: BattleInput; sounds: RecordedAudio }) {
    this.inputs = data.inputs;
    this.sounds = data.sounds;
  }
  preload() {
    preloadArt(this);
    this.load.on('progress', (progress: number) => bridge.patch({ progress }));
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.failed = true;
      bridge.patch({
        screen: 'error',
        error: `Missing Chapter 2 artwork: ${file.key}`,
      });
    });
  }
  create() {
    if (this.failed) return;
    registerArt(this);
    this.add
      .image(640, 360, 'ch-arena')
      .setDisplaySize(1280, 720)
      .setDepth(-20);
    this.add.rectangle(640, 635, 1280, 170, 0x322d20, 0.1).setDepth(-15);
    this.graphics = this.add.graphics().setDepth(12);
    this.fx = new OwnedEffects(75, (e) => e.image.destroy());
    const ground = this.add.rectangle(640, FLOOR + 18, 1280, 36, 0, 0);
    this.physics.add.existing(ground, true);
    this.body = this.add.zone(350, FLOOR, 46, 108).setOrigin(0.5, 1);
    this.physics.add.existing(this.body);
    this.bodyPhysics = this.body.body as Phaser.Physics.Arcade.Body;
    this.bodyPhysics.setSize(46, 108).setCollideWorldBounds(false);
    this.physics.add.collider(this.body, ground);
    this.lee = this.add.sprite(350, FLOOR, 'ch-lee', 0).setDepth(11);
    this.gaara = this.add.sprite(940, FLOOR, 'ch-gaara', 0).setDepth(10);
    this.guy = this.add
      .sprite(-200, FLOOR, 'ch-lee', 0)
      .setDepth(11)
      .setVisible(false);
    this.wrap = this.add
      .sprite(0, 0, 'ch-energy', 2)
      .setDepth(15)
      .setVisible(false)
      .setDisplaySize(125, 155);
    this.shield = this.add
      .sprite(940, FLOOR - 63, 'ch-sand', 13)
      .setDepth(9)
      .setDisplaySize(180, 168)
      .setAlpha(0.75)
      .setVisible(false);
    this.aura = this.add
      .sprite(350, FLOOR, 'ch-gates-aura', 0)
      .setDepth(8)
      .setVisible(false);
    this.lotusPair = this.add
      .sprite(640, FLOOR, 'ch-lee-cinematic', 12)
      .setDepth(12)
      .setVisible(false);
    this.warning = this.add
      .text(0, 0, '!', {
        fontFamily: 'Georgia',
        fontSize: '40px',
        color: '#ff5d4a',
        stroke: '#3e190d',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1)
      .setDepth(30)
      .setVisible(false);
    this.feedback = this.add
      .text(0, 0, '', {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#fff0b2',
        stroke: '#182219',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(30);
    this.events.once('shutdown', () => {
      this.clearEffects();
      this.sounds.stopEffects();
      this.inputs.clear();
    });
    this.showTitle();
  }
  showTitle() {
    this.story = null;
    this.ultimateAt = -1;
    this.clearEffects();
    this.physics.world.pause();
    this.lee.setVisible(true).setPosition(850, FLOOR);
    this.gaara.setVisible(true).setPosition(1040, FLOOR);
    this.guy.setVisible(false);
    pose(this.lee, 'lee', 'idle', 0, 1);
    pose(this.gaara, 'gaara', 'idle', 0, -1);
    this.cameras.main.setZoom(1).setScroll(0, 0);
    bridge.patch({
      screen: 'title',
      dialogue: '',
      ultimateName: '',
      debugEntry: null,
    });
    this.sounds.sync(false);
  }
  command(c: Command) {
    if (typeof c === 'object') {
      if(c.type==='audition'){void this.sounds.audition(c.cue);return;}
      this.debugScene = c.scene as Story | undefined;
      bridge.patch({ debugEntry: c.scene || c.phase });
      this.begin(c.phase, this.debugScene);
      return;
    }
    if (c === 'start') {
      bridge.patch({ debugEntry: null, seen: [] });
      this.begin('shield', 'opening');
    } else if (c === 'continue') {
      bridge.patch({ debugEntry: null });
      this.begin(
        bridge.get().phase,
        undefined,
        bridge.get().checkpointBossHealth,
      );
    } else if (c === 'retry')
      this.begin(this.phase, undefined, this.checkpointHP);
    else if (c === 'debug-replay') this.begin(this.phase, this.debugScene);
    else if (c === 'title') {
      bridge.load();
      this.showTitle();
    } else if (
      c === 'pause' &&
      ['playing', 'intro'].includes(bridge.get().screen)
    ) {
      this.resumeScreen = bridge.get().screen as 'playing' | 'intro';
      bridge.patch({ screen: 'paused' });
      this.physics.world.pause();
      this.inputs.clear();
      this.sounds.sync(false);
    } else if (c === 'resume' && bridge.get().screen === 'paused') {
      bridge.patch({ screen: this.resumeScreen });
      if (this.resumeScreen === 'playing' && this.ultimateAt < 0)
        this.physics.world.resume();
      this.inputs.clear();
      this.sounds.sync(true);
    } else if (c === 'skip' && this.story) {
      this.finishStory(true);
    }
  }
  checkpointHP = PHASE_INFO.shield.health;
  begin(phase: Phase, story?: Story, savedHP?: number) {
    this.jumps.reset();
    this.phase = phase;
    this.duel.reset(phase);
    if (savedHP !== undefined && Number.isFinite(savedHP) && savedHP > 0)
      this.duel.gaara.health = Math.min(savedHP, PHASE_INFO[phase].health);
    this.checkpointHP = this.duel.gaara.health;
    this.duel.elapsed = 0;
    this.duel.parries = 0;
    this.inputs.clear();
    this.inputs.quarantineConfirm();
    this.clearEffects();
    this.ultimateAt = -1;
    this.sounds.reset();
    void this.sounds.unlock();
    this.sounds.sync(true);
    this.sounds.setTrack(phase === 'gates' ? 'mirrors' : 'lakeside');
    this.bodyPhysics.reset(this.duel.lee.x, FLOOR);
    this.bodyPhysics.setVelocity(0, 0);
    this.lee.setVisible(true).setAlpha(1);
    this.gaara.setVisible(true).setAlpha(1);
    this.guy.setVisible(false);
    this.cameras.main.setZoom(1).setScroll(0, 0);
    this.lastCue = -1;
    this.warning.setVisible(false);
    bridge.patch({
      phase,
      screen: 'playing',
      dialogue: '',
      ultimateName: '',
      elapsed: 0,
      parries: 0,
    });
    bridge.checkpoint(phase, false, this.checkpointHP);
    if (story) this.startStory(story);
    else {
      this.story = null;
      this.physics.world.resume();
    }
    this.publish();
  }
  clearEffects() {
    this.fx?.clear();
    for (const s of this.shotSprites.values()) s.destroy();
    this.shotSprites.clear();
    this.graphics?.clear();
    this.feedback?.setText('');
    this.warning?.setVisible(false);
    this.shield?.setVisible(false);
    this.wrap?.setVisible(false);
    this.aura?.setVisible(false);
    this.lotusPair?.setVisible(false);
    this.zoneFX.clear();
    this.lee?.setVisible(true).setRotation(0);
    this.gaara?.setVisible(true).setRotation(0);
    this.shield
      ?.setTexture('ch-sand', 13)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(180, 168)
      .setFlipX(false)
      .setRotation(0);
  }
  effect(
    kind: string,
    x: number,
    y: number,
    size = 110,
    duration = 500,
    rotation = 0,
  ) {
    const image = this.add
      .sprite(
        x,
        y,
        kind === 'gates'
          ? 'ch-gates-aura'
          : kind === 'impact'
            ? 'ch-sand'
            : 'ch-sand-effects',
        0,
      )
      .setDepth(kind === 'gates' || kind === 'sand' ? 8 : 14)
      .setBlendMode(
        kind === 'gates' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
      );
    this.fx.add({ image, born: this.clock, duration, kind, size, rotation });
  }
  afterimage() {
    if (bridge.settings().reducedShake) return;
    const s = this.lee;
    const image = this.add
      .sprite(s.x, s.y, s.texture.key, s.frame.name)
      .setOrigin(s.originX, s.originY)
      .setScale(s.scaleX, s.scaleY)
      .setFlipX(s.flipX)
      .setRotation(s.rotation)
      .setTint(0x91e8c3)
      .setDepth(9);
    this.fx.add({
      image,
      born: this.clock,
      duration: 220,
      kind: 'afterimage',
      size: 0,
      rotation: s.rotation,
    });
  }
  publish() {
    const d = this.duel,
      l = d.lee,
      g = d.gaara;
    bridge.patch({
      phase: this.phase,
      health: l.health,
      stamina: l.stamina,
      ultimate: l.ultimate,
      bossHealth: g.health,
      bossMax: g.maxHealth,
      bossStamina: g.stamina,
      bossMove: d.move?.name || '',
      exposed: d.exposed,
      guardBroken: d.now < l.guardBrokenUntil,
      stunned: d.now < l.hurtUntil,
      device: this.inputs.device,
      elapsed: d.elapsed,
      phaseElapsed: d.phaseTime,
      skill1: l.cooldown('hurricane', d.now),
      skill2: l.cooldown('rising-wind', d.now),
      backstep: l.cooldown('backstep', d.now),
      parries: d.parries,
      fps: this.game.loop.actualFps,
    });
  }
  update(_time: number, rawDt: number) {
    if (this.failed || !this.lee) return;
    const s = bridge.get().screen;
    this.inputs.poll();
    if (s === 'paused' || s === 'dead' || s === 'victory' || s === 'error') {
      this.inputs.endFrame();
      return;
    }
    const dt = Math.min(rawDt, 40);
    this.clock += dt;
    if (s === 'title') {
      pose(this.lee, 'lee', 'idle', this.clock, 1);
      pose(this.gaara, 'gaara', 'idle', this.clock + 1100, -1);
      this.inputs.endFrame();
      return;
    }
    this.sounds.sync(true);
    if (this.story) this.updateStory(dt);
    else if (this.ultimateAt >= 0) this.updateUltimate(dt);
    else if (s === 'playing') this.updateCombat(dt);
    this.renderFX();
    this.inputs.endFrame();
    if (this.clock - this.lastHud > 75) {
      this.lastHud = this.clock;
      this.publish();
    }
  }
  updateCombat(dt: number) {
    const d = this.duel,
      l = d.lee;
    d.lee.x = this.body.x;
    d.lee.y = this.body.y;
    l.grounded = this.bodyPhysics.blocked.down || this.body.y >= FLOOR - 0.5;
    const dir =
      (this.inputs.held('right') ? 1 : 0) - (this.inputs.held('left') ? 1 : 0);
    if (dir && l.canAct(d.now, true)) l.facing = dir as -1 | 1;
    l.setGuard(this.inputs.held('parry'), this.inputs.pressed('parry'), d.now);
    this.jumps.observe(d.now, l.grounded, this.bodyPhysics.velocity.y);
    if (this.inputs.pressed('jump')) this.jumps.press(d.now);
    const jump = this.jumps.consume(d.now, l.canAct(d.now) && !l.guard);
    if (jump) {
      this.bodyPhysics.setVelocityY(-COMBAT.jump * (jump === 'air' ? 0.76 : 1));
      l.grounded = false;
      if (jump === 'air') this.effect('sand', l.x, l.y + 5, 90, 250);
    }
    if (this.inputs.released('jump') && this.bodyPhysics.velocity.y < -280)
      this.bodyPhysics.setVelocityY(this.bodyPhysics.velocity.y * 0.55);
    if (this.inputs.pressed('dash'))
      l.start(
        UNIVERSAL[
          l.grounded
            ? this.inputs.held('down') && dir
              ? 'slide'
              : 'dash'
            : 'airdash'
        ],
        d.now,
      );
    for (const key of ['skill1', 'skill2', 'tool', 'substitute'] as const)
      if (this.inputs.pressed(key)) l.start(LEE_SKILLS[key], d.now);
    if (this.inputs.pressed('melee')) {
      if (this.inputs.held('down') && l.grounded) l.beginCharge(d.now);
      else l.bufferMelee(d.now);
    }
    if (this.inputs.released('melee')) l.releaseCharge(d.now);
    l.consumeMelee(d.now);
    if (
      this.inputs.pressed('ultimate') &&
      l.ultimate >= 100 &&
      l.canAct(d.now)
    ) {
      this.beginUltimate();
      return;
    }
    let vx = l.action
      ? (l.action.definition.move || 0) * l.action.facing
      : dir * (l.guard ? COMBAT.guardSpeed : PHASE_INFO[this.phase].speed);
    if (l.action?.definition.id === 'hurricane')
      vx = hurricaneVelocity(
        l.x,
        d.gaara.x,
        l.action.facing,
        d.now - l.action.started,
        dt,
      );
    if (d.now < l.hurtUntil || d.now < l.guardBrokenUntil) vx = 0;
    if (l.chargeStarted !== null) vx = 0;
    this.bodyPhysics.setVelocityX(vx);
    if (l.action?.definition.action === 'airdash')
      this.bodyPhysics.setVelocityY(0);
    this.body.x = clamp(this.body.x, LEFT, RIGHT);
    d.update(dt);
    this.lee.setPosition(this.body.x, this.body.y);
    this.gaara.setPosition(d.gaara.x, d.gaara.y);
    let anim = l.animation(d.now);
    if (anim === 'idle' && Math.abs(vx) > 5) anim = 'run';
    pose(
      this.lee,
      'lee',
      anim,
      l.action ? d.now - l.action.started : this.clock,
      l.facing,
      this.phase === 'gates',
      l.action?.definition.duration || 400,
    );
    if (l.action && d.now >= l.hurtUntil && d.now >= l.guardBrokenUntil) {
      const a = l.action.definition,
        age = d.now - l.action.started;
      const hitAt =
        a.events.find((e) => e.kind === 'hit')?.at ?? a.duration / 2;
      const row =
        a.id === 'hurricane'
          ? 0
          : a.id === 'rising-wind' || a.action === 'heavy'
            ? 1
            : a.action === 'aerial'
              ? 2
              : a.action === 'light2'
                ? 0
                : a.action === 'light3'
                  ? 1
                  : -1;
      if (row >= 0)
        framePose(
          this.lee,
          'lee-actions',
          row * 6 + contactFrame(age, a.duration, hitAt),
          l.facing,
        );
    }
    const g = d.gaara;
    const ga: AnimationName =
      d.now < g.guardBrokenUntil
        ? 'guardbreak'
        : d.now < g.hurtUntil
          ? 'hurt'
          : d.move && d.now - d.move.start < d.move.recovery
            ? 'cast'
            : 'idle';
    pose(
      this.gaara,
      'gaara',
      ga,
      d.move ? d.now - d.move.start : this.clock,
      g.facing,
    );
    if (ga === 'cast' && d.move) {
      const m = d.move,
        age = d.now - m.start;
      const row =
        m.id === 'coffin' || m.id === 'walls'
          ? 1
          : m.id === 'storm' || m.id === 'fan'
            ? 2
            : 0;
      const castingAge =
        age < m.windup ? age : m.windup + ((age - m.windup) % 700);
      framePose(
        this.gaara,
        'gaara-actions',
        row * 6 + contactFrame(castingAge, m.windup + 700, m.windup),
        g.facing,
      );
    }
    if (d.now - g.damagedAt < 100)
      this.gaara.setTint(d.exposed ? 0xffdbb3 : 0xd5b878);
    else this.gaara.clearTint();
    if (d.now - l.damagedAt < 100) this.lee.setTint(0xffad8b);
    else if (this.phase === 'gates') this.lee.setTint(0xffd6bc);
    else this.lee.clearTint();
    this.renderCombat();
    if (l.health <= 0) {
      this.physics.world.pause();
      d.cancelAttack();
      this.clearEffects();
      bridge.patch({ screen: 'dead' });
      this.sounds.sync(false);
    } else if (d.pendingStory) this.startStory(d.pendingStory);
  }
  renderCombat() {
    const d = this.duel,
      g = this.graphics;
    g.clear();
    g.fillStyle(0x11170e, 0.25);
    g.fillEllipse(this.lee.x, FLOOR + 2, 75, 13);
    g.fillEllipse(this.gaara.x, FLOOR + 2, 75, 13);
    this.shield
      .setVisible(!d.exposed)
      .setPosition(d.gaara.x, d.gaara.y - 62)
      .setAlpha(0.65 + Math.sin(this.clock * 0.004) * 0.08);
    this.renderAura(this.phase === 'gates');
    for (const z of d.zones) {
      const t = clamp((d.now - z.warnAt) / (z.hitAt - z.warnAt), 0, 1);
      const width = z.width + 10,
        pulse = bridge.settings().reducedShake
          ? 1
          : 0.85 + 0.15 * Math.sin(t * Math.PI * 6);
      g.fillStyle(0x382314, 0.78);
      g.fillEllipse(z.x, FLOOR - 4, width + 10, 30);
      g.fillStyle(0xec974c, (0.34 + 0.24 * t) * pulse);
      g.fillEllipse(z.x, FLOOR - 5, width, 23);
      g.lineStyle(5, 0x301609, 1);
      g.strokeEllipse(z.x, FLOOR - 5, width, 23);
      g.lineStyle(2.5, 0xffdda0, 1);
      g.strokeEllipse(z.x, FLOOR - 5, width, 23);
      g.lineStyle(4, 0xffb567, 0.85);
      g.lineBetween(z.x - width / 2, FLOOR - 18, z.x - width / 2, FLOOR + 4);
      g.lineBetween(z.x + width / 2, FLOOR - 18, z.x + width / 2, FLOOR + 4);
      // The rising grains fill the complete locked footprint; the outer edge never grows.
      g.fillStyle(0xffd697, 0.85);
      g.fillTriangle(
        z.x - 7,
        FLOOR - 45 - t * 14,
        z.x + 7,
        FLOOR - 45 - t * 14,
        z.x,
        FLOOR - 32 - t * 14,
      );
      for (let i = 0; i < 9; i++) {
        const x = z.x + (i / 8 - 0.5) * z.width;
        g.lineStyle(2, 0xeed19a, 0.2 + 0.5 * t);
        g.lineBetween(
          x,
          FLOOR - 2,
          x + Math.sin(i + this.clock * 0.012) * 8,
          FLOOR - 5 - t * (12 + (i % 3) * 10),
        );
      }
      const key = `${z.x}:${z.hitAt}`;
      if (d.now >= z.hitAt && !this.zoneFX.has(key)) {
        this.zoneFX.add(key);
        this.effect('eruption', z.x, FLOOR - 72, z.width * 1.75, 400);
        this.sounds.cue('sand-impact',.7,.3);
      }
    }
    const ids = new Set(d.shots.map((p) => p.id));
    for (const [id, sprite] of this.shotSprites)
      if (!ids.has(id)) {
        sprite.destroy();
        this.shotSprites.delete(id);
      }
    for (const p of d.shots) {
      let sprite = this.shotSprites.get(p.id);
      if (!sprite) {
        sprite = this.add.sprite(p.x, p.y, 'ch-sand', 0).setDepth(13);
        this.shotSprites.set(p.id, sprite);
      }
      sprite.setTexture('ch-sand-effects');
      sprite
        .setPosition(p.x, p.y)
        .setFrame(
          p.kind === 'hand'
            ? Math.floor((d.now - p.born) / 85) % 4
            : 4 + (Math.floor((d.now - p.born) / 80) % 4),
        )
        .setDisplaySize(
          p.kind === 'hand' ? 265 : p.kind === 'spike' ? 105 : 88,
          p.kind === 'hand' ? 174 : p.kind === 'spike' ? 70 : 59,
        )
        .setRotation(Math.atan2(p.vy, p.vx));
      sprite.setAlpha(p.bounceWait ? 0.7 : 1);
      if (p.returned) sprite.setTint(0xf5ffbd);
      else if (p.bounces || p.bounceWait) sprite.setTint(0xffdf9a);
      else sprite.clearTint();
      if (p.bounces && p.vy > 0) {
        const until = (FLOOR - 18 - p.y) / p.vy;
        if (until >= 0 && until < 0.45) {
          const x = p.x + p.vx * until;
          g.lineStyle(2, 0xffdda0, 0.75);
          g.strokeEllipse(x, FLOOR - 15, 35, 12);
        }
      }
      // Bright outlined cores read independently of large decorative sand tails.
      g.fillStyle(0x473015, 0.9);
      g.fillCircle(p.x, p.y, p.kind === 'hand' ? 9 : 5.5);
      g.fillStyle(p.returned ? 0xe9ffca : 0xfff1c0, 1);
      g.fillCircle(p.x, p.y, p.kind === 'hand' ? 5.5 : 3);
      g.lineStyle(
        p.kind === 'hand' ? 12 : 3,
        p.returned ? 0xdbffb2 : 0xf9daa4,
        0.42,
      );
      g.lineBetween(p.x, p.y, p.x - p.vx * 0.055, p.y - p.vy * 0.055);
    }
    if (d.move && d.now - d.move.start < d.move.windup) {
      const p = (d.now - d.move.start) / d.move.windup;
      g.fillStyle(0xe2bb76, 0.15 + p * 0.35);
      g.fillEllipse(
        d.gaara.x + d.gaara.facing * 42,
        d.gaara.y - 86,
        25 + p * 35,
        25 + p * 35,
      );
    }
    if (d.move && ['hand', 'fan'].includes(d.move.id)) {
      const m = d.move,
        next = m.start + m.windup + (m.id === 'fan' ? m.emitted * 650 : 0),
        remaining = next - d.now;
      const pending = m.id === 'hand' ? m.emitted === 0 : m.emitted < 3;
      if (pending && remaining >= 0 && remaining <= 210) {
        const x = d.gaara.x + d.gaara.facing * 48,
          y = d.gaara.y - 96,
          r = 7 + 5 * (1 - remaining / 210);
        g.lineStyle(5, 0x18394b, 0.95);
        g.lineBetween(x - r, y, x + r, y);
        g.lineBetween(x, y - r, x, y + r);
        g.lineStyle(2.5, 0xd9f9ff, 1);
        g.lineBetween(x - r, y, x + r, y);
        g.lineBetween(x, y - r, x, y + r);
      }
    }
    if (
      d.move &&
      ['storm', 'walls'].includes(d.move.id) &&
      d.now - d.move.start < d.move.windup
    ) {
      const p = clamp((d.now - d.move.start) / d.move.windup, 0, 1);
      // Sand rises visibly from the arena into broad, moving casting ribbons.
      for (let strand = 0; strand < 3; strand++) {
        g.lineStyle(7 - strand, 0xe4bd77, 0.18 + 0.13 * p);
        g.beginPath();
        for (let i = 0; i < 25; i++) {
          const f = i / 24,
            x =
              d.gaara.x +
              Math.sin(f * 7 + strand * 1.8 + this.clock * 0.002) *
                (45 + f * 80),
            y = FLOOR - f * 330 * p;
          if (!i) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokePath();
      }
    }
    if (d.lee.guard && d.now - d.lee.parryAt < COMBAT.parryWindow) {
      const x = d.lee.x + d.lee.facing * 34,
        y = d.lee.y - 78;
      g.lineStyle(3, 0xb8eeff, 0.9);
      g.lineBetween(x, y - 16, x + d.lee.facing * 8, y);
      g.lineBetween(x + d.lee.facing * 8, y, x, y + 16);
    }
    this.warning.setVisible(d.red).setPosition(d.gaara.x, d.gaara.y - 165);
    for (const cue of d.cues) {
      if (cue.id <= this.lastCue) continue;
      if (cue.kind === 'parry') {
        this.effect('impact', cue.x, cue.y, 130, 360);
        this.feedback
          .setText('PERFECT PARRY')
          .setPosition(cue.x, Math.max(190, cue.y - 60));
        this.feedbackAt = this.clock;
        this.sounds.effect('parry', 0.65);
      } else if (cue.kind === 'break') {
        this.effect('impact', cue.x, cue.y, 180, 500);
        this.feedback
          .setText(
            cue.defender === 'lee' ? 'GUARD BROKEN' : 'SAND GUARD BROKEN',
          )
          .setPosition(cue.x, Math.max(190, cue.y - 60));
        this.feedbackAt = this.clock;
        this.sounds.effect('break', 0.5);
      } else if (cue.kind === 'hit') {
        this.effect('impact', cue.x, cue.y, 125, 280);
        this.sounds.strike('kick', 0.55);
      } else if (cue.kind === 'armor' || cue.kind === 'block') {
        this.effect(
          cue.kind === 'armor' ? 'armor' : 'sand',
          cue.x,
          cue.y,
          135,
          300,
        );
        this.sounds.effect('guard', 0.3);
      } else if (cue.kind === 'bounce') {
        this.effect('sand', cue.x, cue.y, 105, 250);
        this.sounds.cue('sand-bounce',.6,.2);
      } else if (cue.kind === 'tell') {
        // The cue is anchored to preparation; it does not reveal the future parry frame.
        this.sounds.cue('tell',.65,.3);
      } else if (cue.kind === 'impact')
        this.effect('sand', cue.x, cue.y, 110, 450);
      else if (cue.kind === 'cast') {
        this.effect('sand', cue.x, cue.y, 75, 420);
        this.sounds.cue('sand-cast',.65,.3);
      } else if (cue.kind === 'step') this.sounds.effect('swing', 0.25);
    }
    if (d.cues.length) this.lastCue = d.cues[d.cues.length - 1].id;
    const liveZones = new Set(d.zones.map((z) => `${z.x}:${z.hitAt}`));
    for (const key of this.zoneFX)
      if (!liveZones.has(key)) this.zoneFX.delete(key);
  }
  renderAura(visible: boolean, strength = 1) {
    this.aura.setVisible(visible);
    if (!visible) return;
    const frame = bridge.settings().reducedShake
      ? 2
      : 1 + (Math.floor(this.clock / 110) % 6);
    framePose(this.aura, 'gates-aura', frame, 1, 0.51 * strength);
    this.aura.setPosition(this.lee.x, this.lee.y + 3).setAlpha(0.8);
  }
  renderFX() {
    this.fx.update((e) => {
      const age = this.clock - e.born,
        t = age / e.duration;
      if (t >= 1) return false;
      if (e.kind === 'afterimage') {
        e.image.setAlpha((1 - t) * 0.28);
        return true;
      }
      const frame =
        e.kind === 'gates'
          ? Math.min(7, Math.floor(t * 8))
          : e.kind === 'grip'
            ? Math.min(3, Math.floor(t * 4))
            : e.kind === 'cushion'
              ? [12, 13, 14, 15][Math.min(3, Math.floor(t * 4))]
              : e.kind === 'eruption'
                ? [12, 13, 14, 15][Math.min(3, Math.floor(t * 4))]
                : e.kind === 'impact'
                  ? [11, 11, 14, 15][Math.min(3, Math.floor(t * 4))]
                  : e.kind === 'armor'
                    ? [8, 9, 10, 11][Math.min(3, Math.floor(t * 4))]
                    : [12, 14, 15, 15][Math.min(3, Math.floor(t * 4))];
      e.image
        .setFrame(frame)
        .setDisplaySize(
          e.size,
          e.size * (e.kind === 'gates' ? 1.34 : e.kind === 'impact' ? 1 : 0.68),
        )
        .setAlpha(
          Math.min(
            e.kind === 'gates' ? 0.55 : e.kind === 'sand' ? 0.65 : 1,
            (1 - t) * 2,
          ),
        )
        .setRotation(e.rotation);
      return true;
    });
    if (this.clock - this.feedbackAt > 500) this.feedback.setText('');
  }
  startStory(story: Story) {
    this.story = story;
    this.storyContact = false;
    this.storySettled = false;
    this.storyAt = this.clock;
    this.storyFrom = { lx: this.lee.x, gx: this.gaara.x };
    this.storyEntry =
      story === 'opening'
        ? null
        : {
            lx: this.lee.x,
            ly: this.lee.y,
            gx: this.gaara.x,
            gy: this.gaara.y,
            to: sceneSpacing(this.lee.x, this.gaara.x),
          };
    this.duel.cancelAttack();
    this.inputs.clear();
    this.inputs.quarantineConfirm();
    this.physics.world.pause();
    this.bodyPhysics.setVelocity(0, 0);
    this.clearEffects();
    this.guy.setVisible(false);
    bridge.patch({ screen: 'intro', dialogue: '', ultimateName: '' });
    if (story === 'opening') {
      this.lee.setPosition(-60, FLOOR);
      this.gaara.setPosition(1010, FLOOR).setAlpha(0);
      this.storyFrom = { lx: -60, gx: 1010 };
    }
    this.cameras.main.setZoom(1);
  }
  say(speaker: string, dialogue: string) {
    if (bridge.get().dialogue !== dialogue) bridge.patch({ speaker, dialogue });
  }
  updateStory(dt: number) {
    const story = this.story!;
    let t = this.clock - this.storyAt;
    if (this.storyEntry) {
      const e = this.storyEntry,
        p = clamp(t / 700, 0, 1),
        ease = p * p * (3 - 2 * p);
      this.graphics.clear();
      this.shield.setVisible(false);
      const moving = Math.abs(e.lx - e.to.lx) > 12;
      this.lee.setPosition(
        Phaser.Math.Linear(e.lx, e.to.lx, ease),
        Phaser.Math.Linear(e.ly, FLOOR, ease) -
          (moving ? 35 : 0) * Math.sin(p * Math.PI),
      );
      this.gaara.setPosition(
        Phaser.Math.Linear(e.gx, e.to.gx, ease),
        Phaser.Math.Linear(e.gy, FLOOR, ease),
      );
      pose(
        this.lee,
        'lee',
        moving ? (p < 0.82 ? 'jump' : 'land') : 'idle',
        t,
        e.to.dir,
      );
      pose(
        this.gaara,
        'gaara',
        Math.abs(e.gx - e.to.gx) > 4 && p < 0.9 ? 'cast' : 'idle',
        t,
        -e.to.dir,
      );
      if (Math.abs(e.gx - e.to.gx) > 4 && t % 160 < dt)
        this.effect('sand', this.gaara.x, FLOOR - 12, 110, 400);
      this.renderAura(story === 'ending');
      if (p < 1) return;
      this.storyFrom = { lx: e.to.lx, gx: e.to.gx };
      this.storyEntry = null;
      this.storyAt += 700;
      t -= 700;
    }
    if ((story === 'gates' || story === 'ending') && t < 2500) {
      this.storyLotus(t, story === 'ending', dt);
      return;
    }
    if (story === 'gates' || story === 'ending') {
      t -= 2500;
      if (!this.storySettled) {
        this.storySettled = true;
        this.storyFrom = { lx: this.lee.x, gx: this.gaara.x };
        this.gaara.setAlpha(1);
        this.lee.setVisible(true);
        this.gaara.setVisible(true);
      }
    }
    this.wrap.setVisible(false);
    this.lotusPair.setVisible(false);
    this.graphics.clear();
    this.warning.setVisible(false);
    this.shield.setVisible(false);
    this.renderAura(false);
    this.lee.clearTint();
    this.gaara.clearTint();
    if (story === 'opening') {
      const p = clamp(t / 3200, 0, 1);
      this.lee.setPosition(Phaser.Math.Linear(-60, 390, p), FLOOR);
      pose(this.lee, 'lee', p < 1 ? 'run' : 'idle', t, 1);
      this.gaara.setAlpha(clamp((t - 1200) / 1300, 0, 1));
      pose(this.gaara, 'gaara', 'idle', t, -1);
      if (t < 3000) {
        this.say('HAYATE GEKKO', 'The next match: Rock Lee versus Gaara.');
        if (t % 400 < dt) this.effect('sand', 1010, FLOOR - 25, 130, 650);
      } else if (t < 6500)
        this.say('ROCK LEE', 'I will prove what hard work can do.');
      else if (t < 9200) this.say('MIGHT GUY', 'Show them your strength, Lee!');
      else if (t < 11500) this.say('GAARA', 'Come.');
      else this.finishStory();
    } else if (story === 'weights') this.storyWeights(t, dt);
    else if (story === 'gates') this.storyGates(t);
    else this.storyEnding(t, dt);
  }
  storyWeights(t: number, dt: number) {
    const { lx, gx } = this.storyFrom,
      dir = gx >= lx ? 1 : -1;
    this.lee.setPosition(lx, FLOOR);
    this.gaara.setPosition(gx, FLOOR);
    pose(this.gaara, 'gaara', 'idle', t, -dir);
    const frame =
      t < 700
        ? 0
        : t < 1400
          ? 1
          : t < 1950
            ? 2
            : t < 2400
              ? 3
              : t < 3100
                ? 4
                : 5;
    framePose(this.lee, 'lee-cinematic', frame, dir);
    if (t < 1800) this.say('MIGHT GUY', 'Lee. Take them off.');
    else if (t < 4300) this.say('ROCK LEE', 'Thank you, Guy-sensei!');
    else this.say('KAKASHI', 'He is moving faster than the sand can follow!');
    if (t >= 2400) {
      const fall = clamp((t - 2400) / 420, 0, 1);
      this.graphics.fillStyle(0x4c514a, 1);
      this.graphics.lineStyle(2, 0xb1b29e, 1);
      for (const off of [-34, 34]) {
        const y = FLOOR - 60 + 60 * fall * fall;
        this.graphics.fillRoundedRect(lx + off - 8, y - 8, 16, 10, 3);
        this.graphics.strokeRoundedRect(lx + off - 8, y - 8, 16, 10, 3);
      }
    }
    if (t >= 2820 && t - dt < 2820) {
      this.effect('sand', lx - 34, FLOOR - 16, 150, 650);
      this.effect('sand', lx + 34, FLOOR - 16, 150, 650);
      this.sounds.strike('heavy', 0.4);
      if (!bridge.settings().reducedShake) this.cameras.main.shake(100, 0.004);
    }
    if (t >= 4500 && t < 5500) {
      const p = clamp((t - 4500) / 850, 0, 1);
      this.lee.setPosition(
        Phaser.Math.Linear(lx, clamp(gx + dir * 90, LEFT + 30, RIGHT - 30), p),
        FLOOR - 20 * Math.sin(p * Math.PI),
      );
      pose(this.lee, 'lee', 'run', t, dir);
      if (t % 110 < dt) this.afterimage();
      if (t - dt < 4550 && t >= 4550)
        this.effect('grip', gx - dir * 80, FLOOR - 80, 210, 700);
    } else if (t >= 5500) {
      const retreat = clamp((t - 6150) / 750, 0, 1);
      this.lee.setPosition(
        clamp(gx + dir * (90 + 150 * retreat), LEFT + 30, RIGHT - 30),
        FLOOR - 25 * Math.sin(retreat * Math.PI),
      );
      if (t < 6100)
        framePose(
          this.lee,
          'lee-actions',
          contactFrame(t - 5500, 600, 200),
          -dir,
        );
      else
        pose(
          this.lee,
          'lee',
          retreat > 0 && retreat < 1 ? 'jump' : 'idle',
          t,
          -dir,
        );
      if (t >= 5700 && t - dt < 5700) {
        this.effect('armor', gx, FLOOR - 78, 140, 600);
        this.sounds.strike('kick', 0.45);
      }
      if (t >= 5700 && t < 6050)
        framePose(
          this.gaara,
          'gaara-actions',
          19 + Math.min(3, Math.floor((t - 5700) / 90)),
          dir,
        );
      else pose(this.gaara, 'gaara', 'idle', t, dir);
    }
    if (t > 7300) this.finishStory();
  }
  storyGates(t: number) {
    const dir = this.storyFrom.gx >= this.storyFrom.lx ? 1 : -1;
    this.gaara.setPosition(this.storyFrom.gx, FLOOR);
    pose(this.gaara, 'gaara', 'idle', t, -dir);
    this.lee.setPosition(this.storyFrom.lx, FLOOR);
    if (t < 1800) framePose(this.lee, 'lee-cinematic', 18, dir);
    else
      framePose(
        this.lee,
        'lee-cinematic',
        6 + Math.min(4, Math.floor((t - 1800) / 800)),
        dir,
      );
    if (t < 2300) this.say('GAARA', 'Only a shell of sand.');
    else if (t < 4700) this.say('MIGHT GUY', 'Lee... this is your ninja way.');
    else this.say('ROCK LEE', 'The Fifth Gate... open!');
    this.renderAura(t > 3000, Math.min(1.15, 0.6 + (t - 3000) / 5000));
    if (t > 3200) this.lee.setTint(0xffc4b5);
    if (t > 7300) this.finishStory();
  }
  storyEnding(t: number, dt: number) {
    const { lx, gx } = this.storyFrom,
      dir = gx >= lx ? 1 : -1;
    this.lee.setPosition(lx, FLOOR);
    this.gaara.setPosition(gx, FLOOR);
    pose(this.gaara, 'gaara', 'idle', t, -dir);
    this.lee.setAlpha(1);
    if (t < 1800) {
      framePose(this.lee, 'lee-cinematic', 18, dir);
      this.say('ROCK LEE', 'I gave it... everything.');
    } else if (t < 3700) {
      framePose(
        this.gaara,
        'gaara-actions',
        6 + contactFrame(t - 1800, 1900, 700),
        -dir,
      );
      framePose(this.lee, 'lee-cinematic', t < 2600 ? 19 : 20, dir);
      if (t - dt < 2450 && t >= 2450) {
        this.effect('grip', lx + dir * 14, FLOOR - 22, 90, 950);
        this.effect('grip', lx - dir * 25, FLOOR - 57, 85, 950);
      }
      this.say('MIGHT GUY', 'Lee!');
    } else if (t < 6400) {
      framePose(this.lee, 'lee-cinematic', 20, dir);
      const arrival = clamp((t - 3700) / 700, 0, 1),
        stop = lx + dir * 80;
      this.guy
        .setVisible(true)
        .setPosition(Phaser.Math.Linear(lx - dir * 420, stop, arrival), FLOOR);
      if (arrival < 1) pose(this.guy, 'guy', 'run', t, dir);
      else
        framePose(
          this.guy,
          'guy-actions',
          6 + Math.min(4, Math.floor((t - 4400) / 150)),
          dir,
        );
      // The finishing sand reaches Guy only after his planted palm is ready.
      if (t >= 4000 && t < 4750) {
        this.shield
          .setVisible(true)
          .setTexture('ch-sand-effects', Math.floor(t / 90) % 4)
          .setOrigin(0.7, 0.5)
          .setDisplaySize(210, 140)
          .setFlipX(dir > 0)
          .setPosition(
            Phaser.Math.Linear(
              gx,
              stop + dir * 34,
              clamp((t - 4000) / 750, 0, 1),
            ),
            FLOOR - 83,
          );
      }
      if (t >= 4750 && t - dt < 4750) {
        this.effect('armor', stop + dir * 35, FLOOR - 85, 170, 550);
        this.sounds.effect('parry', 0.45);
      }
      this.say('MIGHT GUY', 'Enough. It is over.');
    } else {
      this.guy.setVisible(true).setPosition(lx + dir * 95, FLOOR);
      pose(this.guy, 'guy', 'land', t, -dir);
      framePose(
        this.lee,
        'lee-cinematic',
        t < 7100 ? 21 : t < 7800 ? 22 : 23,
        dir,
      );
      if (t < 8000) this.say('HAYATE GEKKO', 'Winner: Gaara.');
      else
        this.say(
          'MIGHT GUY',
          'Even unconscious, you are still standing. You have proved it, Lee.',
        );
    }
    if (t > 11300) this.finishStory();
  }
  animateLotus(
    t: number,
    from: { lx: number; ly: number; gx: number; gy: number },
    gated: boolean,
  ) {
    const p = lotusStaging(t, from, gated, FLOOR);
    this.graphics.clear();
    this.shield.setVisible(false);
    this.warning.setVisible(false);
    this.wrap.setVisible(false);
    this.lotusPair.setVisible(p.pair >= 0);
    this.lee
      .setVisible(p.pair < 0)
      .setAlpha(1)
      .setPosition(clamp(p.lx, LEFT, RIGHT), p.ly);
    this.gaara
      .setVisible(p.pair < 0)
      .setAlpha(1)
      .setPosition(p.gx, p.gy);
    if (p.stage === 'charge') {
      pose(this.lee, 'lee', 'ultimate', t * 2000, p.dir, gated);
      if (gated) framePose(this.lee, 'lee-cinematic', 10, p.dir);
      pose(this.gaara, 'gaara', 'idle', 0, -p.dir);
    } else if (p.stage === 'rush') {
      pose(this.lee, 'lee', 'run', t * 2000, p.dir, gated);
      pose(this.gaara, 'gaara', 'idle', 0, -p.dir);
    } else {
      framePose(this.lee, 'lee-actions', p.frame, p.dir);
      framePose(
        this.gaara,
        'gaara-actions',
        p.stage === 'impact' ? 22 : 20,
        -p.dir,
      );
    }
    if (p.pair >= 0) {
      framePose(this.lotusPair, 'lee-cinematic', p.pair, p.dir, 0.59);
      this.lotusPair.setPosition(p.gx, p.gy);
    }
    if (gated && (p.stage === 'bind' || p.stage === 'descent')) {
      // Taut bandage follows the striking hand and Gaara's bound torso throughout the pull.
      this.graphics.lineStyle(5, 0x62604e, 0.8);
      this.graphics.lineBetween(
        this.lee.x + p.dir * 18,
        this.lee.y - 78,
        p.gx,
        p.gy - 67,
      );
      this.graphics.lineStyle(3, 0xf7f2d5, 1);
      this.graphics.lineBetween(
        this.lee.x + p.dir * 18,
        this.lee.y - 78,
        p.gx,
        p.gy - 67,
      );
      this.wrap
        .setVisible(true)
        .setPosition(p.gx, p.gy - 68)
        .setDisplaySize(80, 100);
    }
    this.renderAura(gated && p.pair < 0, p.stage === 'charge' ? 1.13 : 0.95);
    const beat = Math.floor(t * 16);
    if (beat !== this.ultVisualBeat) {
      this.ultVisualBeat = beat;
      if (p.stage === 'rush' || (gated && p.stage === 'bind'))
        this.afterimage();
      if (
        (gated && p.stage === 'bind') ||
        (p.stage === 'launch' && beat === 5)
      ) {
        this.effect('impact', p.gx, p.gy - 70, 95, 170);
        this.sounds.strike('palm', 0.2);
      }
    }
    return p;
  }
  storyLotus(age: number, gated: boolean, _dt: number) {
    const p = this.animateLotus(
      age / 2500,
      { ...this.storyFrom, ly: FLOOR, gy: FLOOR },
      gated,
    );
    this.say(
      'ROCK LEE',
      gated ? 'This is everything I have! Reverse Lotus!' : 'Primary Lotus!',
    );
    if (p.stage === 'impact' && !this.storyContact) {
      this.storyContact = true;
      this.effect(gated ? 'cushion' : 'armor', p.gx, FLOOR - 30, 300, 700);
      this.sounds.strike('heavy', 0.5);
      if (!bridge.settings().reducedShake) this.cameras.main.shake(100, 0.004);
    }
    if (gated && age > 2200)
      this.lee.x = clamp(
        p.lx - p.dir * 125 * clamp((age - 2200) / 300, 0, 1),
        LEFT + 20,
        RIGHT - 20,
      );
    if (!gated && age > 2200) {
      // The shell crumbles at the contact point; the real body forms behind the dust.
      const reveal = clamp((age - 2200) / 300, 0, 1);
      this.gaara.x = clamp(
        this.storyFrom.gx - p.dir * 350,
        LEFT + 35,
        RIGHT - 35,
      );
      this.gaara.setAlpha(reveal);
      framePose(this.gaara, 'gaara-actions', 5, p.dir);
    }
    this.renderAura(gated);
  }
  finishStory(skipped = false) {
    const story = this.story;
    if (skipped) {
      const e = this.storyEntry?.to ?? sceneSpacing(this.lee.x, this.gaara.x);
      this.lee.setPosition(story === 'opening' ? 390 : e.lx, FLOOR);
      this.gaara.setPosition(story === 'opening' ? 1010 : e.gx, FLOOR);
      pose(this.lee, 'lee', 'idle', 0, this.gaara.x >= this.lee.x ? 1 : -1);
      pose(this.gaara, 'gaara', 'idle', 0, this.gaara.x >= this.lee.x ? -1 : 1);
    }
    this.storyEntry = null;
    this.story = null;
    this.inputs.clear();
    this.inputs.quarantineConfirm();
    this.clearEffects();
    bridge.patch({ dialogue: '', speaker: '' });
    if (story === 'ending') {
      bridge.checkpoint('gates', true);
      bridge.patch({ screen: 'victory' });
      this.sounds.setTrack('snow');
      this.publish();
      return;
    }
    const next: Phase =
      story === 'weights' ? 'speed' : story === 'gates' ? 'gates' : this.phase;
    const lx = clamp(this.lee.x, LEFT, RIGHT),
      gx = clamp(this.gaara.x, LEFT, RIGHT);
    this.phase = next;
    this.duel.advancePower(next);
    this.jumps.reset();
    this.duel.lee.x = lx;
    this.duel.gaara.x = gx;
    this.duel.lee.y = this.duel.gaara.y = FLOOR;
    this.duel.lee.facing = this.lee.flipX ? -1 : 1;
    this.duel.gaara.facing = this.gaara.flipX ? -1 : 1;
    this.bodyPhysics.reset(lx, FLOOR);
    this.bodyPhysics.setVelocity(0, 0);
    this.lee.setAlpha(1);
    this.gaara.setAlpha(1);
    this.lastCue = -1;
    this.physics.world.resume();
    this.checkpointHP = this.duel.gaara.health;
    bridge.checkpoint(next, false, this.checkpointHP);
    bridge.patch({ screen: 'playing', phase: next });
    this.publish();
  }
  beginUltimate() {
    const d = this.duel;
    d.lee.ultimate = 0;
    d.lee.action = null;
    d.cancelAttack();
    this.clearEffects();
    this.ultimateAt = this.clock;
    this.ultContact = false;
    this.ultVisualBeat = -1;
    this.storyContact = false;
    this.ultFrom = {
      lx: this.lee.x,
      ly: this.lee.y,
      gx: this.gaara.x,
      gy: this.gaara.y,
    };
    this.physics.world.pause();
    this.bodyPhysics.setVelocity(0, 0);
    this.inputs.clear();
    this.sounds.duck(true);
    bridge.patch({
      ultimateName: this.phase === 'gates' ? 'REVERSE LOTUS' : 'PRIMARY LOTUS',
    });
  }
  updateUltimate(dt: number) {
    const age = this.clock - this.ultimateAt;
    this.duel.elapsed += dt;
    const p = this.animateLotus(
      age / 2000,
      this.ultFrom,
      this.phase === 'gates',
    );
    if (p.stage === 'impact' && !this.ultContact) {
      this.ultContact = true;
      this.duel.ultimateImpact();
      this.effect('impact', p.gx, FLOOR - 35, 300, 550);
      this.effect('sand', p.gx, FLOOR - 20, 330, 650);
      this.sounds.strike('heavy', 0.7);
      if (!bridge.settings().reducedShake) this.cameras.main.shake(110, 0.005);
    }
    if (age >= 2000) {
      this.lotusPair.setVisible(false);
      this.wrap.setVisible(false);
      this.lee.setVisible(true);
      this.gaara.setVisible(true);
      this.ultimateAt = -1;
      this.duel.lee.x = this.lee.x;
      this.duel.lee.y = FLOOR;
      this.duel.gaara.y = FLOOR;
      this.bodyPhysics.reset(this.lee.x, FLOOR);
      this.bodyPhysics.setVelocity(0, 0);
      this.physics.world.resume();
      this.sounds.duck(false);
      bridge.patch({ ultimateName: '' });
      if (this.duel.pendingStory) this.startStory(this.duel.pendingStory);
    }
  }
}
export function mountChunin(parent: HTMLElement) {
  bridge.load();
  const inputs = new BattleInput(bridge),
    sounds = new RecordedAudio(bridge.settings, chapterAudio),
    scene = new ChuninScene();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#122319',
    render: { antialias: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 1800 }, debug: false },
    },
    audio: { noAudio: true },
    scene: [],
    callbacks: {
      postBoot: (g) => {
        g.canvas.tabIndex = 0;
        g.canvas.setAttribute(
          'aria-label',
          'Rock Lee versus Gaara game canvas',
        );
        g.scene.add('Chunin', scene, true, { inputs, sounds });
      },
    },
  });
  bridge.handle((c) => scene.command(c));
  const observer = new ResizeObserver(() => game.scale?.refresh());
  observer.observe(parent);
  type Context = {
    registerTool: (
      t: unknown,
      options?: { signal: AbortSignal },
    ) => void | Promise<void>;
    unregisterTool?: (name: string) => void;
  };
  const context =
    (document as unknown as { modelContext?: Context }).modelContext ||
    (navigator as unknown as { modelContext?: Context }).modelContext;
  const registered: string[] = [];
  const toolsLifecycle = new AbortController();
  const add = (name: string, description: string, execute: () => unknown) => {
    try {
      void Promise.resolve(
        context?.registerTool(
          {
            name,
            description,
            annotations: { readOnlyHint: name === 'read_game_status' },
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            execute,
          },
          { signal: toolsLifecycle.signal },
        ),
      ).catch(() => {});
      if (context) registered.push(name);
    } catch {}
  };
  add(
    'read_game_status',
    'Read Chapter 2 resources, Gaara phase and progress.',
    () => ({
      ...bridge.get(),
      chapter: 'lee-gaara',
      projectiles: scene.duel.shots.length,
      audio: sounds.status(),
    }),
  );
  add('start_chapter', 'Start Lee versus Gaara from the title screen.', () => {
    if (bridge.get().screen === 'title') scene.command('start');
    return bridge.get();
  });
  add('pause_game', 'Pause the active fight or cinematic.', () => {
    scene.command('pause');
    return bridge.get();
  });
  add('resume_game', 'Resume a paused fight.', () => {
    scene.command('resume');
    return bridge.get();
  });
  add('retry_checkpoint', 'Retry after defeat.', () => {
    if (bridge.get().screen === 'dead') scene.command('retry');
    return bridge.get();
  });
  if (import.meta.env.DEV) {
    const dev = window as Window & {
      chuninDev?: { scene: ChuninScene; inputs: BattleInput };
    };
    dev.chuninDev = { scene, inputs };
  }
  game.events.once('destroy', () => {
    toolsLifecycle.abort();
    observer.disconnect();
    inputs.destroy();
    sounds.destroy();
    bridge.handle(() => {});
    for (const name of registered)
      try {
        context?.unregisterTool?.(name);
      } catch {}
    if (import.meta.env.DEV)
      delete (window as Window & { chuninDev?: unknown }).chuninDev;
  });
  return game;
}
