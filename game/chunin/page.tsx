'use client';
import { useEffect, useRef, useState } from 'react';
import { bridge, type Snapshot, type Command } from './bridge';
import { PHASES, PHASE_INFO } from './combat';
import './style.css';
function Meter({
  value,
  max = 100,
  label,
  kind = '',
}: {
  value: number;
  max?: number;
  label: string;
  kind?: string;
}) {
  return (
    <div className={`ch-meter ${kind}`}>
      <meter
        className="ch-sr"
        aria-label={label}
        value={value}
        min={0}
        max={max}
      />
      <i
        style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }}
      />
    </div>
  );
}
export default function ChuninPage() {
  const host = useRef<HTMLDivElement>(null),
    frame = useRef<HTMLElement>(null);
  const [s, setS] = useState<Snapshot>(bridge.get()),
    [menu, setMenu] = useState<'controls' | 'scenes' | null>(null),
    [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let cancelled = false,
      game: { destroy: (v: boolean) => void } | undefined;
    const off = bridge.subscribe(() => setS({ ...bridge.get() }));
    import('./runtime')
      .then(({ mountChunin }) => {
        if (!cancelled && host.current) game = mountChunin(host.current);
      })
      .catch((e) => {
        console.error(e);
        bridge.patch({
          screen: 'error',
          error: 'Chapter 2 could not load. Please reload.',
        });
      });
    return () => {
      cancelled = true;
      off();
      game?.destroy(true);
    };
  }, []);
  useEffect(() => {
    bridge.patch({ modalOpen: menu !== null });
    if (!menu) return;
    document.querySelector<HTMLButtonElement>('dialog[open] button')?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setMenu(null);
      }
    };
    window.addEventListener('keydown', close, true);
    return () => window.removeEventListener('keydown', close, true);
  }, [menu]);
  const command = (c: Command) => {
    bridge.command(c);
    host.current?.querySelector('canvas')?.focus();
  };
  const open = (m: 'controls' | 'scenes') => {
    if (s.screen === 'playing' || s.screen === 'intro') command('pause');
    setMenu(m);
  };
  const full = () => {
    if (expanded) {
      setExpanded(false);
      if (document.fullscreenElement) void document.exitFullscreen();
    } else {
      setExpanded(true);
      void frame.current?.requestFullscreen?.().catch(() => {});
    }
  };
  useEffect(() => {
    const changed = () => {
      if (!document.fullscreenElement) setExpanded(false);
    };
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  const settings = bridge.settings(),
    active = ['playing', 'paused', 'dead'].includes(s.screen),
    pad = s.device === 'gamepad';
  return (
    <main className="ch-shell">
      <header className="ch-header">
        <button onClick={() => command('title')}>
          <b>忍</b> NARUTOVANIA
        </button>
        <span>
          CHAPTER 02 <i /> CHUNIN EXAMS
        </span>
        <nav>
          <button
            aria-label="Mute sound"
            onClick={() => bridge.setSettings({ muted: !settings.muted })}
          >
            {settings.muted ? 'Sound off' : 'Sound on'}
          </button>
          <button onClick={() => open('controls')}>Controls</button>
          <button onClick={full}>Fullscreen</button>
        </nav>
      </header>
      <section className={`ch-frame ${expanded ? 'ch-full' : ''}`} ref={frame}>
        <div ref={host} className="ch-canvas" />
        {expanded && (
          <button className="ch-full-exit" onClick={full}>
            Exit fullscreen ×
          </button>
        )}
        {s.screen === 'loading' && (
          <div className="ch-overlay">
            <p className="ch-eyebrow">PREPARING THE ARENA</p>
            <h1>The Power of Youth</h1>
            <Meter value={s.progress * 100} label="Loading" />
            <p>{Math.round(s.progress * 100)}%</p>
          </div>
        )}
        {s.screen === 'error' && (
          <div className="ch-overlay">
            <h2>{s.error}</h2>
          </div>
        )}
        {s.screen === 'title' && (
          <div className="ch-title">
            <p className="ch-eyebrow">
              CHUNIN EXAM PRELIMINARIES · NINTH MATCH
            </p>
            <h1>
              THE POWER
              <br />
              OF <em>YOUTH.</em>
            </h1>
            <p>
              Rock Lee <span>vs.</span> Gaara
            </p>
            <div className="ch-title-line" />
            <p className="ch-title-desc">
              No ninjutsu. No shortcuts.
              <br />
              Prove what relentless effort can do.
            </p>
            <button
              className="ch-primary"
              onClick={() => command(s.seen.length ? 'continue' : 'start')}
            >
              {s.seen.length ? 'Continue duel' : 'Enter the arena'} →
            </button>
            {s.seen.length > 0 && (
              <button onClick={() => command('start')}>Begin again</button>
            )}
            <small>ONE DUEL · THREE POWER LEVELS · KEYBOARD & CONTROLLER</small>
          </div>
        )}
        {active && (
          <>
            <div className="ch-hud">
              <div className="ch-fighter">
                <div className="ch-name">
                  <b>ROCK LEE</b>
                  <span>{Math.ceil(s.health)} / 100</span>
                </div>
                <Meter value={s.health} label="Lee health" />
                <Meter value={s.stamina} label="Lee stamina" kind="stamina" />
                <small>
                  {s.guardBroken
                    ? 'GUARD BROKEN'
                    : s.stunned
                      ? 'HIT STUN'
                      : 'TAIJUTSU · STAMINA'}
                </small>
              </div>
              <div className="ch-phase">
                0{PHASES.indexOf(s.phase) + 1}
                <small>/ 03</small>
              </div>
              <div className="ch-fighter">
                <div className="ch-name">
                  <b>GAARA</b>
                  <span>{Math.ceil((s.bossHealth / s.bossMax) * 100)}%</span>
                </div>
                <Meter
                  value={s.bossHealth}
                  max={s.bossMax}
                  label="Gaara health"
                  kind="boss"
                />
                <Meter
                  value={s.bossStamina}
                  label="Gaara stamina"
                  kind="stamina"
                />
                <small className={s.exposed ? 'ch-open' : ''}>
                  {s.exposed
                    ? 'SAND EXPOSED · STRIKE NOW'
                    : s.bossMove || 'AUTOMATIC SAND SHIELD'}
                </small>
              </div>
            </div>
            <div className="ch-phase-title">
              {PHASE_INFO[s.phase].title}
              <span>
                {s.phase === 'shield'
                  ? 'Close in after the sand strikes. Parry to break his defense.'
                  : s.phase === 'speed'
                    ? 'Outrun the shield. Punish the gaps between his techniques.'
                    : 'Keep moving. Break the armor and give it everything.'}
              </span>
            </div>
            <div className="ch-actions">
              {[
                [pad ? 'RB' : 'Q', 'Leaf Hurricane', s.skill1],
                [pad ? 'RT' : 'E', 'Lotus Launcher', s.skill2],
                [pad ? 'LT' : 'L', 'Backstep', s.backstep],
              ].map(([key, name, cd]) => (
                <div key={key} className={Number(cd) > 0 ? 'ch-cooling' : ''}>
                  <kbd>{key}</kbd>
                  <b>{name}</b>
                  <small>
                    {Number(cd) > 0 ? `${Number(cd).toFixed(1)}s` : 'READY'}
                  </small>
                </div>
              ))}
              <div className={`ch-ult ${s.ultimate >= 100 ? 'ch-ready' : ''}`}>
                <kbd>{pad ? 'R3' : 'R'}</kbd>
                <b>{s.phase === 'gates' ? 'Reverse Lotus' : 'Primary Lotus'}</b>
                <Meter
                  value={s.ultimate}
                  label="Ultimate charge"
                  kind="ultimate"
                />
              </div>
            </div>
            <button
              className="ch-pause"
              aria-label="Pause game"
              onClick={() => command('pause')}
            >
              Ⅱ
            </button>
            <span className="ch-clock">
              {Math.floor(s.elapsed / 60000)}:
              {String(Math.floor(s.elapsed / 1000) % 60).padStart(2, '0')}
            </span>
          </>
        )}
        {s.screen === 'intro' && (
          <>
            <div className="ch-letterbox top" />
            <div className="ch-letterbox bottom" />
            {s.dialogue && (
              <div className="ch-dialogue">
                <b>{s.speaker}</b>
                <p>{s.dialogue}</p>
              </div>
            )}
            <button className="ch-skip" onClick={() => command('skip')}>
              Skip scene →
            </button>
          </>
        )}
        {s.ultimateName && (
          <div className="ch-ultimate-title">
            <small>TAIJUTSU</small>
            {s.ultimateName}
          </div>
        )}
        {s.screen === 'paused' && !menu && (
          <div className="ch-overlay">
            <p className="ch-eyebrow">TAKE A BREATH</p>
            <h2>Paused</h2>
            <button className="ch-primary" onClick={() => command('resume')}>
              Resume
            </button>
            <button onClick={() => open('controls')}>Controls & sound</button>
            <button onClick={() => open('scenes')}>Scene select</button>
            <button onClick={() => command('title')}>Return to title</button>
          </div>
        )}
        {s.screen === 'dead' && (
          <div className="ch-overlay">
            <p className="ch-eyebrow">EFFORT NEVER BETRAYS YOU</p>
            <h2>One more try.</h2>
            <p>Retry {PHASE_INFO[s.phase].title} with full resources.</p>
            <button className="ch-primary" onClick={() => command('retry')}>
              Retry phase →
            </button>
            <button onClick={() => command('title')}>Return to title</button>
          </div>
        )}
        {s.screen === 'victory' && (
          <div className="ch-overlay ch-results">
            <p className="ch-eyebrow">CHAPTER COMPLETE</p>
            <h2>A splendid ninja.</h2>
            <p>
              Gaara wins the match.
              <br />
              Lee proves the strength of his ninja way.
            </p>
            <div>
              {Math.floor(s.elapsed / 60000)}m{' '}
              {Math.floor(s.elapsed / 1000) % 60}s <span>·</span> {s.parries}{' '}
              perfect parries
            </div>
            <button
              className="ch-primary"
              onClick={() => command(s.debugEntry ? 'debug-replay' : 'start')}
            >
              Fight again →
            </button>
            <button onClick={() => command('title')}>Return to title</button>
          </div>
        )}
        {s.debugEntry && (
          <div className="ch-debug-tag">
            PREVIEW · PROGRESS NOT SAVED{' '}
            <button onClick={() => command('debug-replay')}>Replay</button>
          </div>
        )}
        {menu && (
          <dialog
            open
            className="ch-modal"
            aria-modal="true"
            aria-label={
              menu === 'controls' ? 'Controls and settings' : 'Scene select'
            }
          >
            <button className="ch-close" onClick={() => setMenu(null)}>
              Close ×
            </button>
            {menu === 'controls' ? (
              <>
                <h2>Master your taijutsu.</h2>
                <p>
                  The pale hand glint signals a shot&apos;s release. Parry when
                  its bright core reaches you, even in the air. Hold to guard.
                  Outlined ground spells and red ! attacks must be dodged.
                </p>
                <table>
                  <tbody>
                    {[
                      ['Move / down', 'A D / S', 'Stick / D-pad'],
                      [
                        'Jump / double jump',
                        'Space · press again in air',
                        'A / Cross · press again',
                      ],
                      ['Combo / heavy', 'J / down + hold J', 'X / Square'],
                      ['Quick palm', 'K', 'Y / Triangle'],
                      [
                        'Dash / air dash / slide',
                        'Shift / down + Shift',
                        'B / Circle',
                      ],
                      ['Parry / guard', 'F', 'LB / L1'],
                      ['Hurricane / Lotus Launcher', 'Q / E', 'RB / RT'],
                      ['Backstep', 'L', 'LT'],
                      ['Lotus ultimate', 'R', 'R3'],
                      ['Pause', 'Escape', 'Start'],
                    ].map((r) => (
                      <tr key={r[0]}>
                        {r.map((c) => (
                          <td key={c}>{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(['musicVolume', 'effectsVolume', 'voiceVolume'] as const).map(
                  (k) => (
                    <label className="ch-slider" key={k}>
                      {k.replace('Volume', '')}
                      <input
                        aria-label={k}
                        type="range"
                        min="0"
                        max="1"
                        step=".05"
                        value={settings[k]}
                        onChange={(e) =>
                          bridge.setSettings({ [k]: Number(e.target.value) })
                        }
                      />
                    </label>
                  ),
                )}
                <label>
                  <input
                    type="checkbox"
                    checked={settings.reducedShake}
                    onChange={(e) =>
                      bridge.setSettings({ reducedShake: e.target.checked })
                    }
                  />{' '}
                  Reduced motion / shake
                </label>
                <p className="ch-credit">
                  Original-series tribute. Generated character art; reused
                  licensed audio.{' '}
                  <a
                    href="/audio-chunin/manifest.json"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Chapter 2 sound credits
                  </a>
                  {' · '}
                  <a
                    href="/audio-v23/manifest.json"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Music credits
                  </a>
                </p>
              </>
            ) : (
              <>
                <h2>Scene select</h2>
                <p>
                  Preview any phase or transition. Your normal progress stays
                  untouched.
                </p>
                {PHASES.map((p) => (
                  <button
                    className="ch-scene-button"
                    key={p}
                    onClick={() => {
                      setMenu(null);
                      command({ type: 'debug', phase: p });
                    }}
                  >
                    {PHASE_INFO[p].title} · Fight →
                  </button>
                ))}
                {[
                  ['opening', 'Arena introduction', 'shield'],
                  ['weights', 'Weights fall', 'speed'],
                  ['gates', 'The Fifth Gate', 'gates'],
                  ['ending', 'Guy intervenes', 'gates'],
                ].map(([scene, label, phase]) => (
                  <button
                    className="ch-scene-button"
                    key={scene}
                    onClick={() => {
                      setMenu(null);
                      command({
                        type: 'debug',
                        phase: phase as (typeof PHASES)[number],
                        scene,
                      });
                    }}
                  >
                    {label} →
                  </button>
                ))}
                <h3>Sound check</h3>
                <p>Audition the new cues without changing your save.</p>
                {[
                  ['hit-palm-1', 'Palm'],
                  ['hit-kick-1', 'Kick'],
                  ['hit-heavy', 'Lotus impact'],
                  ['parry', 'Parry'],
                  ['tell', 'Attack tell'],
                  ['sand-cast', 'Sand cast'],
                  ['sand-impact', 'Sand eruption'],
                  ['sand-bounce', 'Ricochet'],
                ].map(([cue, label]) => (
                  <button
                    key={cue}
                    onClick={() => command({ type: 'audition', cue })}
                  >
                    {label}
                  </button>
                ))}
              </>
            )}
          </dialog>
        )}
      </section>
      <footer className="ch-footer">
        <span>HARD WORK CAN SURPASS GENIUS.</span>
        <button onClick={() => open('scenes')}>Debug / Scene Select</button>
        <span>ROCK LEE × GAARA</span>
      </footer>
    </main>
  );
}
