import * as Phaser from 'phaser';
import type {PlayerId} from './combat-core';
import {poseBattle, namedArt} from './battle-art';

export const ULTIMATE_TIMING = {cutIn: 600, first: 880, second: 1100, impact: 1330, end: 1700} as const;
const palette: Record<PlayerId, number> = {kakashi: 0x85eaff, naruto: 0xff7746, sasuke: 0xf76563, sakura: 0xfba5cb};

/** Presentation clock is separate from combat: incoming attacks freeze for 1.7s. */
export class UltimateBurst {
  age = 0; impacted = false; private beat = 0; private objects: Phaser.GameObjects.GameObject[] = [];
  private dim: Phaser.GameObjects.Rectangle; private card: Phaser.GameObjects.Image; private title: Phaser.GameObjects.Text;
  private line: Phaser.GameObjects.Text; private aura: Phaser.GameObjects.Image; private flash: Phaser.GameObjects.Rectangle;
  private echoes: Phaser.GameObjects.Sprite[] = []; private sparks: Phaser.GameObjects.Image[] = [];
  readonly color: number;
  constructor(private scene: Phaser.Scene, readonly character: PlayerId, readonly name: string, readonly fromX: number, readonly toX: number, readonly floor: number, readonly facing: -1 | 1,
    private sound: (beat: 'charge' | 'strike' | 'finish') => void) {
    const cloneBarrage = character === 'naruto' && name === 'Clone Barrage';
    this.color = cloneBarrage ? 0x89ddff : palette[character];
    const keep = <T extends Phaser.GameObjects.GameObject>(object: T) => {this.objects.push(object); return object;};
    this.dim = keep(scene.add.rectangle(640, 360, 1500, 900, 0x020a15, .68).setScrollFactor(0).setDepth(18));
    for (const y of [27, 696]) keep(scene.add.rectangle(640, y, 1500, 56, 0x020713, 1).setScrollFactor(0).setDepth(29));
    this.card = keep(scene.add.image(710, 310, 'v3-ultimates', character).setDisplaySize(1140, 440).setScrollFactor(0).setDepth(22));
    this.line = keep(scene.add.text(78, 224, 'ULTIMATE TECHNIQUE', {fontFamily:'Arial',fontSize:'17px',color:'#edf7ff',letterSpacing:5}).setScrollFactor(0).setDepth(24));
    this.title = keep(scene.add.text(72, 263, name.toUpperCase(), {fontFamily:'Impact, Arial Black, sans-serif',fontSize:'55px',color:'#ffffff',stroke:'#071724',strokeThickness:7}).setScrollFactor(0).setDepth(24));
    this.title.setWordWrapWidth(700);
    this.aura = keep(namedArt(scene,'effects',character === 'kakashi' ? 'lightning' : cloneBarrage ? 'smoke' : character === 'naruto' ? 'chakra-aura' : 'parry',fromX,floor-74,200).setDepth(16).setTint(this.color));
    this.flash = keep(scene.add.rectangle(640,360,1500,900,this.color,0).setScrollFactor(0).setDepth(27));
    for(let i=0;i<3;i++) {
      const echo=keep(scene.add.sprite(fromX,floor,`${character}-melee`,'0').setDepth(15).setAlpha(0)); this.echoes.push(echo);
      const spark=keep(namedArt(scene,'effects',character==='kakashi'?'lightning':'parry',toX,floor-75,200).setDepth(17).setAlpha(0).setTint(this.color)); this.sparks.push(spark);
    }
    sound('charge');
  }
  update(dt: number) {
    this.age += dt; const age=this.age;
    const entrance=Phaser.Math.Easing.Cubic.Out(Math.min(1,age/180));
    this.card.x=710+(1-entrance)*160;
    const cutAlpha=age<600?1:Math.max(0,1-(age-600)/200);
    this.card.setAlpha(cutAlpha); this.line.setAlpha(cutAlpha); this.title.setAlpha(cutAlpha);
    this.dim.setAlpha(age<600?.68:.38*(1-Math.max(0,(age-1400)/300)));
    const rush=Phaser.Math.Easing.Cubic.InOut(Phaser.Math.Clamp((age-600)/330,0,1));
    const x=Phaser.Math.Linear(this.fromX,this.toX-this.facing*65,rush);
    this.aura.setPosition(x+this.facing*30,this.floor-78).setAlpha(age>1450?Math.max(0,1-(age-1450)/250):.8)
      .setDisplaySize(this.character==='kakashi'?260:220,220+Math.sin(age/28)*12).setFlipX(this.facing<0);
    for(let i=0;i<3;i++){
      const echo=this.echoes[i], active=age>650+i*110&&age<1460;
      poseBattle(echo,this.character,(['light1','light2','light3'] as const)[i],Math.max(0,age-710-i*140),this.facing,470);
      echo.setPosition(x-this.facing*(45+i*43),this.floor-(this.character==='naruto'&&i===1?42:0)).setAlpha(active?(this.character==='naruto'?.85:.35)-i*.06:0);
      if(this.character!=='naruto')echo.setTint(this.color);
      const t=age-[ULTIMATE_TIMING.first,ULTIMATE_TIMING.second,ULTIMATE_TIMING.impact][i];
      const width=(i===2?340:190)*(1+Math.max(0,t)/600);
      this.sparks[i].setPosition(this.toX+this.facing*i*12,this.floor-75+i*9).setAlpha(t>=0&&t<240?1-t/240:0).setDisplaySize(width,width*.85);
    }
    const beats=[ULTIMATE_TIMING.first,ULTIMATE_TIMING.second,ULTIMATE_TIMING.impact];
    if(this.beat<3&&age>=beats[this.beat]) {this.sound(this.beat===2?'finish':'strike');this.beat++;}
    const final=age-ULTIMATE_TIMING.impact;
    this.flash.setAlpha(final>=0&&final<130?.35*(1-final/130):0);
    return {x,impact:age>=ULTIMATE_TIMING.impact&&!this.impacted,complete:age>=ULTIMATE_TIMING.end};
  }
  destroy(){for(const object of this.objects)object.destroy();this.objects=[];}
}
