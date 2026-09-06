'use client';
import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {ArrowRight, Volume2, VolumeX, Maximize, Pause, X, Settings2, Gamepad2, Keyboard, Wind, Swords, RotateCcw} from 'lucide-react';
import {bossBridge as bridge, type Command, type Settings, type Snapshot} from './boss-bridge';
import {CHARACTER, PHASES, PLAYABLE_PHASE_IDS, STORY_SOURCES, kit} from './chapter';
import audioManifest from '../public/audio-v3/manifest.json';
import '@/app/boss.css';

const controls = [
  ['Move / crouch', 'A D / S or arrows', 'Left stick / D-pad'], ['Jump', 'Space', 'A / Cross'],
  ['Melee / charged heavy', 'Tap J / down + hold J', 'X / Square'], ['Shuriken · 4 chakra', 'K', 'Y / Triangle'],
  ['Dash / air dash / slide', 'Shift / down + Shift', 'B / Circle'], ['Parry / hold block', 'F', 'LB / L1'],
  ['Signature techniques', 'Q / E', 'RB / RT'], ['Substitution', 'L', 'LT / L2'], ['Ultimate', 'R', 'Right-stick click'], ['Pause / skip cinematic', 'Esc / Enter', 'Start / A'],
];
function AbilityIcon({id}: {id:string}) {return <Image unoptimized width={48} height={48} src={id === 'glamour' ? '/art-v8/glamour-icon.webp' : `/art-v3/icons/${id}.webp`} alt=""/>;}
const percent = (value: number) => `${Math.max(0, Math.min(100, value))}%`;
function Bar({value, kind, label}: {value: number; kind: string; label: string}) {return <div className={`br-bar br-${kind}`}><meter className="sr-only" aria-label={label} value={Math.round(value)} min={0} max={100}/><span style={{width: percent(value)}}/></div>;}

export default function BossPage() {
  const host = useRef<HTMLDivElement>(null), frame = useRef<HTMLElement>(null);
  const [state, setState] = useState<Snapshot>(bridge.get()), [settings, setSettings] = useState<Settings>(bridge.settings());
  const [panel, setPanel] = useState<'controls' | 'credits' | null>(null), [resumeAfter, setResumeAfter] = useState(false), [expanded, setExpanded] = useState(false);
  const [abilityHint,setAbilityHint]=useState('');
  useEffect(() => {
    let cancelled = false, game: {destroy: (remove: boolean) => void} | undefined;
    const unsubscribe = bridge.subscribe(() => {setState({...bridge.get()}); setSettings({...bridge.settings()});});
    import('./boss-runtime').then(({mountBossGame}) => {if (!cancelled && host.current) game = mountBossGame(host.current);}).catch(error => {
      console.error('Boss rush startup failed', error); bridge.patch({screen: 'error', error: 'The chapter could not start. Reload the game to try again.'});
    });
    return () => {cancelled = true; unsubscribe(); game?.destroy(true);};
  }, []);
  useEffect(() => {
    if (!expanded) return;
    const escape = (event: KeyboardEvent) => {if (event.code === 'Escape' && !panel) {event.preventDefault(); event.stopImmediatePropagation(); setExpanded(false); if (document.fullscreenElement) void document.exitFullscreen();}};
    const changed = () => {if (!document.fullscreenElement) setExpanded(false);};
    window.addEventListener('keydown', escape, true); document.addEventListener('fullscreenchange', changed);
    return () => {window.removeEventListener('keydown', escape, true); document.removeEventListener('fullscreenchange', changed);};
  }, [expanded, panel]);
  const command = (action: Command) => {bridge.command(action); host.current?.querySelector('canvas')?.focus();};
  const openPanel = (next: 'controls' | 'credits') => {if (['playing', 'intro'].includes(state.screen)) {command('pause'); setResumeAfter(true);} setPanel(next);};
  const closePanel = () => {setPanel(null); if (resumeAfter) {command('resume'); setResumeAfter(false);}};
  const fullscreen = () => {if (expanded) {setExpanded(false); if (document.fullscreenElement) void document.exitFullscreen();} else {setExpanded(true); void frame.current?.requestFullscreen?.().catch(() => {});}};
  const active = ['playing', 'paused', 'dead'].includes(state.screen), controller = state.device === 'gamepad';
  const time = `${Math.floor(state.elapsed / 60).toString().padStart(2, '0')}:${Math.floor(state.elapsed % 60).toString().padStart(2, '0')}`;
  const current = PHASES[state.checkpoint], character = CHARACTER[state.character];
  return <main className="boss-shell">
    <header className="br-masthead"><button className="br-brand" onClick={() => command('title')} aria-label="Narutovania title screen"><span>忍</span>NARUTOVANIA</button><div className="br-chapter-tag"><i/> STORY BOSS RUSH <span>/</span> CHAPTER 01</div><div className="br-tools">
      <Button variant="ghost" size="icon" aria-label={settings.muted ? 'Unmute sound' : 'Mute sound'} onClick={() => bridge.setSettings({muted: !settings.muted})}>{settings.muted ? <VolumeX/> : <Volume2/>}</Button>
      <Button variant="ghost" size="icon" aria-label="Controls and settings" onClick={() => openPanel('controls')}><Settings2/></Button><Button variant="ghost" size="icon" aria-label="Toggle fullscreen" onClick={fullscreen}><Maximize/></Button>
    </div></header>
    <section ref={frame} className={`br-frame ${expanded ? 'br-fullscreen' : ''}`} aria-label="Naruto Land of Waves story boss rush">
      <div className="br-stage">
      <div className="br-canvas" ref={host}/><div className="br-vignette" aria-hidden="true"/>
      {expanded && <Button variant="ghost" size="icon" className="br-exit" aria-label="Exit fullscreen" onClick={fullscreen}><X/></Button>}
      {state.screen === 'loading' && <div className="br-loading"><span className="br-eyebrow">CHAPTER 01 · LAND OF WAVES</span><h1>Into the mist.</h1><div className="br-load-line"><span style={{width: percent(state.progress * 100)}}/></div><span>{Math.round(state.progress * 100)}%</span></div>}
      {state.screen === 'title' && <div className="br-title"><div className="br-title-copy"><span className="br-eyebrow"><i/> A BOND FORGED IN BATTLE</span><h1>NARUTO</h1><h2>LAND OF WAVES</h2><div className="br-title-rule"/><p>One team. Four trials.<br/>A bridge worth fighting for.</p><Button className="br-primary br-start" onClick={() => command(state.seen.length ? 'continue' : 'start')}>{state.seen.length ? 'CONTINUE STORY' : 'BEGIN STORY'}<ArrowRight/></Button>
        {state.seen.length > 0 && <button className="br-new-run" onClick={() => command('start')}>Start a new chapter</button>}
        <button className="br-control-link" onClick={() => openPanel('controls')}><Gamepad2/> Keyboard & controller <span>VIEW CONTROLS</span></button></div>
        <div className="br-title-bottom"><span className="br-large-number">01</span><div><span className="br-eyebrow">STORY BOSS RUSH</span><span>Zabuza Momochi <i>×</i> Haku</span></div><span className="br-duration">FOUR TECHNICAL DUELS</span></div><span className="br-vertical" aria-hidden="true">大切なものを守る</span></div>}
      {active && <>
        {state.reading > 0 && <div className="br-reading">SHARINGAN · {state.counter ? 'COUNTER READY · NEXT STRIKE +50%' : 'READ • DEFLECT • COUNTER'}</div>}
        <div className="br-combat-hud"><div className={`br-fighter-hud ${state.stunned?'br-stunned':''}`}><Image unoptimized width={56} height={60} className="br-portrait" src={`/art-v2/portraits/${state.character}.png`} alt=""/><div className="br-meters"><div className="br-name"><b>{character.name}</b><span>{Math.ceil(state.health)} <small>/ 100</small></span></div><Bar value={state.health} kind="health" label="Player health"/><Bar value={state.stamina} kind={state.guardBroken ? 'broken' : 'stamina'} label="Player stamina"/><div className={`br-small-meters ${state.chakra<24?'br-low-chakra':''}`}><span>CHAKRA</span><Bar value={state.chakra} kind="chakra" label="Chakra"/><span>{Math.floor(state.chakra)}</span></div>{(state.guardBroken||state.stunned)&&<span className="br-recovery">{state.guardBroken?'GUARD BROKEN':'HIT-STUN'} <b>{state.recovery.toFixed(1)}s</b></span>}</div></div>
          <div className="br-phase-number"><span>{String(current.number).padStart(2, '0')}</span><small>/ 04</small></div>
          {state.boss && <div className={`br-fighter-hud br-boss-meters ${state.boss.stunned?'br-stunned':''} ${state.boss.postureFlash?'br-posture-hit':''}`}><div className="br-meters"><div className="br-name"><b>{state.boss.name}</b><span>{Math.ceil(state.boss.health / state.boss.max * 100)}<small>%</small></span></div><Bar value={state.boss.health / state.boss.max * 100} kind="boss-health" label="Boss health"/><Bar value={state.boss.stamina} kind={state.boss.guardBroken ? 'broken' : 'stamina'} label="Boss stamina"/>{state.boss.guardBroken||state.boss.stunned?<span className="br-recovery">{state.boss.guardBroken?'GUARD BROKEN · 1.6× DAMAGE':'HIT-STUN'} <b>{state.boss.recovery.toFixed(1)}s</b></span>:state.boss.phase&&<span className="br-boss-phase">{state.boss.phase}</span>}</div><Image unoptimized width={56} height={60} className="br-portrait" src={`/art-v2/portraits/${current.boss}.png`} alt=""/></div>}
        </div>
        <div className="br-objective"><span>{current.title}</span><small>{state.objective}</small><div><i style={{width: percent(state.phaseProgress * 100)}}/></div>{state.protection !== null && <div className="br-protection">Tazuna <Bar value={state.protection} kind="health" label="Tazuna protection"/></div>}</div>
        <Button variant="ghost" size="icon" className="br-pause" aria-label="Pause game" onClick={() => command('pause')}><Pause/></Button>
        <div className="br-bottom-hud"><div className="br-time">CH. 01 <i/> {time}</div><div className="br-hotbar">
          <div className="br-ability br-basic" title="Tap for palm, kick, sweep. Down + hold charges a heavy."><kbd>{controller ? 'X' : 'J'}</kbd><Swords/><span>Melee</span></div><div className={`br-ability br-basic ${state.chakra<4?'br-unready':''}`} title="Shuriken · 4 chakra"><kbd>{controller ? 'Y' : 'K'}</kbd><AbilityIcon id="tool"/><span>Shuriken <small>4</small></span></div>
          <div className={`br-ability br-basic ${state.stamina < 22 ? 'br-unready' : ''}`} title="Dash / air dash / slide"><kbd>{controller ? 'B' : '⇧'}</kbd><Wind/><span>Dash</span></div><div className="br-ability br-basic" title="Tap to parry. Hold to block."><kbd>{controller ? 'LB' : 'F'}</kbd><AbilityIcon id="parry"/><span>Parry</span></div>
          <div className={`br-ability br-basic ${state.subCooldown || state.chakra < 25 ? 'br-unready' : ''}`} title="Substitution · 25 chakra"><kbd>{controller ? 'LT' : 'L'}</kbd><AbilityIcon id="feint"/>{state.subCooldown > 0 && <strong>{state.subCooldown.toFixed(1)}</strong>}<span>Decoy <small>25</small></span></div>
          <span className="br-hotbar-divider"/>{state.abilities.map((ability, index) => <button type="button" aria-label={`About ${ability.label}. ${ability.description}`} onClick={()=>openPanel('controls')} onMouseEnter={()=>setAbilityHint(ability.description)} onMouseLeave={()=>setAbilityHint('')} onFocus={()=>setAbilityHint(ability.description)} onBlur={()=>setAbilityHint('')} className={`br-ability br-spell ${!ability.ready ? 'br-unready' : ''} ${index === 2 ? 'br-ultimate' : ''} ${index === 2 && ability.ready ? 'br-charged' : ''}`} key={ability.label}><kbd>{controller ? ['RB', 'RT', 'R3'][index] : ['Q', 'E', 'R'][index]}</kbd><AbilityIcon id={ability.id}/><span className="br-spell-copy"><b>{ability.label}</b><small>{index===2?ability.ready?'ULTIMATE READY':`ULTIMATE · ${Math.floor(state.ultimate)}%`:ability.cooldown>0?`${ability.cooldown.toFixed(1)}s`:`${ability.cost} CHAKRA`}</small></span>{index === 2 && <div className="br-ult-line"><span style={{width: percent(state.ultimate)}}/></div>}</button>)}
        </div><span className="br-device">{controller ? <Gamepad2/> : <Keyboard/>}</span></div>
        {abilityHint&&<div className="br-ability-hint">{abilityHint}</div>}
      </>}
      {state.screen === 'intro' && <div className="br-cinema-ui"><div className="br-letterbox br-letterbox-top"/><div className="br-letterbox br-letterbox-bottom"/><span className="br-cinema-chapter">LAND OF WAVES · CHAPTER 01</span><Button variant="ghost" className="br-skip" onClick={() => command('skip')}>SKIP <kbd>{controller ? 'A' : 'ENTER'}</kbd><ArrowRight/></Button></div>}
      {state.screen === 'paused' && !panel && <div className="br-menu"><span className="br-eyebrow">{current.title}</span><h2>Take a breath.</h2><Button className="br-primary" onClick={() => command('resume')}>RESUME <ArrowRight/></Button><Button variant="ghost" onClick={() => openPanel('controls')}>Controls & settings</Button><Button variant="ghost" onClick={() => command('title')}>Return to title</Button></div>}
      {state.screen === 'dead' && <div className="br-menu"><span className="br-eyebrow">YOUR NINJA WAY CONTINUES</span><h2>Rise again.</h2><p>Retry {current.title.toLowerCase()} with full resources.</p><Button className="br-primary" onClick={() => command('retry')}>RETRY PHASE <ArrowRight/></Button><span className="br-menu-hint">{controller ? 'A / CROSS' : 'ENTER'} TO RETRY</span></div>}
      {state.screen === 'victory' && <div className="br-victory"><span className="br-eyebrow">CHAPTER 01 COMPLETE</span><h2>A bond<br/>beyond the mist.</h2><p>The bridge stands. Their stories remain.</p><div className="br-results"><div><span>ACTIVE PLAY</span><b>{time}</b></div><div><span>DEFLECTIONS</span><b>{state.parries}</b></div><div><span>TRIALS</span><b>07 / 04</b></div></div><Button className="br-primary" onClick={() => command('start')}>PLAY AGAIN <ArrowRight/></Button><button className="br-text-button" onClick={() => openPanel('credits')}>Artwork, audio & story credits</button></div>}
      {state.screen === 'error' && <div className="br-menu"><span className="br-eyebrow">CHAPTER INTERRUPTED</span><h2>Try again.</h2><p>{state.error}</p><Button className="br-primary" onClick={() => location.reload()}>RELOAD GAME <RotateCcw/></Button></div>}
      </div>
    </section>
    <footer className="br-footer"><span>TEAM 7 <i/> LAND OF WAVES</span><div><button onClick={() => openPanel('controls')}>CONTROLS <ArrowRight/></button><button onClick={() => openPanel('credits')}>CREDITS</button></div></footer>
    <Dialog open={panel !== null} onOpenChange={open => {if (!open) closePanel();}}><DialogContent portalContainer={expanded ? frame : undefined} className={`br-dialog ${panel === 'credits' ? 'br-credits-dialog' : ''}`}>
      <DialogTitle>{panel === 'credits' ? 'The people behind the sound.' : 'Your ninja toolkit.'}</DialogTitle><DialogDescription>{panel === 'credits' ? 'Artwork, recordings, licenses, and story references.' : 'Read the attack. Choose your response. Keep your footing.'}</DialogDescription>
      {panel === 'controls' ? <><div className="br-control-grid"><div className="br-control-heading"><b>ACTION</b><span>KEYBOARD</span><span>CONTROLLER</span></div>{controls.map(([action, keyboard, pad]) => <div key={action}><b>{action}</b><span>{keyboard}</span><span>{pad}</span></div>)}</div>
        <div className="br-combat-tips"><p><b>Deflect, then punish.</b> Tap F just before a hit: a perfect parry removes 32 boss stamina. Hold to block frontal hits. Red attacks require a dash. A broken boss guard lasts 2.4s and takes 75% more damage. Gold rings and a recovery bar mark real hit-stun.</p><p><b>Keep the combo flowing.</b> Tap J for three different strikes. Down + hold J charges a heavy. Defense can cancel recovery. Shurikens cost 4 chakra; landed melee returns 2 and parries return 4. Chakra recovers slowly when you stop spending it.</p></div>
        <div className="br-kit"><span>{CHARACTER[current.character].name} · {current.title}</span>{kit(state.checkpoint).map((ability, i) => <p key={ability.label}><kbd>{['Q', 'E', 'R'][i]}</kbd><span><b>{ability.label}</b>{ability.description}</span></p>)}</div>
        <div className="br-audio-settings">{(['musicVolume', 'effectsVolume', 'voiceVolume'] as const).map((field, index) => <div key={field}><label id={`label-${field}`}>{['Music', 'Effects', 'Voice'][index]}</label><Slider aria-labelledby={`label-${field}`} value={[settings[field] * 100]} min={0} max={100} step={1} onValueChange={value => bridge.setSettings({[field]: (Array.isArray(value) ? value[0] : value) / 100})}/><span>{Math.round(settings[field] * 100)}%</span></div>)}</div>
        <div className="br-settings-switches"><label htmlFor="audio-muted">Mute audio <Switch id="audio-muted" aria-label="Mute audio" checked={settings.muted} onCheckedChange={muted => bridge.setSettings({muted})}/></label><label htmlFor="reduce-shake">Reduce screen shake <Switch id="reduce-shake" aria-label="Reduce screen shake" checked={settings.reducedShake} onCheckedChange={reducedShake => bridge.setSettings({reducedShake})}/></label></div>
      </> : <div className="br-credits"><p>Fan-made browser game. Naruto and its characters belong to Masashi Kishimoto and their respective rights holders. Character, arena, and effect artwork was generated for this game with the built-in image generator.</p><p>Music and effort vocals are reusable substitute recordings. They are not the original anime soundtrack or cast performances.</p>{Object.entries(audioManifest.sources).map(([id, source]) => <div key={id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><span>{source.author}</span><a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license}</a>{'attribution' in source && <small>{source.attribution}</small>}</div>)}<p>Sakura’s edited voice clips remain available under CC-BY-SA 4.0. Combat audio uses short, transient-preserving edits. Some male vocals were pitch adjusted.</p><a href="/audio-v3/manifest.json" target="_blank" rel="noreferrer">Audio source and edit credits ↗</a><h3>Story references</h3>{STORY_SOURCES.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}<p>Sakura protects Tazuna in a cinematic. The final Kakashi confrontation is cinematic. Recovery and travel are condensed. Kakashi’s Lightning Blade and hounds are available throughout for gameplay. Story-required techniques trigger after objectives; defeats retry the current phase.</p><p>{PLAYABLE_PHASE_IDS.length} playable story phases · TypeScript · Phaser 3.90.0</p></div>}
      <Button className="br-primary br-dialog-close" onClick={closePanel}>BACK TO THE GAME <ArrowRight/></Button>
    </DialogContent></Dialog>
  </main>;
}
