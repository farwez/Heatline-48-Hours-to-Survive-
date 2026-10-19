import * as THREE from 'three';
import { CharacterRig } from './CharacterModel';

export type LocomotionState =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'SPRINT'
  | 'CROUCH_IDLE'
  | 'CROUCH_WALK'
  | 'JUMP_ASCENT'
  | 'JUMP_DESCENT';

export interface AnimatorConfig {
  onFootstep?: (isSprint: boolean, isCrouch: boolean, footPos: THREE.Vector3) => void;
}

export class CharacterAnimator {
  private rig: CharacterRig;
  private config: AnimatorConfig;
  private currentState: LocomotionState = 'IDLE';
  private animTime: number = 0;
  private stepPhase: number = 0;
  private lastStepTrigger: number = 0;

  // Smoothing blend factors
  private crouchBlend: number = 0; // 0 = standing, 1 = crouched
  private airBlend: number = 0;    // 0 = grounded, 1 = airborne

  // Cached vector for footstep events
  private tempVec = new THREE.Vector3();

  constructor(rig: CharacterRig, config: AnimatorConfig = {}) {
    this.rig = rig;
    this.config = config;
  }

  public setState(state: LocomotionState): void {
    this.currentState = state;
  }

  public getState(): LocomotionState {
    return this.currentState;
  }

  public update(delta: number, currentSpeed: number): void {
    this.animTime += delta;

    // Smooth blend targets
    const isCrouching = this.currentState === 'CROUCH_IDLE' || this.currentState === 'CROUCH_WALK';
    const isAirborne = this.currentState === 'JUMP_ASCENT' || this.currentState === 'JUMP_DESCENT';

    this.crouchBlend = THREE.MathUtils.lerp(this.crouchBlend, isCrouching ? 1 : 0, delta * 10);
    this.airBlend = THREE.MathUtils.lerp(this.airBlend, isAirborne ? 1 : 0, delta * 12);

    // Stride cadence frequency
    let strideFreq = 3.2; // default walk
    if (this.currentState === 'SPRINT') strideFreq = 5.6;
    else if (this.currentState === 'RUN') strideFreq = 4.4;
    else if (this.currentState === 'CROUCH_WALK') strideFreq = 2.8;

    // Update step phase when moving
    const isMoving = currentSpeed > 0.1 && !isAirborne;
    if (isMoving) {
      this.stepPhase += delta * strideFreq * Math.PI * 2;
      if (this.stepPhase > Math.PI * 2) {
        this.stepPhase -= Math.PI * 2;
      }

      // Check footstep contacts (near phase 0 and pi)
      this.checkFootstepContact();
    } else {
      // Return step phase smoothly to rest
      this.stepPhase = THREE.MathUtils.lerp(this.stepPhase, 0, delta * 8);
    }

    // Apply procedural kinematics
    this.applyKinematics(delta, currentSpeed);
  }

  private checkFootstepContact(): void {
    // Detect foot strikes at phase approx 0 (left foot) and pi (right foot)
    const sinVal = Math.sin(this.stepPhase);
    const triggerThreshold = 0.05;

    // Left foot strike
    if (sinVal < triggerThreshold && sinVal > -triggerThreshold) {
      const now = performance.now();
      if (now - this.lastStepTrigger > 220) {
        this.lastStepTrigger = now;
        if (this.config.onFootstep) {
          const isSprint = this.currentState === 'SPRINT';
          const isCrouch = this.currentState === 'CROUCH_WALK';
          this.rig.leftFoot.getWorldPosition(this.tempVec);
          this.config.onFootstep(isSprint, isCrouch, this.tempVec);
        }
      }
    }
  }

  private applyKinematics(delta: number, speed: number): void {
    const sin = Math.sin(this.stepPhase);
    const cos = Math.cos(this.stepPhase);
    const idleBreath = Math.sin(this.animTime * 2.2);

    // Speed normalization
    const walkWeight = Math.min(speed / 4.0, 1.0) * (1 - this.airBlend);
    const sprintFactor = this.currentState === 'SPRINT' ? 1.0 : (this.currentState === 'RUN' ? 0.6 : 0.0);

    // --- 1. PELVIS / HIPS ---
    // Base height: 0.95 standing, 0.62 crouched
    const targetPelvisY = THREE.MathUtils.lerp(0.95, 0.62, this.crouchBlend);
    // Vertical bounce during walk/run (double frequency)
    const verticalBounce = walkWeight * Math.abs(cos) * (0.04 + sprintFactor * 0.04);
    this.rig.pelvis.position.y = THREE.MathUtils.lerp(
      this.rig.pelvis.position.y,
      targetPelvisY - verticalBounce,
      delta * 14
    );

    // Pelvis roll and yaw with hip sway
    const hipSway = sin * 0.06 * walkWeight;
    this.rig.pelvis.rotation.z = THREE.MathUtils.lerp(this.rig.pelvis.rotation.z, hipSway, delta * 12);
    this.rig.pelvis.rotation.y = THREE.MathUtils.lerp(this.rig.pelvis.rotation.y, -sin * 0.09 * walkWeight, delta * 12);

    // --- 2. SPINE & CHEST ---
    // Torso lean forward when running or crouching
    const targetForwardLean = 0.04 + (walkWeight * 0.12) + (sprintFactor * 0.22) + (this.crouchBlend * 0.28);
    this.rig.spine.rotation.x = THREE.MathUtils.lerp(this.rig.spine.rotation.x, targetForwardLean, delta * 10);
    // Counter-twist to hips for natural body balance
    this.rig.chest.rotation.y = THREE.MathUtils.lerp(this.rig.chest.rotation.y, sin * 0.12 * walkWeight, delta * 12);
    // Breathing motion
    this.rig.chest.scale.set(
      1 + idleBreath * 0.015,
      1 + idleBreath * 0.02,
      1 + idleBreath * 0.02
    );

    // Satchel subtle inertia sway
    this.rig.satchel.rotation.x = THREE.MathUtils.lerp(this.rig.satchel.rotation.x, -targetForwardLean * 0.6, delta * 8);
    this.rig.satchel.rotation.z = Math.sin(this.stepPhase + 0.4) * 0.08 * walkWeight;

    // --- 3. HEAD & NECK ---
    // Keep head looking straight ahead with slight bobbing
    const headTilt = -targetForwardLean * 0.75 + (idleBreath * 0.03);
    this.rig.head.rotation.x = THREE.MathUtils.lerp(this.rig.head.rotation.x, headTilt, delta * 10);
    this.rig.head.rotation.y = THREE.MathUtils.lerp(this.rig.head.rotation.y, -sin * 0.04 * walkWeight, delta * 10);

    // --- 4. LEGS KINEMATICS ---
    if (this.airBlend > 0.4) {
      // Airborne pose (jumping)
      const jumpProgress = this.currentState === 'JUMP_ASCENT' ? -0.4 : 0.2;
      this.rig.leftThigh.rotation.x = THREE.MathUtils.lerp(this.rig.leftThigh.rotation.x, 0.4 + jumpProgress, delta * 10);
      this.rig.rightThigh.rotation.x = THREE.MathUtils.lerp(this.rig.rightThigh.rotation.x, 0.2 + jumpProgress, delta * 10);
      this.rig.leftShin.rotation.x = THREE.MathUtils.lerp(this.rig.leftShin.rotation.x, -0.6, delta * 10);
      this.rig.rightShin.rotation.x = THREE.MathUtils.lerp(this.rig.rightShin.rotation.x, -0.5, delta * 10);
      this.rig.leftFoot.rotation.x = THREE.MathUtils.lerp(this.rig.leftFoot.rotation.x, 0.2, delta * 10);
      this.rig.rightFoot.rotation.x = THREE.MathUtils.lerp(this.rig.rightFoot.rotation.x, 0.2, delta * 10);
    } else {
      // Ground locomotion
      const strideAmp = 0.55 * walkWeight + 0.35 * sprintFactor;
      const leftThighTarget = -sin * strideAmp + (this.crouchBlend * 0.4);
      const rightThighTarget = sin * strideAmp + (this.crouchBlend * 0.4);

      this.rig.leftThigh.rotation.x = THREE.MathUtils.lerp(this.rig.leftThigh.rotation.x, leftThighTarget, delta * 16);
      this.rig.rightThigh.rotation.x = THREE.MathUtils.lerp(this.rig.rightThigh.rotation.x, rightThighTarget, delta * 16);

      // Knee bend: Shins flex on back-swing (when thigh is back, i.e., sin > 0 for left)
      const leftKneeTarget = Math.max(0, sin) * (0.85 + sprintFactor * 0.5) + (this.crouchBlend * 0.7);
      const rightKneeTarget = Math.max(0, -sin) * (0.85 + sprintFactor * 0.5) + (this.crouchBlend * 0.7);

      this.rig.leftShin.rotation.x = THREE.MathUtils.lerp(this.rig.leftShin.rotation.x, -leftKneeTarget, delta * 16);
      this.rig.rightShin.rotation.x = THREE.MathUtils.lerp(this.rig.rightShin.rotation.x, -rightKneeTarget, delta * 16);

      // Foot ankle flexing on ground plant
      const leftFootTarget = sin * 0.25 * walkWeight;
      const rightFootTarget = -sin * 0.25 * walkWeight;
      this.rig.leftFoot.rotation.x = THREE.MathUtils.lerp(this.rig.leftFoot.rotation.x, leftFootTarget, delta * 14);
      this.rig.rightFoot.rotation.x = THREE.MathUtils.lerp(this.rig.rightFoot.rotation.x, rightFootTarget, delta * 14);
    }

    // --- 5. ARMS KINEMATICS ---
    if (this.airBlend > 0.4) {
      // Jump arm poise: raised outward for balance
      this.rig.leftUpperArm.rotation.x = THREE.MathUtils.lerp(this.rig.leftUpperArm.rotation.x, 0.6, delta * 10);
      this.rig.rightUpperArm.rotation.x = THREE.MathUtils.lerp(this.rig.rightUpperArm.rotation.x, 0.6, delta * 10);
      this.rig.leftUpperArm.rotation.z = THREE.MathUtils.lerp(this.rig.leftUpperArm.rotation.z, 0.4, delta * 10);
      this.rig.rightUpperArm.rotation.z = THREE.MathUtils.lerp(this.rig.rightUpperArm.rotation.z, -0.4, delta * 10);
    } else if (walkWeight > 0.05) {
      // Natural arm swing in opposition to legs (Right leg forward -> Left arm forward)
      const armSwingAmp = 0.65 * walkWeight + 0.55 * sprintFactor;
      const leftArmTarget = sin * armSwingAmp;
      const rightArmTarget = -sin * armSwingAmp;

      this.rig.leftUpperArm.rotation.x = THREE.MathUtils.lerp(this.rig.leftUpperArm.rotation.x, leftArmTarget, delta * 16);
      this.rig.rightUpperArm.rotation.x = THREE.MathUtils.lerp(this.rig.rightUpperArm.rotation.x, rightArmTarget, delta * 16);

      // Elbows bent naturally (more bent during sprint)
      const elbowBend = 0.35 + (sprintFactor * 0.8) + (this.crouchBlend * 0.3);
      this.rig.leftForearm.rotation.x = THREE.MathUtils.lerp(this.rig.leftForearm.rotation.x, elbowBend, delta * 14);
      this.rig.rightForearm.rotation.x = THREE.MathUtils.lerp(this.rig.rightForearm.rotation.x, elbowBend, delta * 14);

      // Slight arm lateral spread
      this.rig.leftUpperArm.rotation.z = THREE.MathUtils.lerp(this.rig.leftUpperArm.rotation.z, 0.12 + sprintFactor * 0.15, delta * 10);
      this.rig.rightUpperArm.rotation.z = THREE.MathUtils.lerp(this.rig.rightUpperArm.rotation.z, -(0.12 + sprintFactor * 0.15), delta * 10);
    } else {
      // Idle arms
      const idleArmX = 0.08 + idleBreath * 0.03;
      this.rig.leftUpperArm.rotation.x = THREE.MathUtils.lerp(this.rig.leftUpperArm.rotation.x, idleArmX, delta * 6);
      this.rig.rightUpperArm.rotation.x = THREE.MathUtils.lerp(this.rig.rightUpperArm.rotation.x, idleArmX, delta * 6);

      this.rig.leftForearm.rotation.x = THREE.MathUtils.lerp(this.rig.leftForearm.rotation.x, 0.15, delta * 6);
      this.rig.rightForearm.rotation.x = THREE.MathUtils.lerp(this.rig.rightForearm.rotation.x, 0.15, delta * 6);

      this.rig.leftUpperArm.rotation.z = THREE.MathUtils.lerp(this.rig.leftUpperArm.rotation.z, 0.08, delta * 6);
      this.rig.rightUpperArm.rotation.z = THREE.MathUtils.lerp(this.rig.rightUpperArm.rotation.z, -0.08, delta * 6);
    }
  }
}
