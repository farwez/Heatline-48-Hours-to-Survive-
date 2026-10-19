export class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private volumes = { master: .65, music: .3, effects: .7 };

  public setVolumes(master: number, music: number, effects: number): void {
    this.volumes = { master, music, effects };
    if (this.masterGain) this.masterGain.gain.value = master;
    if (this.effectsGain) this.effectsGain.gain.value = effects;
    if (this.ambientGain) this.ambientGain.gain.value = .2 * music;
  }

  constructor() {
    // Lazy initialize on first user gesture
  }

  private initContext(): void {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.effectsGain = this.ctx.createGain();
      this.effectsGain.gain.value = this.volumes.effects;
      this.effectsGain.connect(this.masterGain);

      this.createNoiseBuffer();
      this.startAmbientHeatDrone();
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext could not be initialized:', e);
    }
  }

  private createNoiseBuffer(): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  private startAmbientHeatDrone(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    // Warm ambient wind drone
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;

    // Low-pass filter for heatwave wind
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(.2 * this.volumes.music, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    noise.start();

    // Subtle sub-bass drone for heat pressure
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    osc.connect(subGain);
    subGain.connect(this.ambientGain);
    osc.start();
  }

  public playFootstep(isSprint: boolean = false, isCrouch: boolean = false): void {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    filter.type = 'bandpass';

    const baseFreq = isCrouch ? 110 : isSprint ? 170 : 135;
    const pitchJitter = (Math.random() - 0.5) * 20;
    osc.frequency.setValueAtTime(baseFreq + pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + (isSprint ? 0.12 : 0.08));

    filter.frequency.setValueAtTime(800, t);
    filter.Q.setValueAtTime(1.5, t);

    const volume = isCrouch ? 0.04 : isSprint ? 0.16 : 0.09;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isSprint ? 0.12 : 0.09));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain!);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playJump(): void {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.15);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.effectsGain!);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  public playLand(): void {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.effectsGain!);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playUIInteract(): void {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.setValueAtTime(880, t + 0.05); // A5

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.effectsGain!);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public toggleMute(): boolean {
    this.initContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  public isSoundEnabled(): boolean {
    return !this.isMuted;
  }
}

