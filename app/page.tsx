'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Volume2,VolumeX,Maximize,Pause,ArrowRight,Gamepad2,Keyboard,Settings2,X} from 'lucide-react';
import {bridge,type Command,type Snapshot} from '@/game/bridge';
import atlas from '@/game/assets.json';

const actions=[['J','X','MELEE','naruto',8],['K','Y','SHURIKEN','props',3],['Q','LB','CLONES','naruto',12],['L','B','SUBSTITUTE','props',2],['R','RB','RASENGAN','props',6]] as const;
function ArtIcon({type,frame}:{type:keyof typeof atlas;frame:number}){
 const f=atlas[type].frames[frame], size=48,scale=Math.min(size/f.w,size/f.h);
 const file=type==='props'?'props-effects.png':`${type}-sprites.png`;
 return <span className="art-icon" style={{width:f.w*scale,height:f.h*scale,backgroundImage:`url(/art/${file})`,backgroundSize:`${atlas[type].width*scale}px ${atlas[type].height*scale}px`,backgroundPosition:`-${f.x*scale}px -${f.y*scale}px`}}/>;
}
export default function Home(){
 const host=useRef<HTMLDivElement>(null);
 const [state,setState]=useState<Snapshot>(bridge.get());
 const [controls,setControls]=useState(false);
 const [muted,setMuted]=useState(false);
 const [reduced,setReduced]=useState(false);
 const [helpPaused,setHelpPaused]=useState(false);
 useEffect(()=>{
  const unsubscribe=bridge.subscribe(()=>setState({...bridge.get()}));let cancelled=false;let game:{destroy:(remove:boolean)=>void}|undefined;
  import('@/game/runtime').then(({mountGame})=>{if(!cancelled&&host.current){game=mountGame(host.current);setMuted(bridge.settings().muted);setReduced(bridge.settings().reducedShake);}}).catch(()=>bridge.patch({screen:'error',error:'The game could not start. Please reload this page.'}));
  return()=>{cancelled=true;unsubscribe();game?.destroy(true);};
 },[]);
 const command=(c:Command)=>{bridge.command(c);host.current?.querySelector('canvas')?.focus();};
 const showControls=()=>{if(state.screen==='playing'){bridge.command('pause');setHelpPaused(true);}setControls(true);};
 const closeControls=()=>{setControls(false);if(helpPaused){bridge.command('resume');setHelpPaused(false);}};
 const toggleMute=()=>{bridge.setSettings({muted:!muted});setMuted(!muted);};
 const fullscreen=()=>{const el=document.querySelector('.game-frame');if(!document.fullscreenElement)void el?.requestFullscreen().catch(()=>{});else void document.exitFullscreen();};
 const active=['playing','paused','intro','dead'].includes(state.screen);
 const time=`${Math.floor(state.elapsed/60).toString().padStart(2,'0')}:${Math.floor(state.elapsed%60).toString().padStart(2,'0')}`;
 return <main className="game-page">
  <header className="masthead"><button className="brand" aria-label="Narutovania home" onClick={()=>command('title')}><span className="brand-mark">忍</span><span>NARUTO<span className="brand-light">VANIA</span></span></button><div className="chapter-label"><span className="status-dot"/> CHAPTER 01 <span className="header-divider"/> LAND OF WAVES</div><div className="header-tools"><Button variant="ghost" size="icon" aria-label={muted?'Unmute sound':'Mute sound'} onClick={toggleMute}>{muted?<VolumeX/>:<Volume2/>}</Button><Button variant="ghost" size="icon" aria-label="Controls and settings" onClick={showControls}><Settings2/></Button><Button variant="ghost" size="icon" aria-label="Toggle fullscreen" onClick={fullscreen}><Maximize/></Button></div></header>
  <section className="game-frame" aria-label="Naruto action game">
   <div ref={host} className="canvas-host"/>
   <div className="screen-grain" aria-hidden="true"/>
   {state.screen==='loading'&&<div className="loading-screen"><span className="eyebrow">LAND OF WAVES</span><h1>Entering the mist.</h1><div className="load-track"><span style={{width:`${state.progress*100}%`}}/></div><span className="load-percent">{Math.round(state.progress*100)}%</span></div>}
   {state.screen==='title'&&<div className="title-screen"><div className="title-copy"><div className="eyebrow"><span/> A SHINOBI&apos;S FIRST TRIAL</div><h1>NARUTO</h1><h2>LAND OF WAVES</h2><div className="title-rule"/><p>Beyond the mist.<br/>Against impossible odds.</p><div className="title-actions"><Button className="begin-button" onClick={()=>command(state.checkpoint==='forest'?'start':'continue')}>{state.checkpoint==='forest'?'BEGIN CHAPTER':'CONTINUE CHAPTER'}<ArrowRight/></Button>{state.checkpoint!=='forest'&&<Button variant="ghost" className="new-run" onClick={()=>command('start')}>New game</Button>}</div><button className="title-controls" onClick={showControls}><Gamepad2 size={18}/> Keyboard & controller <span>VIEW CONTROLS ↗</span></button></div><div className="title-bottom"><span className="chapter-number">01</span><div><span className="eyebrow">THE LAND OF WAVES</span><span className="encounters-label">Zabuza Momochi <span>→</span> Haku</span></div><span className="chapter-duration">FIRST PLAY · 5–8 MIN</span></div><div className="vertical-japanese" aria-hidden="true">忍道を貫く</div></div>}
   {active&&<>
    <div className="hud-top"><div className="player-hud"><div className="player-name"><span>NARUTO UZUMAKI</span><strong>{Math.ceil(state.health)} <small>/ 100</small></strong></div><div className="meter health"><span style={{width:`${state.health}%`}}/></div><div className="chakra-row"><span>CHAKRA</span><div className="meter chakra"><span style={{width:`${state.chakra}%`}}/></div><b>{Math.floor(state.chakra)}</b></div></div><div className="mission-hud"><span className="eyebrow">{state.stage}</span><span>{state.objective}</span></div><Button variant="ghost" className="pause-button" size="icon" aria-label="Pause game" onClick={()=>command('pause')}><Pause/></Button></div>
    {state.boss&&<div className="boss-hud"><div><span>{state.boss.name}</span><span>{state.boss.phase}</span></div><div className="boss-track"><span style={{width:`${Math.max(0,state.boss.health/state.boss.max*100)}%`}}/></div></div>}
    <div className="hud-bottom"><span className="clock-label">CH. 01 <span/> {time}</span><div className="hotbar">{actions.map(([key,pad,label,type,frame],i)=>{const cooldown=i===2?state.cloneCooldown:i===3?state.subCooldown:0;const locked=(i===4&&state.ultimate<100)||cooldown>0||(i===2&&state.chakra<30)||(i===3&&state.chakra<25);return <div className={`ability ${i===4?'ultimate-ability':''} ${locked?'unavailable':''} ${i===4&&state.ultimate>=100?'charged':''}`} key={key}><kbd>{state.device==='gamepad'?pad:key}</kbd><ArtIcon type={type} frame={frame}/><span>{label}</span>{cooldown>0&&<strong className="cooldown">{cooldown.toFixed(1)}</strong>}{i===4&&<div className="ultimate-track"><span style={{width:`${state.ultimate}%`}}/></div>}</div>;})}</div><span className="input-label">{state.device==='gamepad'?<Gamepad2 size={17}/>:<Keyboard size={17}/>} {state.device==='gamepad'?'CONTROLLER':'KEYBOARD'}</span></div>
    {state.hint&&state.screen==='playing'&&<output className="game-hint">{state.hint}</output>}
   </>}
   {state.screen==='intro'&&<div className="boss-intro"><span className="eyebrow">A SHINOBI STANDS IN YOUR WAY</span><h2>{state.boss?.name}</h2><p>{state.checkpoint==='zabuza'?'The Demon of the Hidden Mist':'Demonic Mirroring Ice Crystals'}</p><Button className="begin-button" onClick={()=>command('skip')}>FACE YOUR OPPONENT <ArrowRight/></Button><span className="intro-instruction">ENTER / A TO CONTINUE</span></div>}
   {state.screen==='paused'&&!controls&&<div className="menu-overlay"><span className="eyebrow">TAKE A BREATH</span><h2>PAUSED</h2><Button className="begin-button" onClick={()=>command('resume')}>RESUME <ArrowRight/></Button><Button variant="ghost" onClick={showControls}>Controls & settings</Button><Button variant="ghost" onClick={()=>command('title')}>Return to title</Button></div>}
   {state.screen==='dead'&&<div className="menu-overlay"><span className="eyebrow">YOUR NINJA WAY DOESN&apos;T END HERE</span><h2>RISE AGAIN.</h2><p>Continue from your last checkpoint.</p><Button className="begin-button" onClick={()=>command('retry')}>TRY AGAIN <ArrowRight/></Button><span className="intro-instruction">ENTER / A TO RETRY</span></div>}
   {state.screen==='victory'&&<div className="victory-screen"><span className="eyebrow">CHAPTER 01 COMPLETE</span><h2>YOUR NINJA WAY.</h2><p>The mist has lifted. The bridge is safe.</p><div className="results-stats"><div><span>ACTIVE PLAY TIME</span><b>{time}</b></div><div><span>ENEMIES DEFEATED</span><b>{state.kills}</b></div><div><span>BOSSES DEFEATED</span><b>02 / 02</b></div></div><Button className="begin-button" onClick={()=>command('start')}>PLAY AGAIN <ArrowRight/></Button></div>}
   {state.screen==='error'&&<div className="menu-overlay"><h2>Connection interrupted</h2><p>{state.error}</p><Button className="begin-button" onClick={()=>location.reload()}>RELOAD GAME</Button></div>}
  </section>
  <footer className="game-footer"><span><span className="footer-dot"/> SINGLE PLAYER <span className="footer-separator">/</span> CHAPTER 01</span><button onClick={showControls}>A D <span>MOVE</span> <span className="key-space">SPACE</span> <span>JUMP</span> <span className="footer-separator">·</span> CONTROLS <ArrowRight size={13}/></button></footer>
  <Dialog open={controls} onOpenChange={open=>open?setControls(true):closeControls()}><DialogContent className="controls-dialog"><DialogTitle>YOUR NINJA TOOLKIT</DialogTitle><DialogDescription>Every technique has its moment. Mix them together.</DialogDescription><div className="controls-table"><div><b>MOVE / JUMP</b><span>A D / SPACE</span><span>STICK / A</span></div>{actions.map(([key,pad,label])=><div key={key}><b>{label}</b><span>{key}</span><span>{pad}</span></div>)}<div><b>PAUSE</b><span>ESC</span><span>START</span></div></div><p className="control-tip">Hold J for combos and K to throw. Clones draw attacks. Substitute just before a hit. Strike enemies to charge Rasengan.</p><div className="settings-row"><Button variant="outline" onClick={toggleMute}>{muted?<VolumeX size={17}/>:<Volume2 size={17}/>} {muted?'SOUND OFF':'SOUND ON'}</Button><Button variant="outline" onClick={()=>{bridge.setSettings({reducedShake:!reduced});setReduced(!reduced);}}>SCREEN SHAKE {reduced?'OFF':'ON'}</Button></div><Button className="begin-button" onClick={closeControls}>GOT IT <X size={17}/></Button></DialogContent></Dialog>
 </main>;
}


