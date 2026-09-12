/** Chapter-aware progress. Legacy data remains recoverable in its original key. */
export const CHAPTERS = [
  {
    id: 'land-of-waves',
    number: '01',
    title: 'Land of Waves',
    subtitle: 'Kakashi · Naruto · Sasuke / Zabuza & Haku',
  },
  {
    id: 'lee-gaara',
    number: '02',
    title: 'The Power of Youth',
    subtitle: 'Rock Lee / Gaara · Chunin Exam preliminaries',
  },
] as const;
export type ChapterId = (typeof CHAPTERS)[number]['id'];
export interface ChapterProgress {
  checkpoint: string;
  seen: string[];
  completed: boolean;
  checkpointBossHealth?: number;
}
export interface ChapterSave {
  version: 3;
  selectedChapter: ChapterId;
  chapters: Record<ChapterId, ChapterProgress>;
}
const phases: Record<ChapterId, readonly string[]> = {
  'land-of-waves': [
    'mist',
    'rescue',
    'copy',
    'protect',
    'mirrors',
    'seal',
    'lightning',
  ],
  'lee-gaara': ['shield', 'speed', 'gates'],
};
export const SAVE_KEY = 'narutovania.chapters.v3';
export function parseChapters(raw: unknown, legacy?: unknown): ChapterSave {
  const data =
    raw && typeof raw === 'object' ? (raw as Partial<ChapterSave>) : {};
  const old =
    legacy && typeof legacy === 'object'
      ? (legacy as { version?: number; phase?: string; seen?: string[] })
      : {};
  const entries = {} as Record<ChapterId, ChapterProgress>;
  for (const id of ['land-of-waves', 'lee-gaara'] as const) {
    const candidate =
      data.version === 3
        ? data.chapters?.[id]
        : id === 'land-of-waves' && old.version === 2
          ? { checkpoint: old.phase, seen: old.seen, completed: false }
          : undefined;
    entries[id] = {
      checkpoint:
        typeof candidate?.checkpoint === 'string' &&
        phases[id].includes(candidate.checkpoint)
          ? candidate.checkpoint
          : phases[id][0],
      seen: Array.isArray(candidate?.seen)
        ? candidate.seen.filter((p) => phases[id].includes(p))
        : [],
      completed: candidate?.completed === true,
    };
    if (
      id === 'lee-gaara' &&
      candidate &&
      'checkpointBossHealth' in candidate &&
      typeof candidate.checkpointBossHealth === 'number' &&
      Number.isFinite(candidate.checkpointBossHealth) &&
      candidate.checkpointBossHealth > 0 &&
      candidate.checkpointBossHealth <= 6000
    ) {
      entries[id].checkpointBossHealth = candidate.checkpointBossHealth;
    }
  }
  return {
    version: 3,
    selectedChapter:
      data.selectedChapter === 'lee-gaara' ? 'lee-gaara' : 'land-of-waves',
    chapters: entries,
  };
}
export function readChapters(): ChapterSave {
  try {
    return parseChapters(
      JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'),
      JSON.parse(localStorage.getItem('narutovania.checkpoint.v2') || 'null'),
    );
  } catch {
    return parseChapters(null);
  }
}
export function writeChapter(id: ChapterId, patch: Partial<ChapterProgress>) {
  const data = readChapters();
  data.chapters[id] = { ...data.chapters[id], ...patch };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(parseChapters(data)));
  } catch {}
}
export function selectChapter(id: ChapterId) {
  const data = readChapters();
  data.selectedChapter = id;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {}
}
