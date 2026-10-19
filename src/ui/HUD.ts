import { EventBus } from '../core/EventBus';
import { InputManager } from '../core/InputManager';
import { SoundSynthesizer } from '../audio/SoundSynthesizer';
import { PlayerStats } from '../player/PlayerController';

export class HUD {
  private eventBus = EventBus.getInstance();
  private inputManager: InputManager;
  private audio: SoundSynthesizer;

  // DOM Elements
  private barHealth!: HTMLElement;
  private valHealth!: HTMLElement;
  private barHydration!: HTMLElement;
  private valHydration!: HTMLElement;
  private barStamina!: HTMLElement;
  private valStamina!: HTMLElement;
  private barHeat!: HTMLElement;
  private valHeat!: HTMLElement;

  private diagFps!: HTMLElement;
  private diagState!: HTMLElement;
  private diagSpeed!: HTMLElement;
  private diagPos!: HTMLElement;

  private interactionPrompt!: HTMLElement;
  private promptText!: HTMLElement;
  private btnPointerLock!: HTMLButtonElement;
  private btnToggleAudio!: HTMLButtonElement;

  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();
  private currentFps: number = 60;

  constructor(inputManager: InputManager, audio: SoundSynthesizer) {
    this.inputManager = inputManager;
    this.audio = audio;
    this.bindDom();
    this.initEvents();
  }

  private bindDom(): void {
    this.barHealth = document.getElementById('bar-health')!;
    this.valHealth = document.getElementById('val-health')!;
    this.barHydration = document.getElementById('bar-hydration')!;
    this.valHydration = document.getElementById('val-hydration')!;
    this.barStamina = document.getElementById('bar-stamina')!;
    this.valStamina = document.getElementById('val-stamina')!;
    this.barHeat = document.getElementById('bar-heat')!;
    this.valHeat = document.getElementById('val-heat')!;

    this.diagFps = document.getElementById('diag-fps')!;
    this.diagState = document.getElementById('diag-state')!;
    this.diagSpeed = document.getElementById('diag-speed')!;
    this.diagPos = document.getElementById('diag-pos')!;

    this.interactionPrompt = document.getElementById('interaction-prompt')!;
    this.promptText = document.getElementById('prompt-text')!;
    this.btnPointerLock = document.getElementById('btn-pointer-lock') as HTMLButtonElement;
    this.btnToggleAudio = document.getElementById('btn-toggle-audio') as HTMLButtonElement;

    this.btnPointerLock.addEventListener('click', () => {
      this.inputManager.requestPointerLock();
    });

    this.btnToggleAudio.addEventListener('click', () => {
      const enabled = this.audio.toggleMute();
      this.btnToggleAudio.textContent = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    });

    this.inputManager.onPointerLockChange(isLocked => {
      this.btnPointerLock.textContent = isLocked ? '🔓 Press ESC to Unlock' : '🔒 Lock Mouse Look';
    });
  }

  private initEvents(): void {
    // Listen for player stats
    this.eventBus.on('player:stats', (stats: PlayerStats) => {
      this.updateStats(stats);
    });

    // Listen for diagnostics
    this.eventBus.on('player:diag', (diag: { state: string; speed: string; position: string }) => {
      if (this.diagState) this.diagState.textContent = diag.state;
      if (this.diagSpeed) this.diagSpeed.textContent = diag.speed;
      if (this.diagPos) this.diagPos.textContent = diag.position;
    });

    // Listen for interaction prompts
    this.eventBus.on('interaction:prompt', (data: { active: boolean; text?: string }) => {
      if (data.active) {
        this.promptText.textContent = data.text || 'Inspect';
        this.interactionPrompt.classList.add('prompt-active');
      } else {
        this.interactionPrompt.classList.remove('prompt-active');
      }
    });

    // Listen for interaction trigger
    this.eventBus.on('interaction:triggered', (data: { object: any }) => {
      const prompt = data.object?.userData?.prompt || 'Item';
      this.showToast(`Inspected: ${prompt}`);
    });
  }

  private updateStats(stats: PlayerStats): void {
    const health = Math.round(stats.health);
    const hydration = Math.round(stats.hydration);
    const stamina = Math.round(stats.stamina);
    const heat = Math.round(stats.heatExposure);

    if (this.barHealth) this.barHealth.style.width = `${health}%`;
    if (this.valHealth) this.valHealth.textContent = `${health}%`;

    if (this.barHydration) this.barHydration.style.width = `${hydration}%`;
    if (this.valHydration) this.valHydration.textContent = `${hydration}%`;

    if (this.barStamina) this.barStamina.style.width = `${stamina}%`;
    if (this.valStamina) this.valStamina.textContent = `${stamina}%`;

    if (this.barHeat) this.barHeat.style.width = `${heat}%`;
    if (this.valHeat) this.valHeat.textContent = `${heat}%`;
  }

  public showToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(22, 14, 10, 0.95);
      border: 1px solid #ff9800;
      color: #ffe0b2;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(0,0,0,0.8);
      z-index: 100;
      pointer-events: none;
      animation: fadeInOut 3s forwards;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  public updateFps(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
      if (this.diagFps) {
        this.diagFps.textContent = `${this.currentFps}`;
      }
    }
  }
}
