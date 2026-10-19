import { Engine } from './core/Engine';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Fatal: Could not find #game-canvas element.');
    return;
  }

  try {
    const engine = new Engine(canvas);
    engine.start();
    console.log('HEATLINE campaign initialized.');
  } catch (error) {
    console.error('Failed to initialize Heatline Engine:', error);
    const app = document.getElementById('app');
    if (app) { app.style.pointerEvents = 'auto'; app.innerHTML = '<main style="padding:40px;color:#eee;background:#182620"><h1>HEATLINE</h1><p>The 3D renderer could not start. Enable hardware acceleration in your browser, then reload.</p><button onclick="location.reload()">Try again</button></main>'; }
  }
});
