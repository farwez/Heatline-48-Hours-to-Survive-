export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  crouch: boolean;
  jump: boolean;
  interact: boolean;
  mouseX: number;
  mouseY: number;
  deltaMouseX: number;
  deltaMouseY: number;
  wheelDelta: number;
  isPointerLocked: boolean;
  isMouseDown: boolean;
}

export class InputManager {
  private state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    crouch: false,
    jump: false,
    interact: false,
    mouseX: 0,
    mouseY: 0,
    deltaMouseX: 0,
    deltaMouseY: 0,
    wheelDelta: 0,
    isPointerLocked: false,
    isMouseDown: false
  };

  private domElement: HTMLElement;
  private onLockChangeCallback?: (isLocked: boolean) => void;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.initListeners();
  }

  private initListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);

    this.domElement.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('wheel', this.handleWheel, { passive: false });

    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.sprint = true;
        break;
      case 'KeyC':
        if (!e.repeat) this.state.crouch = !this.state.crouch;
        break;
      case 'Space':
        this.state.jump = true;
        break;
      case 'KeyE':
        this.state.interact = true;
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.sprint = false;
        break;
      case 'Space':
        this.state.jump = false;
        break;
      case 'KeyE':
        this.state.interact = false;
        break;
    }
  };

  private handleBlur = (): void => {
    this.state.forward = false;
    this.state.backward = false;
    this.state.left = false;
    this.state.right = false;
    this.state.sprint = false;
    this.state.jump = false;
    this.state.interact = false;
    this.state.isMouseDown = false;
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.state.isMouseDown = true;
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.state.isMouseDown = false;
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (this.state.isPointerLocked) {
      this.state.deltaMouseX += e.movementX || 0;
      this.state.deltaMouseY += e.movementY || 0;
    } else if (this.state.isMouseDown) {
      this.state.deltaMouseX += e.movementX || 0;
      this.state.deltaMouseY += e.movementY || 0;
    }
    this.state.mouseX = e.clientX;
    this.state.mouseY = e.clientY;
  };

  private handleWheel = (e: WheelEvent): void => {
    this.state.wheelDelta += Math.sign(e.deltaY);
  };

  private handlePointerLockChange = (): void => {
    this.state.isPointerLocked = document.pointerLockElement === this.domElement;
    if (this.onLockChangeCallback) {
      this.onLockChangeCallback(this.state.isPointerLocked);
    }
  };

  public requestPointerLock(): void {
    if (!this.state.isPointerLocked) {
      this.domElement.requestPointerLock().catch(err => {
        console.warn('Pointer lock request denied or not supported:', err);
      });
    } else {
      document.exitPointerLock();
    }
  }

  public onPointerLockChange(cb: (isLocked: boolean) => void): void {
    this.onLockChangeCallback = cb;
  }

  public getState(): InputState {
    return this.state;
  }

  public clear(): void { this.handleBlur(); this.resetDeltas(); }

  /**
   * Resets instantaneous delta values per frame
   */
  public resetDeltas(): void {
    this.state.deltaMouseX = 0;
    this.state.deltaMouseY = 0;
    this.state.wheelDelta = 0;
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.domElement.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('wheel', this.handleWheel);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }
}
