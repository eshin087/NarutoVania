import * as Phaser from 'phaser';
import { BattleInput } from '../battle-input';
import { RecordedAudio } from '../recorded-audio';
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
  type Phase,
} from './combat';
import { pose, preloadArt, registerArt } from './art';
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
  lastJump = -10000;
  warning!: Phaser.GameObjects.Text;
  feedback!: Phaser.GameObjects.Text;
  feedbackAt = -10000;
  lastHud = 0;
  guy!: Phaser.GameObjects.Sprite;
  shield!: Phaser.GameObjects.Sprite;
  wrap!: Phaser.GameObjects.Sprite;
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
      this.begin(bridge.get().phase);
    } else if (c === 'retry') this.begin(this.phase);
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
      this.finishStory();
    }
  }
  begin(phase: Phase, story?: Story) {
    this.phase = phase;
    this.duel.reset(phase);
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
    bridge.checkpoint(phase);
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
      .sprite(x, y, kind === 'gates' ? 'ch-energy' : 'ch-sand', 0)
      .setDepth(kind === 'gates' || kind === 'sand' ? 8 : 14)
      .setBlendMode(
        kind === 'gates' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
      );
    this.fx.add({ image, born: this.clock, duration, kind, size, rotation });
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
    if (this.inputs.pressed('jump')) this.lastJump = d.now;
    if (
      d.now - this.lastJump < COMBAT.jumpBuffer &&
      l.grounded &&
      l.canAct(d.now)
    ) {
      this.bodyPhysics.setVelocityY(-COMBAT.jump);
      l.grounded = false;
      this.lastJump = -10000;
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
    if (d.now - g.damagedAt < 100)
      this.gaara.setTint(d.exposed ? 0xffdbb3 : 0xd5b878);
    else this.gaara.clearTint();
    if (d.now - l.damagedAt < 100) this.lee.setTint(0xffad8b);
    else this.lee.clearTint();
    this.renderCombat();
    if (l.health <= 0) {
      this.physics.world.pause();
      d.cancelAttack();
      this.clearEffects();
      bridge.patch({ screen: 'dead' });
      this.sounds.sync(false);
    } else if (g.health <= 0) {
      this.startStory(
        this.phase === 'shield'
          ? 'weights'
          : this.phase === 'speed'
            ? 'gates'
            : 'ending',
      );
    }
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
    if (this.phase === 'gates') {
      g.lineStyle(1, 0xb6ec94, 0.5);
      for (let i = 0; i < 8; i++) {
        const t = (this.clock * 0.001 + i / 8) % 1;
        g.lineBetween(
          this.lee.x - 35 + i * 10,
          this.lee.y - t * 160,
          this.lee.x - 28 + i * 10,
          this.lee.y - t * 160 - 28,
        );
      }
    }
    for (const z of d.zones) {
      const t = clamp((d.now - z.warnAt) / (z.hitAt - z.warnAt), 0, 1);
      g.fillStyle(0xd9b574, 0.18 + 0.25 * t);
      g.fillEllipse(z.x, FLOOR - 3, z.width * (0.5 + t * 0.5), 12 + 8 * t);
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
      if (d.now >= z.hitAt && d.now - z.hitAt < 80)
        this.effect('eruption', z.x, FLOOR - 72, z.width * 1.75, 400);
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
      sprite
        .setPosition(p.x, p.y)
        .setFrame(
          p.kind === 'hand'
            ? 4 + Math.min(2, Math.floor((d.now - p.born) / 100))
            : 8,
        )
        .setDisplaySize(
          p.kind === 'hand' ? 155 : 58,
          p.kind === 'hand' ? 100 : 38,
        )
        .setRotation(
          Math.atan2(p.vy, p.vx) +
            (p.kind === 'hand' ? Math.PI / 2 : Math.PI / 4),
        );
      if (p.returned) sprite.setTint(0xf5ffbd);
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
    this.warning.setVisible(d.red).setPosition(d.gaara.x, d.gaara.y - 165);
    for (const cue of d.cues) {
      if (cue.at <= this.lastCue) continue;
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
          .setText('SAND GUARD BROKEN')
          .setPosition(cue.x, Math.max(190, cue.y - 60));
        this.feedbackAt = this.clock;
        this.sounds.effect('break', 0.5);
      } else if (cue.kind === 'hit') {
        this.effect('impact', cue.x, cue.y, 90, 280);
        this.sounds.strike('kick', 0.55);
      } else if (cue.kind === 'armor' || cue.kind === 'block') {
        this.effect('sand', cue.x, cue.y, 85, 300);
        this.sounds.effect('guard', 0.3);
      } else if (cue.kind === 'impact')
        this.effect('sand', cue.x, cue.y, 110, 450);
      else if (cue.kind === 'cast') {
        this.effect('sand', cue.x, cue.y, 75, 420);
        this.sounds.effect('swing', 0.25);
      } else if (cue.kind === 'step') this.sounds.effect('swing', 0.25);
    }
    if (d.cues.length) this.lastCue = d.cues[d.cues.length - 1].at;
  }
  renderFX() {
    this.fx.update((e) => {
      const age = this.clock - e.born,
        t = age / e.duration;
      if (t >= 1) return false;
      const frame =
        e.kind === 'gates'
          ? 4 + Math.min(3, Math.floor(t * 4))
          : e.kind === 'grip'
            ? [4, 5, 6, 7][Math.min(3, Math.floor(t * 4))]
            : e.kind === 'cushion'
              ? [15, 15, 14, 15][Math.min(3, Math.floor(t * 4))]
              : e.kind === 'eruption'
                ? [12, 12, 14, 15][Math.min(3, Math.floor(t * 4))]
                : e.kind === 'impact'
                  ? [11, 11, 14, 15][Math.min(3, Math.floor(t * 4))]
                  : [7, 14, 14, 15][Math.min(3, Math.floor(t * 4))];
      e.image
        .setFrame(frame)
        .setDisplaySize(e.size, e.size)
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
  updateStory(_dt: number) {
    const story = this.story!;
    let t = this.clock - this.storyAt;
    if ((story === 'gates' || story === 'ending') && t < 2500) {
      this.storyLotus(t, story === 'ending', _dt);
      return;
    }
    if (story === 'gates' || story === 'ending') {
      t -= 2500;
      if (!this.storySettled) {
        this.storySettled = true;
        this.storyFrom = { lx: this.lee.x, gx: this.gaara.x };
        this.gaara.setAlpha(1);
        this.shield.setVisible(false);
      }
    }
    this.wrap.setVisible(false);
    this.graphics.clear();
    this.warning.setVisible(false);
    this.shield.setVisible(false);
    this.lee.clearTint();
    this.gaara.clearTint();
    const lerp = Phaser.Math.Linear;
    if (story === 'opening') {
      const p = clamp(t / 3200, 0, 1);
      this.lee.setPosition(lerp(-60, 390, p), FLOOR);
      pose(this.lee, 'lee', p < 1 ? 'run' : 'idle', t, 1);
      this.gaara.setAlpha(clamp((t - 1200) / 1300, 0, 1));
      pose(this.gaara, 'gaara', 'idle', t, -1);
      if (t < 3000) {
        this.say('HAYATE GEKKO', 'The next match: Rock Lee versus Gaara.');
        if (t % 240 < _dt) this.effect('sand', 1010, FLOOR - 35, 180, 900);
      } else if (t < 7500)
        this.say(
          'ROCK LEE',
          'I want to prove that hard work can make a splendid ninja.',
        );
      else if (t < 11000)
        this.say('MIGHT GUY', 'Show them your strength, Lee!');
      else if (t < 14500) this.say('GAARA', 'Come.');
      else this.finishStory();
    } else if (story === 'weights') {
      const lx = this.storyFrom.lx,
        gx = this.storyFrom.gx;
      this.lee.setPosition(lx, FLOOR);
      this.gaara.setPosition(gx, FLOOR);
      pose(this.gaara, 'gaara', 'idle', t, gx > lx ? -1 : 1);
      pose(
        this.lee,
        'lee',
        t < 2300 ? 'block' : t < 4300 ? 'land' : 'idle',
        t,
        gx > lx ? 1 : -1,
      );
      if (t < 2400) this.say('MIGHT GUY', 'Lee. Take them off.');
      else if (t < 5500) {
        this.say('ROCK LEE', 'Thank you, Guy-sensei!');
        const a = clamp((t - 2400) / 900, 0, 1);
        this.graphics.fillStyle(0xb7b2a0, 1);
        for (const off of [-37, 37])
          this.graphics.fillRoundedRect(
            lx + off - 10,
            FLOOR - 70 + a * 65,
            20,
            12,
            2,
          );
        if (t > 3300 && t - _dt <= 3300) {
          this.effect('sand', lx - 37, FLOOR, 250, 1100);
          this.effect('sand', lx + 37, FLOOR, 250, 1100);
          if (!bridge.settings().reducedShake)
            this.cameras.main.shake(180, 0.006);
          this.sounds.strike('heavy', 0.5);
        }
      } else {
        this.say('KAKASHI', 'That speed...');
        const p = clamp((t - 5500) / 1800, 0, 1);
        this.lee.x = lerp(lx, clamp(gx - 130, LEFT + 40, RIGHT - 200), p);
        pose(this.lee, 'lee', 'run', t, gx > lx ? 1 : -1);
      }
      if (t > 8000) this.finishStory();
    } else if (story === 'gates') {
      this.gaara.setPosition(this.storyFrom.gx, FLOOR);
      pose(
        this.gaara,
        'gaara',
        'hurt',
        t,
        this.storyFrom.gx > this.storyFrom.lx ? -1 : 1,
      );
      this.lee.setPosition(this.storyFrom.lx, FLOOR);
      pose(
        this.lee,
        'lee',
        t < 2800 ? 'hurt' : 'ultimate',
        t,
        this.storyFrom.gx > this.storyFrom.lx ? 1 : -1,
        t > 2800,
      );
      if (t < 2600) this.say('GAARA', 'Only a shell of sand.');
      else if (t < 5300)
        this.say('MIGHT GUY', 'Lee... this is your ninja way.');
      else this.say('ROCK LEE', 'The Fifth Gate... open!');
      if (t > 2800 && t % 180 < _dt)
        this.effect('gates', this.lee.x, this.lee.y - 80, 250, 750);
      if (t > 8200) this.finishStory();
    } else {
      const lx = this.storyFrom.lx,
        gx = this.storyFrom.gx,
        dir = gx > lx ? 1 : -1;
      if (t < 2600) {
        pose(this.lee, 'lee', 'hurt', t, dir);
        pose(this.gaara, 'gaara', 'land', t, -dir);
        this.say('ROCK LEE', 'I gave it... everything.');
      } else if (t < 5700) {
        pose(this.gaara, 'gaara', 'cast', t, -dir);
        pose(this.lee, 'lee', 'guardbreak', t, dir);
        if (t % 350 < _dt) {
          this.effect('grip', lx - 12, FLOOR - 20, 78, 420);
          this.effect('grip', lx - 17, FLOOR - 87, 70, 420);
        }
        this.say('MIGHT GUY', 'Enough!');
      } else if (t < 8000) {
        this.guy
          .setVisible(true)
          .setPosition(
            lerp(lx - dir * 450, lx + dir * 55, clamp((t - 5700) / 1000, 0, 1)),
            FLOOR,
          );
        pose(this.guy, 'guy', 'run', t, dir);
        pose(this.lee, 'lee', 'defeat', t, dir);
        if (t > 6800 && t - _dt <= 6800)
          this.effect('impact', lx + dir * 55, FLOOR - 60, 190, 800);
        this.say('HAYATE GEKKO', 'Winner: Gaara.');
      } else {
        pose(this.gaara, 'gaara', 'idle', t, -dir);
        this.guy.setPosition(lx + dir * 55, FLOOR);
        pose(this.guy, 'guy', 'land', t, -dir);
        pose(this.lee, 'lee', 'idle', t, dir);
        this.lee.setAlpha(0.8);
        this.say(
          'MIGHT GUY',
          'Even unconscious, you are still standing. You have already proved it, Lee.',
        );
      }
      if (t > 13500) this.finishStory();
    }
  }
  storyLotus(age: number, gated: boolean, dt: number) {
    const from = this.storyFrom,
      dir = from.gx > from.lx ? 1 : -1;
    this.graphics.clear();
    this.shield.setVisible(false);
    this.say(
      'ROCK LEE',
      gated ? 'This is everything I have! Reverse Lotus!' : 'Primary Lotus!',
    );
    if (age < 450) {
      const p = age / 450;
      this.lee.setPosition(
        Phaser.Math.Linear(from.lx, from.gx - dir * 45, p),
        FLOOR,
      );
      pose(this.lee, 'lee', 'run', age, dir, gated);
      pose(this.gaara, 'gaara', 'hurt', age, -dir);
    } else if (age < 1400) {
      const p = (age - 450) / 950,
        y = FLOOR - Math.sin((p * Math.PI) / 2) * 205;
      this.gaara.setPosition(from.gx, y);
      const side = gated && Math.floor(p * 5) % 2 ? -dir : dir;
      this.lee.setPosition(from.gx - side * 55, y + 5);
      pose(this.lee, 'lee', 'aerial', age, side, gated);
      pose(this.gaara, 'gaara', 'hurt', age, -side);
      this.wrap
        .setVisible(true)
        .setPosition(from.gx, y - 65)
        .setFrame(2);
      if (gated && age % 190 < dt) {
        this.effect('impact', from.gx, y - 65, 90, 220);
        this.effect('gates', this.lee.x, this.lee.y - 60, 160, 350);
        this.sounds.strike('palm', 0.25);
      }
    } else if (age < 1800) {
      const p = (age - 1400) / 400;
      this.gaara.setPosition(from.gx, FLOOR - 205 * (1 - p));
      this.lee.setPosition(from.gx - dir * 40, FLOOR - 205 * (1 - p));
      this.wrap.setPosition(from.gx, this.gaara.y - 65);
      if (gated && age % 140 < dt)
        this.effect('cushion', from.gx, FLOOR - 15, 280, 600);
    } else {
      this.wrap.setVisible(false);
      if (!this.storyContact) {
        this.storyContact = true;
        this.effect(gated ? 'cushion' : 'sand', from.gx, FLOOR - 35, 330, 900);
        this.sounds.strike('heavy', 0.5);
        if (!bridge.settings().reducedShake)
          this.cameras.main.shake(120, 0.005);
        this.lee.setPosition(clamp(from.gx - dir * 145, LEFT, RIGHT), FLOOR);
        this.gaara
          .setPosition(
            gated
              ? from.gx
              : clamp(this.lee.x - dir * 170, LEFT + 30, RIGHT - 30),
            FLOOR,
          )
          .setAlpha(gated ? 1 : 0);
      }
      pose(this.lee, 'lee', gated ? 'guardbreak' : 'land', age, dir, gated);
      pose(this.gaara, 'gaara', 'land', age, -dir);
      if (!gated) {
        this.shield
          .setVisible(true)
          .setPosition(from.gx, FLOOR - 60)
          .setAlpha(Math.max(0, 1 - (age - 1800) / 700));
        this.gaara.setAlpha(clamp((age - 1950) / 450, 0, 1));
      }
    }
  }
  finishStory() {
    const story = this.story;
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
    const elapsed = this.duel.elapsed,
      parries = this.duel.parries;
    const lx = clamp(this.lee.x, LEFT, RIGHT),
      gx = clamp(this.gaara.x, LEFT, RIGHT);
    this.phase = next;
    this.duel.reset(next);
    this.duel.elapsed = elapsed;
    this.duel.parries = parries;
    this.duel.lee.x = lx;
    this.duel.gaara.x = gx;
    this.bodyPhysics.reset(lx, FLOOR);
    this.bodyPhysics.setVelocity(0, 0);
    this.lee.setAlpha(1);
    this.gaara.setAlpha(1);
    this.lastCue = -1;
    this.physics.world.resume();
    bridge.checkpoint(next);
    bridge.patch({ screen: 'playing', phase: next });
    this.publish();
  }
  beginUltimate() {
    const d = this.duel;
    d.lee.ultimate = 0;
    d.lee.action = null;
    d.cancelAttack();
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
    const age = this.clock - this.ultimateAt,
      t = age / 2000,
      u = this.ultFrom,
      dir = u.gx > u.lx ? 1 : -1;
    this.duel.elapsed += dt;
    this.graphics.clear();
    this.warning.setVisible(false);
    this.shield.setVisible(false);
    if (t < 0.25) {
      pose(this.lee, 'lee', 'ultimate', age, dir, this.phase === 'gates');
      if (age % 100 < dt)
        this.effect('gates', this.lee.x, this.lee.y - 80, 220, 650);
    } else if (t < 0.48) {
      const p = (t - 0.25) / 0.23;
      this.lee.setPosition(
        Phaser.Math.Linear(u.lx, u.gx - dir * 50, p),
        Phaser.Math.Linear(u.ly, FLOOR - 50, p),
      );
      pose(this.lee, 'lee', 'run', age, dir);
      this.effect('gates', this.lee.x - dir * 35, this.lee.y - 55, 95, 240);
    } else if (t < 0.74) {
      const p = (t - 0.48) / 0.26;
      const y = FLOOR - 180 * Math.sin((p * Math.PI) / 2);
      this.gaara.setPosition(u.gx, y);
      const beat = Math.min(3, Math.floor(p * 4)),
        side = this.phase === 'gates' && beat % 2 ? -dir : dir;
      this.lee.setPosition(u.gx - side * 45, y + 10);
      pose(this.lee, 'lee', 'aerial', age, side, this.phase === 'gates');
      if (this.phase === 'gates' && beat !== this.ultVisualBeat) {
        this.ultVisualBeat = beat;
        this.effect('impact', u.gx, y - 65, 90, 180);
        this.sounds.strike('palm', 0.25);
      }
      pose(this.gaara, 'gaara', 'hurt', age, -dir);
      this.wrap
        .setVisible(true)
        .setPosition(u.gx, y - 63)
        .setFrame(2);
    } else if (t < 0.88) {
      const p = (t - 0.74) / 0.14;
      this.gaara.setPosition(u.gx, FLOOR - 180 * (1 - p));
      this.lee.setPosition(u.gx - dir * 35, FLOOR - 180 * (1 - p));
      this.wrap.setPosition(u.gx, this.gaara.y - 63);
      this.effect('gates', u.gx, this.gaara.y - 70, 160, 250);
    } else {
      this.wrap.setVisible(false);
      if (!this.ultContact) {
        this.ultContact = true;
        this.duel.ultimateImpact();
        this.effect('impact', u.gx, FLOOR - 30, 370, 900);
        this.effect('sand', u.gx, FLOOR - 10, 480, 900);
        this.sounds.strike('heavy', 0.7);
        if (!bridge.settings().reducedShake)
          this.cameras.main.shake(130, 0.006);
      }
      this.lee.setPosition(clamp(u.gx - dir * 95, LEFT, RIGHT), FLOOR);
      this.gaara.setPosition(u.gx, FLOOR);
      pose(this.lee, 'lee', 'land', age, dir);
      pose(this.gaara, 'gaara', 'hurt', age, -dir);
    }
    if (age >= 2000) {
      this.wrap.setVisible(false);
      this.ultimateAt = -1;
      this.duel.lee.x = this.lee.x;
      this.duel.lee.y = FLOOR;
      this.duel.gaara.y = FLOOR;
      this.bodyPhysics.reset(this.lee.x, FLOOR);
      this.bodyPhysics.setVelocity(0, 0);
      this.physics.world.resume();
      this.sounds.duck(false);
      bridge.patch({ ultimateName: '' });
      if (this.duel.gaara.health <= 0)
        this.startStory(
          this.phase === 'shield'
            ? 'weights'
            : this.phase === 'speed'
              ? 'gates'
              : 'ending',
        );
    }
  }
}
export function mountChunin(parent: HTMLElement) {
  bridge.load();
  const inputs = new BattleInput(bridge),
    sounds = new RecordedAudio(bridge.settings),
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
