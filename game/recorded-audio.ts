import manifest from '../public/audio/manifest.json';
import type {CharacterId, EffectName} from './combat-core';
export interface AudioSettings {muted: boolean; musicVolume: number; effectsVolume: number; voiceVolume: number;}
type Track = 'lakeside' | 'mirrors' | 'snow';
interface VoiceNode {source: AudioBufferSourceNode; gain: GainNode; group: 'effects' | 'voice';}
interface MusicNode {source: AudioBufferSourceNode; gain: GainNode; track: Track; started: number; offset: number;}

/** Decoded recordings only. No continuously running oscillators or generated drone. */
export class RecordedAudio {
  context: AudioContext | null = null;
  buffers = new Map<string, AudioBuffer>(); nodes = new Set<VoiceNode>(); music: MusicNode | null = null;
  private master: GainNode | null = null; private effects: GainNode | null = null; private voices: GainNode | null = null; private musicBus: GainNode | null = null;
  private loadPromise: Promise<void> | null = null; private disposed = false; private playing = false;
  private track: Track = 'lakeside'; private offset = 0; private lastVoice = new Map<CharacterId, number>();
  private lastEffect = new Map<string, number>(); private variant = new Map<string, number>(); private fading = new Set<MusicNode>();
  missing: string[] = [];
  constructor(private settings: () => AudioSettings) {}
  async unlock() {
    if (this.disposed) return;
    if (!this.context) {
      const Ctx = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      if (!Ctx) return;
      this.context = new Ctx(); this.master = this.context.createGain();
      const compressor = this.context.createDynamicsCompressor(); compressor.threshold.value = -8; compressor.knee.value = 6; compressor.ratio.value = 5;
      this.master.connect(compressor); compressor.connect(this.context.destination);
      this.effects = this.context.createGain(); this.voices = this.context.createGain(); this.musicBus = this.context.createGain();
      this.effects.connect(this.master); this.voices.connect(this.master); this.musicBus.connect(this.master);
      const context = this.context;
      this.loadPromise = Promise.all(manifest.records.map(async entry => {
        try {const response = await fetch(entry.file); if (!response.ok) throw new Error(String(response.status));
          const buffer = await context.decodeAudioData(await response.arrayBuffer());
          if (!this.disposed) this.buffers.set(entry.id, buffer);
        } catch {if (!this.disposed) this.missing.push(entry.id);}
      })).then(() => {if (this.playing && !this.disposed) this.startMusic();});
    }
    if (this.context.state === 'suspended') await this.context.resume().catch(() => {});
    this.volumes(); return this.loadPromise;
  }
  volumes() {
    const c = this.context; if (!c || !this.master) return;
    const settings = this.settings();
    this.master.gain.setTargetAtTime(settings.muted ? 0 : .85, c.currentTime, .04);
    this.effects?.gain.setTargetAtTime(settings.effectsVolume, c.currentTime, .05);
    this.voices?.gain.setTargetAtTime(settings.voiceVolume, c.currentTime, .05);
    this.musicBus?.gain.setTargetAtTime(settings.musicVolume * .66, c.currentTime, .08);
  }
  sync(playing: boolean) {
    this.volumes(); if (playing === this.playing) return;
    this.playing = playing;
    if (playing) {void this.context?.resume().catch(() => {}); this.startMusic();}
    else {this.stopEffects(); this.stopMusic(true);}
  }
  setTrack(track: Track) {
    if (this.track === track) return;
    this.track = track; this.offset = 0;
    const old = this.music; this.music = null;
    if (old && this.context) {
      this.fading.add(old); old.gain.gain.cancelScheduledValues(this.context.currentTime);
      old.gain.gain.setTargetAtTime(0, this.context.currentTime, .16);
      old.source.stop(this.context.currentTime + .75);
      // Any earlier crossfade is stopped immediately: at most two music sources.
      for (const fading of this.fading) if (fading !== old) this.disposeMusic(fading);
    }
    if (this.playing) this.startMusic();
  }
  private loopBuffer(buffer: AudioBuffer) {
    // A short equal-power seam crossfade avoids clicks in decoded MP3 loops.
    const context = this.context!; const seam = Math.min(Math.floor(buffer.sampleRate * .12), Math.floor(buffer.length / 8));
    const loop = context.createBuffer(buffer.numberOfChannels, buffer.length - seam, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const input = buffer.getChannelData(ch), out = loop.getChannelData(ch); out.set(input.subarray(seam));
      for (let i = 0; i < seam; i++) {const t = i / seam; const at = out.length - seam + i;
        out[at] = out[at] * Math.cos(t * Math.PI / 2) + input[i] * Math.sin(t * Math.PI / 2);}
    }
    return loop;
  }
  private startMusic() {
    const context = this.context, key = `music-${this.track}`; if (!context || !this.musicBus || this.music || !this.playing) return;
    let buffer = this.buffers.get(`${key}-loop`);
    if (!buffer) {const raw = this.buffers.get(key); if (!raw) return; buffer = this.loopBuffer(raw); this.buffers.set(`${key}-loop`, buffer);}
    const source = context.createBufferSource(), gain = context.createGain(); source.buffer = buffer; source.loop = true;
    gain.gain.setValueAtTime(0, context.currentTime); gain.gain.linearRampToValueAtTime(1, context.currentTime + .75);
    source.connect(gain); gain.connect(this.musicBus);
    const node: MusicNode = {source, gain, track: this.track, started: context.currentTime, offset: this.offset % buffer.duration};
    this.music = node; source.onended = () => {source.disconnect(); gain.disconnect(); this.fading.delete(node);}; source.start(0, node.offset);
  }
  private disposeMusic(node: MusicNode) {try {node.source.stop();} catch {} node.source.disconnect(); node.gain.disconnect(); this.fading.delete(node);}
  private stopMusic(preserve: boolean) {
    if (this.music) {
      if (preserve && this.context) this.offset = this.music.offset + this.context.currentTime - this.music.started;
      this.disposeMusic(this.music); this.music = null;
    }
    for (const node of this.fading) this.disposeMusic(node);
  }
  effect(name: EffectName | 'impact2' | 'water2' | 'swing2', volume = 1, rate = 1) {
    const now = this.context?.currentTime || 0;
    if (now - (this.lastEffect.get(name) ?? -100) < (name === 'step' ? .13 : .055)) return;
    this.lastEffect.set(name, now); this.playBuffer(name, 'effects', volume * .76, rate);
  }
  voice(character: CharacterId, kind: 'attack' | 'cast' | 'hurt' | 'defeat') {
    const now = this.context?.currentTime || 0, last = this.lastVoice.get(character) ?? -100;
    if (now - last < (kind === 'hurt' ? .9 : 1.15)) return;
    this.lastVoice.set(character, now);
    const index = this.variant.get(character) || 0; this.variant.set(character, index + 1);
    const clip = kind === 'attack' ? index % 3 : kind === 'cast' ? 3 : kind === 'hurt' ? 4 : 5;
    this.playBuffer(`voice-${character}-${clip}`, 'voice', .8, 1);
  }
  private playBuffer(id: string, group: 'effects' | 'voice', volume: number, rate: number) {
    const c = this.context, buffer = this.buffers.get(id), bus = group === 'effects' ? this.effects : this.voices;
    if (!this.playing || !c || !buffer || !bus || this.disposed) return;
    const groupNodes = [...this.nodes].filter(n => n.group === group), limit = group === 'effects' ? 10 : 3;
    if (groupNodes.length >= limit) this.stopNode(groupNodes[0]);
    const source = c.createBufferSource(), gain = c.createGain(); source.buffer = buffer; source.playbackRate.value = rate;
    gain.gain.value = volume; source.connect(gain); gain.connect(bus);
    const node: VoiceNode = {source, gain, group}; this.nodes.add(node);
    source.onended = () => {this.nodes.delete(node); source.disconnect(); gain.disconnect();}; source.start();
  }
  private stopNode(node: VoiceNode) {try {node.source.stop();} catch {} node.source.disconnect(); node.gain.disconnect(); this.nodes.delete(node);}
  stopEffects() {for (const node of this.nodes) this.stopNode(node);}
  reset() {this.stopEffects(); this.lastEffect.clear(); this.lastVoice.clear(); this.offset = 0; this.stopMusic(false); if (this.playing) this.startMusic();}
  status() {return {loaded: this.buffers.size, missing: this.missing, effects: [...this.nodes].filter(n => n.group === 'effects').length,
    voices: [...this.nodes].filter(n => n.group === 'voice').length, music: (this.music ? 1 : 0) + this.fading.size, context: this.context?.state || 'locked'};}
  destroy() {this.disposed = true; this.playing = false; this.stopEffects(); this.stopMusic(false); this.buffers.clear(); void this.context?.close().catch(() => {}); this.context = null;}
}
