'use client';
import { useState, lazy, Suspense } from 'react';
import { CHAPTERS, type ChapterId, selectChapter } from './chapter-registry';
import './chapters.css';
const Waves = lazy(() => import('./boss-page'));
const Chunin = lazy(() => import('./chunin/page'));
export default function Chapters() {
  const [chapter, setChapter] = useState<ChapterId | null>(null);
  const choose = (id: ChapterId) => {
    selectChapter(id);
    setChapter(id);
  };
  if (chapter)
    return (
      <>
        <button className="chapter-back" onClick={() => setChapter(null)}>
          ← Chapters
        </button>
        <Suspense
          fallback={<div className="chapter-loading">Opening chapter…</div>}
        >
          {chapter === 'lee-gaara' ? <Chunin /> : <Waves />}
        </Suspense>
      </>
    );
  return (
    <main className="chapter-library">
      <header>
        <span className="chapter-seal">忍</span>
        <span>
          NARUTOVANIA <small>STORY BOSS RUSH</small>
        </span>
      </header>
      <p className="chapter-kicker">THE MOMENTS THAT MADE A SHINOBI</p>
      <h1>Choose your fight.</h1>
      <p className="chapter-intro">Master the timing. Relive the story.</p>
      <div className="chapter-grid">
        {CHAPTERS.map((c) => (
          <button
            key={c.id}
            aria-label={`Chapter ${c.number}: ${c.title}`}
            className={`chapter-card chapter-${c.number}`}
            onClick={() => choose(c.id)}
          >
            <div
              className="chapter-cover"
              style={{
                backgroundImage: `url(${c.id === 'lee-gaara' ? '/art-chunin/arena.webp' : '/art-v2/lakeside-background.png'})`,
              }}
            />
            <div className="chapter-card-body">
              <span className="chapter-kicker">
                CHAPTER {c.number} {c.number === '02' ? '· NEW' : ''}
              </span>
              <h2>{c.title}</h2>
              <p>{c.subtitle}</p>
              <b>
                {c.number === '02'
                  ? 'ONE DUEL · THREE PHASES'
                  : 'FOUR STORY DUELS'}{' '}
                <span>→</span>
              </b>
            </div>
          </button>
        ))}
      </div>
      <footer>
        Fan-made tribute · Keyboard & controller · Desktop browser
        <br />
        Unofficial. Naruto and its characters belong to their respective rights
        holders.
      </footer>
    </main>
  );
}
