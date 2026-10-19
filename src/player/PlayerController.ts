import * as THREE from 'three';
import { CharacterModel } from './CharacterModel';
import { CharacterAnimator, LocomotionState } from './CharacterAnimator';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { InputManager } from '../core/InputManager';
import { SoundSynthesizer } from '../audio/SoundSynthesizer';
import { EventBus } from '../core/EventBus';

export interface PlayerStats {
  health: number;
  hydration: number;
  stamina: number;
  heatExposure: number;
}

export class PlayerController {
  public model: CharacterModel;
  public animator: CharacterAnimator;
  public cameraController: ThirdPersonCamera;
  private inputManager: InputManager;
  private audio: SoundSynthesizer;
  private eventBus = EventBus.getInstance();

  // Survival attributes
  public stats: PlayerStats = {
    health: 100,
    hydration: 85,
    stamina: 100,
    heatExposure: 28
  };

  // Movement physics
  private velocity = new THREE.Vector3();
  private isGrounded: boolean = true;
  private verticalVelocity: number = 0;
  private readonly gravity: number = 22.0;
  private readonly jumpForce: number = 7.0;

  // Speeds (m/s)
  private readonly walkSpeed: number = 3.5;
  private readonly sprintSpeed: number = 7.8;
  private readonly crouchSpeed: number = 1.8;

  // World collision references
  private collisionObjects: THREE.Object3D[] = [];
  private groundRaycaster = new THREE.Raycaster();
  private interactionRaycaster = new THREE.Raycaster();
  private interactables: THREE.Object3D[] = [];
  public currentInteractable: THREE.Object3D | null = null;

  // Particle effects for footstep dust
  private particleGroup: THREE.Group;
  private dustParticles: { mesh: THREE.Mesh; life: number; maxLife: number; vel: THREE.Vector3 }[] = [];

  // Temporary vectors
  private moveDir = new THREE.Vector3();
  private targetRotation = new THREE.Quaternion();
  private tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private rayOrigin = new THREE.Vector3();
  private downDir = new THREE.Vector3(0, -1, 0);

  constructor(
    model: CharacterModel,
    cameraController: ThirdPersonCamera,
    inputManager: InputManager,
    audio: SoundSynthesizer,
    scene: THREE.Scene
  ) {
    this.model = model;
    this.cameraController = cameraController;
    this.inputManager = inputManager;
    this.audio = audio;

    // Dust particles container
    this.particleGroup = new THREE.Group();
    scene.add(this.particleGroup);

    // Initialize animator with audio & dust callbacks
    this.animator = new CharacterAnimator(this.model.rig, {
      onFootstep: (isSprint, isCrouch, footPos) => {
        this.audio.playFootstep(isSprint, isCrouch);
        this.spawnDustPuff(footPos, isSprint);
      }
    });

    this.groundRaycaster.far = 1.5;
    this.interactionRaycaster.far = 2.8;
  }

  public setCollisionObjects(objects: THREE.Object3D[]): void {
    this.collisionObjects = objects;
    this.cameraController.setCollisionObjects(objects);
  }

  public setInteractables(objects: THREE.Object3D[]): void {
    this.interactables = objects;
  }

  public resetMotion(): void { this.velocity.set(0, 0, 0); this.verticalVelocity = 0; this.isGrounded = true; }

  public update(delta: number): void {
    const input = this.inputManager.getState();

    // 1. Update Camera look from mouse delta
    this.cameraController.handleInput(input.deltaMouseX, input.deltaMouseY, input.wheelDelta);
    this.inputManager.resetDeltas();

    // 2. Process Stamina & Movement Modes
    let targetSpeed = this.walkSpeed;

    if (input.crouch) {
      targetSpeed = this.crouchSpeed;
      // Recover stamina slowly while crouching
      this.stats.stamina = Math.min(100, this.stats.stamina + 20 * delta);
    } else if (input.sprint && this.stats.stamina > 5 && (input.forward || input.backward || input.left || input.right)) {
      targetSpeed = this.sprintSpeed;
      this.stats.stamina = Math.max(0, this.stats.stamina - 24 * delta);
      // Sprinting in severe heat increases heat exposure
      this.stats.heatExposure = Math.min(100, this.stats.heatExposure + 1.2 * delta);
    } else {
      // Natural stamina regeneration during walk
      this.stats.stamina = Math.min(100, this.stats.stamina + 16 * delta);
      targetSpeed = this.walkSpeed;
    }

    // Emit stamina changes
    this.eventBus.emit('player:stats', this.stats);

    // 3. Calculate Movement Vector relative to Camera Yaw
    const camYaw = this.cameraController.getYaw();
    this.moveDir.set(0, 0, 0);

    if (input.forward) this.moveDir.z -= 1;
    if (input.backward) this.moveDir.z += 1;
    if (input.left) this.moveDir.x -= 1;
    if (input.right) this.moveDir.x += 1;

    const hasInput = this.moveDir.lengthSq() > 0.001;

    if (hasInput) {
      this.moveDir.normalize();

      // Rotate direction vector by camera yaw
      // Camera forward is in -Z direction when yaw = 0
      const rotatedX = this.moveDir.x * Math.cos(camYaw) + this.moveDir.z * Math.sin(camYaw);
      const rotatedZ = -this.moveDir.x * Math.sin(camYaw) + this.moveDir.z * Math.cos(camYaw);

      this.moveDir.set(rotatedX, 0, rotatedZ).normalize();

      // Smooth acceleration
      const accelRate = 18.0;
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, this.moveDir.x * targetSpeed, Math.min(1, delta * accelRate));
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, this.moveDir.z * targetSpeed, Math.min(1, delta * accelRate));

      // Smooth rotate player mesh towards movement direction
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.tempEuler.set(0, angle, 0);
      this.targetRotation.setFromEuler(this.tempEuler);
      this.model.group.quaternion.slerp(this.targetRotation, delta * 14.0);
    } else {
      // Smooth deceleration
      const friction = 20.0;
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, delta * friction);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, delta * friction);
    }

    // 4. Jump & Gravity
    if (this.isGrounded) {
      if (input.jump && !input.crouch) {
        this.verticalVelocity = this.jumpForce;
        this.isGrounded = false;
        this.audio.playJump();
      } else {
        this.verticalVelocity = 0;
      }
    } else {
      this.verticalVelocity -= this.gravity * delta;
    }

    // 5. Apply Horizontal Position
    this.model.group.position.x += this.velocity.x * delta;
    this.model.group.position.z += this.velocity.z * delta;
    this.model.group.position.y += this.verticalVelocity * delta;

    // 6. Ground Raycast Collision
    this.handleGroundCollision();

    // 7. Update Animation State
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

    let animState: LocomotionState = 'IDLE';
    if (!this.isGrounded) {
      animState = this.verticalVelocity > 0 ? 'JUMP_ASCENT' : 'JUMP_DESCENT';
    } else if (input.crouch) {
      animState = horizontalSpeed > 0.2 ? 'CROUCH_WALK' : 'CROUCH_IDLE';
    } else if (horizontalSpeed > 6.0) {
      animState = 'SPRINT';
    } else if (horizontalSpeed > 3.8) {
      animState = 'RUN';
    } else if (horizontalSpeed > 0.15) {
      animState = 'WALK';
    }

    this.animator.setState(animState);
    this.animator.update(delta, horizontalSpeed);

    // 8. Update Camera Follow
    this.cameraController.update(delta);

    // 9. Interaction Raycast
    this.updateInteraction(input.interact);

    // 10. Update Particles
    this.updateParticles(delta);

    // Emit diagnostic info
    this.eventBus.emit('player:diag', {
      state: animState,
      speed: horizontalSpeed.toFixed(1) + ' m/s',
      position: `${this.model.group.position.x.toFixed(1)}, ${this.model.group.position.y.toFixed(1)}, ${this.model.group.position.z.toFixed(1)}`
    });
  }

  private handleGroundCollision(): void {
    // Cast ray downwards from slightly above character base
    this.rayOrigin.copy(this.model.group.position);
    this.rayOrigin.y += 0.8;

    this.groundRaycaster.set(this.rayOrigin, this.downDir);
    this.groundRaycaster.far = 1.4;

    const hits = this.groundRaycaster.intersectObjects(this.collisionObjects, true);

    if (hits.length > 0) {
      const groundHit = hits[0];
      const groundY = groundHit.point.y;

      if (this.model.group.position.y <= groundY + 0.05) {
        if (!this.isGrounded && this.verticalVelocity < -3.0) {
          this.audio.playLand();
          this.spawnDustPuff(this.model.group.position, true);
        }
        this.model.group.position.y = groundY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    } else {
      // Ground plane fallback (y = 0)
      if (this.model.group.position.y <= 0) {
        if (!this.isGrounded && this.verticalVelocity < -3.0) {
          this.audio.playLand();
          this.spawnDustPuff(this.model.group.position, true);
        }
        this.model.group.position.y = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }
    }
  }

  private updateInteraction(isInteractPressed: boolean): void {
    // Cast forward from character chest to detect interactable items
    const origin = this.model.group.position.clone();
    origin.y += 1.0;

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.model.group.quaternion);
    this.interactionRaycaster.set(origin, forward);

    if (this.interactables.length > 0) {
      const hits = this.interactionRaycaster.intersectObjects(this.interactables, true);
      if (hits.length > 0 && hits[0].distance < 2.5) {
        const target = hits[0].object;
        this.currentInteractable = target;
        const promptText = (target.userData && target.userData.prompt) || 'Inspect Object';
        this.eventBus.emit('interaction:prompt', { active: true, text: promptText });

        if (isInteractPressed) {
          this.audio.playUIInteract();
          this.eventBus.emit('interaction:triggered', { object: target });
        }
        return;
      }
    }

    if (this.currentInteractable) {
      this.currentInteractable = null;
      this.eventBus.emit('interaction:prompt', { active: false });
    }
  }

  private spawnDustPuff(position: THREE.Vector3, isSprint: boolean): void {
    const count = isSprint ? 4 : 2;
    const dustMat = new THREE.MeshBasicMaterial({
      color: 0xc49b71,
      transparent: true,
      opacity: 0.45
    });

    for (let i = 0; i < count; i++) {
      const size = 0.06 + Math.random() * 0.08;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mesh = new THREE.Mesh(geo, dustMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.2,
        position.y + 0.05,
        position.z + (Math.random() - 0.5) * 0.2
      );
      this.particleGroup.add(mesh);

      this.dustParticles.push({
        mesh,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          0.3 + Math.random() * 0.4,
          (Math.random() - 0.5) * 0.4
        )
      });
    }
  }

  private updateParticles(delta: number): void {
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.dustParticles.splice(i, 1);
      } else {
        p.mesh.position.addScaledVector(p.vel, delta);
        const progress = p.life / p.maxLife;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.4;
        p.mesh.scale.setScalar(1 + progress * 1.5);
      }
    }
  }
}
