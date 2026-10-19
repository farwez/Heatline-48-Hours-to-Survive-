import * as THREE from 'three';

export interface CameraOptions {
  distance?: number;
  minDistance?: number;
  maxDistance?: number;
  sensitivityX?: number;
  sensitivityY?: number;
  shoulderOffset?: number; // X offset for cinematic over-the-shoulder look
  targetHeight?: number;   // Y offset above player root (chest/head)
}

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private target: THREE.Object3D;
  private collisionObjects: THREE.Object3D[] = [];

  // Spherical rotation angles
  private currentYaw: number = 0;       // horizontal angle (radians)
  private currentPitch: number = 0.25;  // vertical angle (radians)
  private targetYaw: number = 0;
  private targetPitch: number = 0.25;

  // Zoom distance
  private currentDistance: number = 3.6;
  private targetDistance: number = 3.6;
  private minDistance: number = 1.4;
  private maxDistance: number = 6.5;

  // Sensitivity
  private sensitivityX: number = 0.0022;
  private sensitivityY: number = 0.0020;
  private shoulderOffset: number = 0.28;
  private targetHeight: number = 1.35;

  // Vectors for internal calculations to avoid per-frame allocations
  private targetPos = new THREE.Vector3();
  private idealCamPos = new THREE.Vector3();
  private actualCamPos = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
  private rayDirection = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, target: THREE.Object3D, options: CameraOptions = {}) {
    this.camera = camera;
    this.target = target;

    if (options.distance !== undefined) this.targetDistance = this.currentDistance = options.distance;
    if (options.minDistance !== undefined) this.minDistance = options.minDistance;
    if (options.maxDistance !== undefined) this.maxDistance = options.maxDistance;
    if (options.sensitivityX !== undefined) this.sensitivityX = options.sensitivityX;
    if (options.sensitivityY !== undefined) this.sensitivityY = options.sensitivityY;
    if (options.shoulderOffset !== undefined) this.shoulderOffset = options.shoulderOffset;
    if (options.targetHeight !== undefined) this.targetHeight = options.targetHeight;

    this.raycaster.near = 0.1;
    this.raycaster.far = this.maxDistance;
  }

  public setCollisionObjects(objects: THREE.Object3D[]): void {
    this.collisionObjects = objects;
  }

  public handleInput(deltaMouseX: number, deltaMouseY: number, wheelDelta: number): void {
    // Update yaw & pitch
    this.targetYaw -= deltaMouseX * this.sensitivityX;
    this.targetPitch += deltaMouseY * this.sensitivityY;

    // Clamp pitch between -10 deg and +75 deg
    const minPitch = -0.15; // slightly look up from low angle
    const maxPitch = 1.35;  // high bird-eye angle
    this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, minPitch, maxPitch);

    // Zoom
    if (wheelDelta !== 0) {
      this.targetDistance += wheelDelta * 0.45;
      this.targetDistance = THREE.MathUtils.clamp(this.targetDistance, this.minDistance, this.maxDistance);
    }
  }

  public getYaw(): number {
    return this.currentYaw;
  }

  public setSensitivity(value: number): void {
    this.sensitivityX = .0022 * value;
    this.sensitivityY = .0020 * value;
  }

  public update(delta: number): void {
    // Damping rotation angles
    const rotDamp = 1.0 - Math.exp(-24 * delta);
    this.currentYaw = THREE.MathUtils.lerp(this.currentYaw, this.targetYaw, rotDamp);
    this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, this.targetPitch, rotDamp);

    const distDamp = 1.0 - Math.exp(-18 * delta);
    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, this.targetDistance, distDamp);

    // Get current target position (with shoulder and height offset)
    this.target.getWorldPosition(this.targetPos);
    this.targetPos.y += this.targetHeight;

    // Apply right-shoulder offset rotated by current yaw
    const shoulderX = Math.cos(this.currentYaw) * this.shoulderOffset;
    const shoulderZ = -Math.sin(this.currentYaw) * this.shoulderOffset;
    this.targetPos.x += shoulderX;
    this.targetPos.z += shoulderZ;

    // Calculate ideal camera position based on spherical coordinates
    const horizontalDist = this.currentDistance * Math.cos(this.currentPitch);
    const verticalDist = this.currentDistance * Math.sin(this.currentPitch);

    this.idealCamPos.set(
      this.targetPos.x + horizontalDist * Math.sin(this.currentYaw),
      this.targetPos.y + verticalDist,
      this.targetPos.z + horizontalDist * Math.cos(this.currentYaw)
    );

    // Collision Raycast to prevent clipping into walls/ground
    let finalDistance = this.currentDistance;
    this.rayDirection.subVectors(this.idealCamPos, this.targetPos);
    const maxRayDist = this.rayDirection.length();

    if (maxRayDist > 0.001) {
      this.rayDirection.normalize();
      this.raycaster.set(this.targetPos, this.rayDirection);
      this.raycaster.far = maxRayDist;

      if (this.collisionObjects.length > 0) {
        const hits = this.raycaster.intersectObjects(this.collisionObjects, true);
        if (hits.length > 0) {
          const hit = hits[0];
          // Pull camera in front of hit surface
          finalDistance = Math.max(this.minDistance, hit.distance - 0.25);
        }
      }
    }

    // Set actual camera position
    const effectiveHorizontal = finalDistance * Math.cos(this.currentPitch);
    const effectiveVertical = finalDistance * Math.sin(this.currentPitch);

    this.actualCamPos.set(
      this.targetPos.x + effectiveHorizontal * Math.sin(this.currentYaw),
      this.targetPos.y + effectiveVertical,
      this.targetPos.z + effectiveHorizontal * Math.cos(this.currentYaw)
    );

    this.camera.position.copy(this.actualCamPos);
    this.camera.lookAt(this.targetPos);
  }
}
