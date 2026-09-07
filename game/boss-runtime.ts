import {AnimationPreview,PREVIEWS} from './animation-preview';
import type {BarrageId} from './barrages';
import {DEBUG_ENTRIES,type StorySceneId} from './scene-catalog';
import * as Phaser from 'phaser';
import {bossBridge as bridge, type Command} from './boss-bridge';
import {preloadBattleArt, registerBattleArt, poseBattle} from './battle-art';
import {BossGameScene} from './boss-gameplay';
import {BattleInput} from './battle-input';
import {RecordedAudio} from './recorded-audio';
import {registerBossTools} from './boss-webmcp';
import type {StoryPhaseId} from './chapter';

class LoadingScene extends Phaser.Scene {
  failed = false;
  constructor() {super('Loading');}
  preload() {
    preloadBattleArt(this); this.load.on('progress', (progress: number) => bridge.patch({progress}));
    this.load.on('loaderror', (file: Phaser.Loader.File) => {this.failed = true; bridge.patch({screen: 'error', error: `An artwork asset could not load (${file.key}). Reload to try again.`});});
  }
  create() {if (this.failed) return; registerBattleArt(this); this.scene.launch('HUD'); this.scene.start('Title');}
}
class TitleScene extends Phaser.Scene {
  constructor() {super('Title');}
  create() {
    this.add.image(640, 350, 'v2-lakeside-background').setDisplaySize(1320, 755).setTint(0x95b4bd);
    this.add.image(640, 622, 'v2-lakeside-ground').setDisplaySize(1320, 180);
    const team = [{id: 'kakashi' as const, x: 920, y: 575, scale: 1.67}, {id: 'sasuke' as const, x: 1080, y: 586, scale: 1.62}, {id: 'sakura' as const, x: 1180, y: 586, scale: 1.59}, {id: 'naruto' as const, x: 810, y: 590, scale: 1.8}];
    for (const a of team) {const sprite = this.add.sprite(a.x, a.y, `${a.id}-locomotion`, '6'); poseBattle(sprite, a.id, 'idle', 0, -1); sprite.setScale(sprite.scaleX * a.scale); this.time.addEvent({delay:200,loop:true,callback:()=>{poseBattle(sprite,a.id,'idle',this.time.now,-1);sprite.setScale(sprite.scaleX*a.scale);}});}
    bridge.patch({screen: 'title', boss: null,cinematic:'',panelWaiting:false,canAdvance:false,objective:'',phaseProgress:0});
  }
}
class HudScene extends Phaser.Scene {
  constructor(private inputs: BattleInput, private sounds: RecordedAudio) {super('HUD');}
  update() {
    const screen = bridge.get().screen;
    if (screen === 'title' || screen === 'victory' || screen==='preview') {this.inputs.poll();this.inputs.endFrame();}
    this.sounds.sync(['playing', 'intro', 'victory','preview'].includes(screen));
  }
}
class ResultsScene extends Phaser.Scene {constructor() {super('Results');}}
export function mountBossGame(parent: HTMLElement) {
  bridge.reset(); bridge.load(); const inputs = new BattleInput(), sounds = new RecordedAudio(bridge.settings);
  const game = new Phaser.Game({type: Phaser.AUTO, parent, width: 1280, height: 720, backgroundColor: '#07161e',
    render: {antialias: true, roundPixels: false}, scale: {mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH},
    physics: {default: 'arcade', arcade: {gravity: {x: 0, y: 1800}, debug: false}},
    scene: [new LoadingScene(), new TitleScene(), new BossGameScene(), new AnimationPreview(), new HudScene(inputs, sounds), new ResultsScene()],
    audio: {noAudio: true}, callbacks: {postBoot: g => {g.canvas.tabIndex = 0; g.canvas.setAttribute('aria-label', 'Naruto story boss rush game canvas');}}});
  const play = (phase: StoryPhaseId, retry = false, sceneId?:StorySceneId,barrageId?:BarrageId,barrageVariant?:0|1) => {
    void sounds.unlock(); sounds.reset(); if(bridge.get().debugEntry)bridge.checkpoint(phase);const snapshot = bridge.get(); inputs.clear();
    game.scene.stop('AnimationPreview');game.scene.stop('Title'); game.scene.stop('BossGameplay'); game.scene.stop('Results');
    game.scene.start('BossGameplay', {checkpoint: phase,sceneId,barrageId,barrageVariant, inputs, soundscape: sounds, elapsed: retry ? snapshot.elapsed : 0,
      retries: retry ? snapshot.retries + 1 : 0, parries: retry ? snapshot.parries : 0, viewIntro: !snapshot.debugEntry&&!snapshot.seen.includes(phase)});
  };
  const preview=(id:string)=>{const entry=PREVIEWS.find(p=>p.id===id);if(!entry)return false;bridge.beginDebug(id);void sounds.unlock();sounds.reset();inputs.clear();game.scene.stop('Title');game.scene.stop('BossGameplay');game.scene.stop('AnimationPreview');game.scene.start('AnimationPreview',{preview:entry.spec,sounds});return true;};
  bridge.handle((command: Command) => {
    if(game.scene.isActive('AnimationPreview')&&command==='pause'){bridge.patch({screen:'paused'});sounds.sync(false);return;}
    if(game.scene.isActive('AnimationPreview')&&command==='resume'){bridge.patch({screen:'preview'});sounds.sync(true);return;}

    if(typeof command==='object'){
      if(command.type==='audition'){void sounds.audition(command.id);return;}
      if(preview(command.entry))return;
      const entry=DEBUG_ENTRIES.find(e=>e.id===command.entry);if(!entry)return;bridge.beginDebug(entry.id);play(entry.phase,false,entry.scene,entry.barrage,entry.variant);return;
    }
    if(command==='debug-replay'){if(preview(bridge.get().debugEntry||''))return;const entry=DEBUG_ENTRIES.find(e=>e.id===bridge.get().debugEntry);if(entry)play(entry.phase,false,entry.scene,entry.barrage,entry.variant);return;}
    if(command==='debug-exit'){bridge.endDebug();inputs.clear();sounds.stopEffects();game.scene.stop('AnimationPreview');game.scene.stop('BossGameplay');game.scene.start('Title');return;}
    if (command === 'start') {bridge.newRun(); play('mist');}
    else if (command === 'continue') play(bridge.get().checkpoint);
    else if (command === 'retry') {const entry=DEBUG_ENTRIES.find(e=>e.id===bridge.get().debugEntry);play(bridge.get().checkpoint,true,entry?.scene,entry?.barrage,entry?.variant);}
    else if (command === 'title') {bridge.endDebug();inputs.clear(); sounds.sync(false); game.scene.stop('AnimationPreview');game.scene.stop('BossGameplay'); game.scene.stop('Results'); game.scene.start('Title');}
    else (game.scene.getScene('BossGameplay') as BossGameScene)?.command(command);
  });
  const unregister = registerBossTools(inputs, () => game.scene.getScene('BossGameplay') as BossGameScene | undefined);
  const resizing = new ResizeObserver(() => game.scale?.refresh()); resizing.observe(parent);
  game.events.once('destroy', () => {resizing.disconnect(); unregister(); inputs.destroy(); sounds.destroy(); bridge.handle(() => {});});
  return game;
}
