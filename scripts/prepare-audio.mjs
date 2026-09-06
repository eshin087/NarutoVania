import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd(), source = path.join(root, 'work/audio');
const ffmpeg = path.join(root, 'work/audio-tools/node_modules/ffmpeg-static/ffmpeg.exe');
const output = path.join(root, 'public/audio');
fs.mkdirSync(output, {recursive: true});
const records = [];
const sources = {
  isao: {title: 'Japanese Samurai Ninja Battle Trailer', author: 'SOUND AIRYLUVS by ISAo', url: 'https://opengameart.org/content/japanese-samurai-ninja-battle-trailer', attribution: 'SOUND AIRYLUVS by ISAo https://airyluvs.com/', license: 'OGA-BY 3.0', licenseUrl: 'https://opengameart.org/content/oga-by-30-faq'},
  samurai: {title: 'Samurai Nights', author: 'Majadroid / Maik Hoffmann', url: 'https://opengameart.org/content/samurai-nights', license: 'CC-BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/'},
  grunts: {title: 'Male Grunt/Yelling sounds', author: 'HaelDB', url: 'https://opengameart.org/content/male-gruntyelling-sounds', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'},
  female: {title: 'Female Gruntwork - 1', author: 'PlumpDev', url: 'https://opengameart.org/content/female-gruntwork-1', license: 'CC-BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', note: 'Page metadata says CC-BY-SA 4.0; attribution text says CC-BY 4.0. These edited clips are offered under the stricter CC-BY-SA 4.0.'},
  rpg: {title: 'RPG Audio', author: 'Kenney', url: 'https://kenney.nl/assets/rpg-audio', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'},
  impacts: {title: 'Impact Sounds', author: 'Kenney', url: 'https://kenney.nl/assets/impact-sounds', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'},
  water: {title: '40 CC0 water / splash / slime SFX', author: 'rubberduck', url: 'https://opengameart.org/content/40-cc0-water-splash-slime-sfx', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'},
  electric: {title: 'Spell sounds', author: 'Augmentality (Brandon Morris), submitted by HaelDB', url: 'https://opengameart.org/content/spell-sounds', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'},
  magic: {title: 'Magic Spell SFX', author: 'JaggedStone', url: 'https://opengameart.org/content/magic-spell-sfx', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'},
};
function run(args) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-y', ...args], {encoding: 'utf8', windowsHide: true});
  if (r.status) throw new Error(r.stderr); return r.stderr;
}
function encode(id, input, sourceId, {start = 0, duration = 2, music = false, filter = ''} = {}) {
  const file = `${id}.mp3`;
  const audioFilter = music ? 'loudnorm=I=-20:TP=-3:LRA=9' : `silenceremove=start_periods=1:start_duration=0.006:start_threshold=-42dB,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-42dB,areverse,highpass=f=65,loudnorm=I=-20:TP=-3:LRA=7${filter ? ',' + filter : ''}`;
  run(['-ss', String(start), '-i', path.join(source, input), '-t', String(duration), '-af', `${audioFilter},alimiter=limit=0.65:level=false,volume=0.8`, '-ar', '44100', '-ac', music ? '2' : '1', '-b:a', music ? '160k' : '96k', path.join(output, file)]);
  const stats = run(['-i', path.join(output, file), '-af', 'astats=metadata=1:reset=0', '-f', 'null', '-']);
  const length = stats.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const seconds = length ? +length[1] * 3600 + +length[2] * 60 + +length[3] : 0;
  const peak = Number(stats.match(/Peak level dB: ([-\d.]+)/)?.[1] || -99);
  if (!seconds || peak > -.5) throw new Error(`Invalid or clipping audio ${id}: ${seconds}s / ${peak} dB`);
  records.push({id, file: `/audio/${file}`, source: sourceId, original: input, seconds, peakDb: peak, edits: `Selected from ${start}s, max ${duration}s; ${audioFilter}; final limiter 0.65, gain 0.8; encoded MP3`});
}
encode('music-lakeside', 'lakeside.mp3', 'isao', {music: true, duration: 300});
encode('music-mirrors', 'samurai/Samurai-Nights-Demo.mp3', 'samurai', {music: true, duration: 300});
encode('music-snow', 'samurai/SingleLoops/Base-L1-Qin.mp3', 'samurai', {music: true, duration: 300});
const effectFiles = {
  swing: ['rpg/Audio/knifeSlice.ogg', 'rpg'], swing2: ['rpg/Audio/knifeSlice2.ogg', 'rpg'],
  dash: ['rpg/Audio/cloth1.ogg', 'rpg'], smoke: ['rpg/Audio/clothBelt2.ogg', 'rpg'],
  impact: ['impacts/Audio/impactPunch_medium_000.ogg', 'impacts'], impact2: ['impacts/Audio/impactPunch_heavy_001.ogg', 'impacts'],
  parry: ['impacts/Audio/impactMetal_heavy_000.ogg', 'impacts'], guard: ['impacts/Audio/impactPlate_light_000.ogg', 'impacts'],
  break: ['impacts/Audio/impactPlank_medium_001.ogg', 'impacts'], warning: ['impacts/Audio/impactBell_heavy_001.ogg', 'impacts'],
  ice: ['impacts/Audio/impactGlass_heavy_001.ogg', 'impacts'], step: ['impacts/Audio/footstep_concrete_001.ogg', 'impacts'],
  water: ['water/splash_08.ogg', 'water'], water2: ['water/splash_12.ogg', 'water'],
  lightning: ['electric.ogg', 'electric'], fire: ['magic.ogg', 'magic'],
};
for (const [name, [file, id]] of Object.entries(effectFiles)) encode(name, file, id, {duration: name === 'lightning' ? 1.5 : 2});
const voices = {
  kakashi: ['3grunt3', '3grunt4', '3grunt5', '3yell12', '3grunt1', '3yell7'],
  naruto: ['1yell1', '1yell8', '1yell9', '1yell13', '1yell2', '1yell14'],
  sasuke: ['2yell1', '2yell3', '2yell10', '2yell8', '2yell2', '2yell11'],
  zabuza: ['yell6', 'yell9', 'yell12', 'yell3', 'yell10', 'yell13'],
  haku: ['3grunt4', '3grunt5', '3grunt3', '3yell15', '3grunt2', '3yell12'],
};
for (const [character, files] of Object.entries(voices)) for (let i = 0; i < files.length; i++) {
  const rate = {kakashi: .95, naruto: 1.15, sasuke: 1.05, zabuza: .87, haku: 1.22}[character];
  encode(`voice-${character}-${i}`, `grunts/yelling sounds/${files[i]}.wav`, 'grunts', {duration: i === 5 ? 2 : 1.25, filter: `asetrate=${Math.round(44100 * rate)},aresample=44100,afade=t=in:d=0.005,afade=t=out:st=${i === 5 ? 1.7 : 1.0}:d=0.18`});
}
for (const [i, [start, duration]] of [[.19, .44], [1.04, .68], [2.30, .58], [9.40, .85], [11.80, .9], [18.24, 1.28]].entries()) {
  encode(`voice-sakura-${i}`, 'female.mp3', 'female', {start, duration});
}
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({version: 2, sources, records}, null, 2) + '\n');
console.log(JSON.stringify({files: records.length, totalBytes: records.reduce((n, r) => n + fs.statSync(path.join(root, 'public', r.file)).size, 0), peakMaxDb: Math.max(...records.map(r => r.peakDb)), music: records.filter(r => r.id.startsWith('music'))}, null, 2));
