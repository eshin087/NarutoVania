import * as Phaser from 'phaser';
import {CHARACTER} from './chapter';
import type {CharacterId} from './combat-core';
import type {CinemaCue} from './story-director';

/** A bounded screen-space bubble follows the speaker; moment art has its own fade. */
export class CinemaPresentation {
  private bubble: Phaser.GameObjects.Container;
  private ink: Phaser.GameObjects.Graphics;
  private name: Phaser.GameObjects.Text;
  private line: Phaser.GameObjects.Text;
  private caption: Phaser.GameObjects.Text;
  private panel: Phaser.GameObjects.Image;
  private panelMat: Phaser.GameObjects.Rectangle;
  private until = 0; private captionUntil = 0; private panelUntil = 0; private panelBorn = 0;
  private speaker?: CinemaCue['actor'];
  constructor(private scene: Phaser.Scene) {
    this.ink = scene.add.graphics();
    this.name = scene.add.text(20, 12, '', {fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: '#56717b'});
    this.line = scene.add.text(20, 36, '', {fontFamily: 'Arial', fontSize: '23px', color: '#102d38', wordWrap: {width: 390}, lineSpacing: 5});
    this.bubble = scene.add.container(0, 0, [this.ink, this.name, this.line]).setScrollFactor(0).setDepth(101).setVisible(false);
    this.caption = scene.add.text(640, 113, '', {fontFamily: 'Arial', fontSize: '17px', color: '#ffffff', backgroundColor: '#0b202ee8', padding: {x: 20, y: 10}}).setOrigin(.5).setScrollFactor(0).setDepth(102).setVisible(false);
    this.panelMat = scene.add.rectangle(640, 340, 980, 562, 0x06141d, .98).setStrokeStyle(4, 0xf0e6cd).setScrollFactor(0).setDepth(99).setVisible(false);
    this.panel = scene.add.image(640, 340, 'v5-moments', '0').setDisplaySize(960, 540).setScrollFactor(0).setDepth(100).setVisible(false);
  }
  cue(cue: CinemaCue, now: number) {
    if (cue.speech) {
      this.speaker = cue.actor; this.until = now + (cue.hold || 3000);
      const names: Record<string, string> = {prisoner: 'Kakashi', tazuna: 'Tazuna', gato: 'Gato'};
      this.name.setText(CHARACTER[cue.actor as CharacterId]?.short || names[cue.actor || ''] || '');
      this.line.setText(cue.speech); this.bubble.setVisible(true);
    }
    if (cue.caption) {this.caption.setText(cue.caption).setVisible(true); this.captionUntil = now + (cue.hold || 3000);}
    if(cue.manga!==undefined){this.panel.setTexture(`manga-${cue.manga}`).setDisplaySize(960,540).setVisible(true);this.panelMat.setVisible(true);this.panelBorn=now;this.panelUntil=Infinity;this.until=Infinity;}
    if (cue.moment !== undefined) {this.panel.setTexture('v5-moments',String(cue.moment)).setVisible(true); this.panelMat.setVisible(true); this.panelBorn = now; this.panelUntil = now + (cue.hold || 3000);}
  }
  dismissPanel(){this.panelUntil=0;this.until=0;this.panel.setVisible(false);this.panelMat.setVisible(false);this.bubble.setVisible(false);}
  update(now: number, position: (id: CinemaCue['actor']) => {x: number; y: number} | undefined) {
    const panelActive = now < this.panelUntil;
    this.panel.setVisible(panelActive); this.panelMat.setVisible(panelActive);
    if (panelActive) {const alpha = Math.min(1, (now - this.panelBorn) / 180, (this.panelUntil - now) / 200); this.panel.setAlpha(alpha);this.panel.setScale(960/this.panel.width*(1+Math.min(.012,(now-this.panelBorn)/400000))); this.panelMat.setAlpha(alpha);}
    this.caption.setVisible(now < this.captionUntil);
    this.bubble.setVisible(now < this.until);
    if (now >= this.until) return;
    const actor = position(this.speaker), sx = (actor?.x ?? 640) - this.scene.cameras.main.scrollX;
    const width = 430, height = this.line.height + 57;
    const x = Phaser.Math.Clamp(panelActive ? 640 - width / 2 : sx - width / 2, 28, 1252 - width);
    const y = panelActive ? 602 - height : Phaser.Math.Clamp((actor?.y ?? 590) - 205 - height, 160, 450);
    this.bubble.setPosition(x, y); this.ink.clear().fillStyle(0xfaf7ed, .98).lineStyle(2, 0x153c4a, 1);
    this.ink.fillRoundedRect(0, 0, width, height, 12); this.ink.strokeRoundedRect(0, 0, width, height, 12);
    if (!panelActive) {const tail = Phaser.Math.Clamp(sx - x, 30, width - 30); this.ink.fillTriangle(tail - 12, height - 2, tail + 12, height - 2, tail, height + 20);}
  }
}
