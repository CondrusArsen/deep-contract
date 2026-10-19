// Web Audio engine: buses (music / sfx / ui / alarm), per-cue rate limiting and voice caps, music crossfades,
// ducking under alarms. Buffers are decoded up front with an OfflineAudioContext so the first touch plays at once.
import { audioBytes } from '../assets/loader';
import { CUES, MUSIC, MUSIC_SAMPLES, type CueDef } from './cues';

type Bus = 'music' | 'sfx' | 'ui' | 'alarm';

class AudioEngine {
  ctx: AudioContext | null = null;
  unlocked = false;
  buffers = new Map<string, AudioBuffer>();
  buses: Partial<Record<Bus | 'master' | 'duck', GainNode>> = {};
  vol = { master: 0.8, music: 0.6, sfx: 0.8 };
  last = new Map<string, number>();
  voices = new Map<string, number>();
  music: { key: string; src: AudioBufferSourceNode; gain: GainNode } | null = null;
  musicWanted: string | null = null;
  decoded = false;
  listenerX = 8.5;
  muted = false;
  musicInfo: Record<string, unknown> | null = null;
  stats = { played: 0, failed: 0, decodeErrors: [] as string[] };

  async decodeAll() {
    const OAC: typeof OfflineAudioContext | undefined = (window as unknown as { OfflineAudioContext?: typeof OfflineAudioContext; webkitOfflineAudioContext?: typeof OfflineAudioContext }).OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    const dec = OAC ? new OAC(2, 1, 44100) : null;
    const jobs: Promise<void>[] = [];
    for (const [key, buf] of audioBytes) {
      jobs.push((async () => {
        try {
          const ab = await (dec ? dec.decodeAudioData(buf.slice(0)) : this.ensureCtx().decodeAudioData(buf.slice(0)));
          this.buffers.set(key, ab);
        } catch (e) { this.stats.decodeErrors.push(key); }
      })());
    }
    await Promise.all(jobs);
    this.decoded = true;
  }

  ensureCtx(): AudioContext {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC({ latencyHint: 'interactive' });
    this.ctx = ctx;
    const master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    master.connect(comp).connect(ctx.destination);
    const duck = ctx.createGain(); duck.connect(master);
    const music = ctx.createGain(); music.connect(duck);
    const sfx = ctx.createGain(); sfx.connect(master);
    const ui = ctx.createGain(); ui.connect(master);
    const alarm = ctx.createGain(); alarm.connect(master);
    this.buses = { master, duck, music, sfx, ui, alarm };
    this.applyVolumes();
    return ctx;
  }

  /** Call from a user gesture (pointerdown / keydown / touchend). */
  unlock() {
    const ctx = this.ensureCtx();
    if (ctx.state !== 'running') ctx.resume().catch(() => { /* retried on next gesture */ });
    if (!this.unlocked) {
      // iOS: play a silent buffer inside the gesture
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
      this.unlocked = true;
      if (this.musicWanted) { const m = this.musicWanted; this.musicWanted = null; this.setMusic(m); }
    }
  }

  get running() { return !!this.ctx && this.ctx.state === 'running'; }

  setVolumes(master: number, music: number, sfx: number) { this.vol = { master, music, sfx }; this.applyVolumes(); }
  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.buses.master!.gain.setTargetAtTime(this.muted ? 0 : this.vol.master, t, 0.05);
    this.buses.music!.gain.setTargetAtTime(this.vol.music * 0.8, t, 0.05);
    this.buses.sfx!.gain.setTargetAtTime(this.vol.sfx, t, 0.05);
    this.buses.ui!.gain.setTargetAtTime(this.vol.sfx * 0.9, t, 0.05);
    this.buses.alarm!.gain.setTargetAtTime(Math.max(0.35, this.vol.sfx), t, 0.05);
  }

  duck(seconds: number, depth = 0.3) {
    if (!this.ctx) return;
    const g = this.buses.duck!.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(depth, t, 0.06);
    g.setTargetAtTime(1, t + seconds, 0.6);
  }

  play(cue: string, opt: { x?: number; vol?: number; rate?: number; delay?: number } = {}) {
    const def: CueDef | undefined = CUES[cue];
    if (!def || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const last = this.last.get(cue) ?? -1;
    if (now - last < (def.limit ?? 0.03)) return;
    const active = this.voices.get(cue) ?? 0;
    if (active >= (def.voices ?? 4)) return;
    if (def.synth) { this.last.set(cue, now); this.synth(def.synth, (def.gain ?? 1) * (opt.vol ?? 1), def.bus ?? 'sfx'); this.stats.played++; return; }
    const files = def.files.filter(f => this.buffers.has(f));
    if (!files.length) { this.stats.failed++; return; }
    this.last.set(cue, now);
    const buf = this.buffers.get(files[Math.floor(Math.random() * files.length)])!;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const [p0, p1] = def.pitch ?? [1, 1];
    src.playbackRate.value = (opt.rate ?? 1) * (p0 + Math.random() * (p1 - p0));
    const g = this.ctx.createGain();
    let v = (def.gain ?? 1) * (opt.vol ?? 1);
    let out: AudioNode = g;
    if (opt.x !== undefined && typeof this.ctx.createStereoPanner === 'function') {
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.max(-0.7, Math.min(0.7, (opt.x - this.listenerX) / 10));
      g.connect(p); out = p;
    }
    g.gain.value = v;
    src.connect(g);
    out.connect(this.buses[def.bus ?? 'sfx']!);
    const when = now + (opt.delay ?? 0);
    src.start(when);
    if (def.maxLen) src.stop(when + def.maxLen);
    this.voices.set(cue, active + 1);
    src.onended = () => { this.voices.set(cue, Math.max(0, (this.voices.get(cue) ?? 1) - 1)); };
    this.stats.played++;
    if (def.duck) this.duck(def.duck);
    v = 0;
  }

  /** Original procedural sounds for gaps in the licensed set (hold-to-confirm rise, rally horn, core alarm beep). */
  synth(kind: 'hold' | 'horn' | 'beep', vol: number, bus: Bus) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.connect(this.buses[bus]!);
    if (kind === 'hold') {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator();
      o.type = 'triangle'; o2.type = 'sine';
      o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(880, t + 0.6);
      o2.frequency.setValueAtTime(520, t); o2.frequency.exponentialRampToValueAtTime(1760, t + 0.6);
      out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(vol, t + 0.03); out.gain.setValueAtTime(vol, t + 0.5); out.gain.exponentialRampToValueAtTime(0.0005, t + 0.7);
      const g2 = ctx.createGain(); g2.gain.value = 0.3;
      o.connect(out); o2.connect(g2).connect(out);
      o.start(t); o2.start(t); o.stop(t + 0.75); o2.stop(t + 0.75);
    } else if (kind === 'horn') {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4;
      lp.frequency.setValueAtTime(180, t); lp.frequency.linearRampToValueAtTime(1400, t + 0.35); lp.frequency.exponentialRampToValueAtTime(260, t + 2.2);
      const shaper = ctx.createWaveShaper();
      const curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 2.5); }
      shaper.curve = curve;
      lp.connect(shaper).connect(out);
      for (const [fq, det] of [[55, 0], [55, 9], [110, -6], [82.5, 4]] as const) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fq; o.detune.value = det;
        o.connect(lp); o.start(t); o.stop(t + 2.4);
      }
      out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(vol, t + 0.25); out.gain.setValueAtTime(vol, t + 1.4); out.gain.exponentialRampToValueAtTime(0.0005, t + 2.35);
    } else {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      lp.connect(out);
      [880, 660].forEach((fq, i) => {
        const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fq;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t + i * 0.16); g.gain.linearRampToValueAtTime(vol, t + i * 0.16 + 0.01); g.gain.setValueAtTime(vol, t + i * 0.16 + 0.12); g.gain.linearRampToValueAtTime(0, t + i * 0.16 + 0.14);
        o.connect(g).connect(lp); o.start(t + i * 0.16); o.stop(t + i * 0.16 + 0.16);
      });
      out.gain.value = 1;
    }
  }

  /** Looping one-shot (e.g. drill rumble). Returns a stop function. */
  loop(cue: string, vol = 1): () => void {
    const def = CUES[cue];
    if (!def || !this.ctx || this.ctx.state !== 'running') return () => {};
    const file = def.files.find(f => this.buffers.has(f));
    if (!file) return () => {};
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.get(file)!; src.loop = true;
    const g = this.ctx.createGain(); g.gain.value = 0;
    g.gain.setTargetAtTime((def.gain ?? 1) * vol, this.ctx.currentTime, 0.15);
    src.connect(g).connect(this.buses[def.bus ?? 'sfx']!);
    src.start();
    return () => {
      if (!this.ctx) return;
      g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
      src.stop(this.ctx.currentTime + 1.2);
    };
  }

  setMusic(key: string | null, fade = 2.5) {
    if (!this.ctx || !this.unlocked) { this.musicWanted = key; return; }
    if (this.music?.key === key) return;
    const t = this.ctx.currentTime;
    if (this.music) {
      const old = this.music;
      old.gain.gain.cancelScheduledValues(t);
      old.gain.gain.setValueAtTime(old.gain.gain.value, t);
      old.gain.gain.linearRampToValueAtTime(0, t + fade);
      old.src.stop(t + fade + 0.1);
      this.music = null;
    }
    if (!key) return;
    const m = MUSIC[key];
    const buf = m && this.buffers.get(m.file);
    if (!buf) { this.musicWanted = null; return; }
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    // loop exactly the processed region; tolerate decoders that keep the MP3 encoder delay/padding
    const expected = MUSIC_SAMPLES[key];
    if (expected && buf.length > expected + 16) {
      const extra = buf.length - expected;
      const start = extra >= 1105 ? 1105 : 0;
      src.loopStart = start / buf.sampleRate; src.loopEnd = (start + expected) / buf.sampleRate;
    }
    if (m.loopStart !== undefined) src.loopStart = m.loopStart;
    if (m.loopEnd !== undefined) src.loopEnd = Math.min(buf.duration, m.loopEnd);
    this.musicInfo = { key, length: buf.length, expected: expected ?? 0, loopStart: src.loopStart, loopEnd: src.loopEnd };
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(m.gain ?? 1, t + fade);
    src.connect(g).connect(this.buses.music!);
    src.start(t);
    this.music = { key, src, gain: g };
  }

  suspend() { this.ctx?.suspend().catch(() => {}); }
  resume() { if (this.unlocked) this.ctx?.resume().catch(() => {}); }
}

export const audio = new AudioEngine();
