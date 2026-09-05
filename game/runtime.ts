import * as Phaser from 'phaser';
import {bridge,type Checkpoint,type Command} from './bridge';
import {preloadArt,registerArt,pose,prop} from './art';
import {GameScene} from './gameplay';
import {Inputs} from './input';
import {Soundscape} from './audio';
import {registerTools} from './webmcp';
class LoadingScene extends Phaser.Scene {
 failed=false;
 constructor(){super('Loading');}
 preload(){preloadArt(this);this.load.on('progress',(p:number)=>bridge.patch({progress:p}));this.load.on('loaderror',()=>{this.failed=true;bridge.patch({screen:'error',error:'An artwork file could not load. Reload to try again.'});});}
 create(){if(this.failed)return;registerArt(this);this.scene.launch('HUD');this.scene.start('Title');}
}
class TitleScene extends Phaser.Scene {
 constructor(){super('Title');}
 create(){
  this.add.image(640,360,'forest').setDisplaySize(1280,732).setTint(0x9abbc9);
  const ghost=this.add.sprite(825,620,'naruto','12').setAlpha(.17).setScale(1.34);pose(ghost,'naruto',12);
  const hero=this.add.sprite(1020,624,'naruto','0').setScale(1.58);pose(hero,'naruto',0);
  this.tweens.add({targets:[hero,ghost],y:'-=5',duration:1800,yoyo:true,repeat:-1,ease:'Sine.inOut'});
  for(let i=0;i<15;i++){const mote=prop(this,14,Phaser.Math.Between(610,1250),Phaser.Math.Between(80,680),Phaser.Math.Between(4,10)).setAlpha(.25);this.tweens.add({targets:mote,y:'-=120',alpha:0,duration:Phaser.Math.Between(3500,7000),repeat:-1});}
  bridge.patch({screen:'title',boss:null,hint:''});
 }
}
class HudScene extends Phaser.Scene{
 constructor(private inputs:Inputs,private sounds:Soundscape){super('HUD');}
 update(){if(bridge.get().screen!=='playing'){this.inputs.poll();this.inputs.endFrame();}this.sounds.sync(bridge.get().screen==='playing');}
}
class ResultsScene extends Phaser.Scene{
 constructor(){super('Results');}
 create(){for(let i=0;i<18;i++){const mote=prop(this,14,Phaser.Math.Between(0,1280),Phaser.Math.Between(0,720),Phaser.Math.Between(5,12)).setAlpha(.32);this.tweens.add({targets:mote,y:'-=180',alpha:0,duration:Phaser.Math.Between(2500,6000),repeat:-1});}}
}
export function mountGame(parent:HTMLElement){
 bridge.reset();bridge.load();const inputs=new Inputs(),sounds=new Soundscape();
 const game=new Phaser.Game({type:Phaser.AUTO,parent,width:1280,height:720,backgroundColor:'#061420',render:{antialias:true,roundPixels:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{x:0,y:1800},debug:false}},scene:[new LoadingScene(),new TitleScene(),new GameScene(),new HudScene(inputs,sounds),new ResultsScene()],audio:{noAudio:true},callbacks:{postBoot:g=>{g.canvas.tabIndex=0;g.canvas.setAttribute('aria-label','Naruto game canvas');}}});
 const play=(checkpoint:Checkpoint,elapsed=0)=>{sounds.unlock();game.scene.stop('Title');game.scene.stop('Gameplay');game.scene.stop('Results');game.scene.start('Gameplay',{checkpoint,elapsed,inputs,soundscape:sounds});};
 bridge.handle((command:Command)=>{
  if(command==='start'){bridge.checkpoint('forest');play('forest');}
  else if(command==='continue'||command==='retry')play(bridge.get().checkpoint,bridge.get().elapsed);
  else if(command==='title'){inputs.clear();game.scene.stop('Gameplay');game.scene.stop('Results');game.scene.start('Title');}
  else if(game.scene.getScene('Gameplay'))(game.scene.getScene('Gameplay') as GameScene).command(command);
 });
 const unregister=registerTools(inputs,()=>game.scene.getScene('Gameplay') as GameScene|undefined);
 game.events.once('destroy',()=>{unregister();inputs.destroy();sounds.destroy();bridge.handle(()=>{});});
 return game;
}
