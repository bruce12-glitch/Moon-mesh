/**
 * Global Ambient Forest Sound Controller for the 3D Moon Picnic Scene.
 * Synchronizes audio playback state across the global header button and all 3D Diorama controls.
 */

type AudioListener = (isPlaying: boolean) => void;

class ForestAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private chimeInterval: number | null = null;
  private cricketInterval: number | null = null;
  private isPlaying = false;
  private listeners = new Set<AudioListener>();

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.isPlaying);
    }
  }

  public toggle(forceState?: boolean): boolean {
    const target = typeof forceState === 'boolean' ? forceState : !this.isPlaying;
    if (target === this.isPlaying) {
      return this.isPlaying;
    }
    if (target) {
      this.start();
    } else {
      this.stop();
    }
    return this.isPlaying;
  }

  public start(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.ctx) {
        const ctx = new AudioCtx();
        this.ctx = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
        masterGain.connect(ctx.destination);
        this.masterGain = masterGain;

        // 1. Warm brown-noise night forest breeze + stereo leaf rustle
        const bufferSize = ctx.sampleRate * 4;
        const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const output = noiseBuffer.getChannelData(ch);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + 0.018 * white) / 1.018;
            lastOut = output[i];
            output[i] *= 0.22;
          }
        }

        const windSource = ctx.createBufferSource();
        windSource.buffer = noiseBuffer;
        windSource.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(310, ctx.currentTime);
        windFilter.Q.setValueAtTime(1.35, ctx.currentTime);

        // Slow LFO modulating the forest breeze filter for organic breathing
        const windLfo = ctx.createOscillator();
        const windLfoGain = ctx.createGain();
        windLfo.type = 'sine';
        windLfo.frequency.setValueAtTime(0.14, ctx.currentTime);
        windLfoGain.gain.setValueAtTime(125, ctx.currentTime);
        windLfo.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency);
        windLfo.start();

        windSource.connect(windFilter);
        windFilter.connect(masterGain);
        windSource.start();

        // 2. Cozy pentatonic / Fmaj9 wooden wind-chime / kalimba plucks
        const chimeNotes = [261.63, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
        const triggerChime = () => {
          if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
          const now = this.ctx.currentTime;
          const freq = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];

          const osc = this.ctx.createOscillator();
          const harmonic = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          harmonic.type = 'triangle';
          harmonic.frequency.setValueAtTime(freq * 2, now);

          const harmonicGain = this.ctx.createGain();
          harmonicGain.gain.setValueAtTime(0.018, now);

          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.exponentialRampToValueAtTime(0.075, now + 0.16);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

          osc.connect(noteGain);
          harmonic.connect(harmonicGain);
          harmonicGain.connect(noteGain);
          noteGain.connect(this.masterGain);

          osc.start(now);
          harmonic.start(now);
          osc.stop(now + 3.3);
          harmonic.stop(now + 3.3);
        };

        // 3. Soft distant night forest cricket chirps
        const triggerCricket = () => {
          if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
          const now = this.ctx.currentTime;
          const baseFreq = 3650 + Math.random() * 240;
          for (let pulse = 0; pulse < 3; pulse++) {
            const start = now + pulse * 0.065;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, start);
            g.gain.setValueAtTime(0.0001, start);
            g.gain.exponentialRampToValueAtTime(0.012, start + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.055);
          }
        };

        this.chimeInterval = window.setInterval(triggerChime, 2400);
        this.cricketInterval = window.setInterval(triggerCricket, 3800);
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      if (this.masterGain && this.ctx) {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setTargetAtTime(0.32, this.ctx.currentTime, 0.35);
      }

      this.isPlaying = true;
      this.notify();
    } catch {
      this.isPlaying = false;
      this.notify();
    }
  }

  public stop(): void {
    if (this.ctx && this.masterGain) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
      } catch {
        // Ignore audio context timing errors
      }
    }
    this.isPlaying = false;
    this.notify();
  }
}

export const forestAudio = new ForestAudioManager();
