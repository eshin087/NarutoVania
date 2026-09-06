import type * as Phaser from 'phaser';
import {mirrorLayout} from './presentation-v15';
import {poseBattle} from './battle-art';
export function mirrorVisual(scene:Phaser.Scene,x:number,y:number,floor:number,kind:'prison'|'crossfire',depth=2){
 const layout=mirrorLayout(x,y,floor,kind);
 const image=scene.add.image(x,layout.y,'v14-ice','15').setDisplaySize(layout.width,layout.height).setDepth(depth).setAlpha(.82);
 const reflection=scene.add.sprite(x,layout.feet,'haku-locomotion','6').setDepth(depth+.1).setAlpha(.82);
 poseBattle(reflection,'haku','idle',0,x>830?-1:1);
 scene.tweens.addCounter({from:0,to:3,duration:400,onUpdate:t=>image.setFrame(String(12+Math.min(3,Math.floor(t.getValue()||0))))});
 return{image,reflection,layout};
}
