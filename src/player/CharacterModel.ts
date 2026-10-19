import * as THREE from 'three';

export interface CharacterRig {
  root: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  leftUpperArm: THREE.Group;
  leftForearm: THREE.Group;
  leftHand: THREE.Group;
  rightUpperArm: THREE.Group;
  rightForearm: THREE.Group;
  rightHand: THREE.Group;
  leftThigh: THREE.Group;
  leftShin: THREE.Group;
  leftFoot: THREE.Group;
  rightThigh: THREE.Group;
  rightShin: THREE.Group;
  rightFoot: THREE.Group;
  satchel: THREE.Group;
}

export interface CharacterConfig {
  gender: 'male' | 'female';
  skinTone: number;    // 0: Fair/Wheatish, 1: Warm Bronze, 2: Deep Earth
  hairStyle: number;   // 0, 1, 2
  hairColor: number;   // 0: Jet Black, 1: Dark Espresso, 2: Chestnut
  facialHair: number;  // Male: 0: Clean, 1: Stubble, 2: Trimmed Beard
  femaleAccessory: number; // Female: 0: None, 1: Scarf/Dupatta, 2: Forehead Bandana
  outfit: number;      // 0, 1, 2
}

export const defaultCharacterConfig: CharacterConfig = {
  gender: 'male',
  skinTone: 1,
  hairStyle: 0,
  hairColor: 0,
  facialHair: 1,
  femaleAccessory: 1,
  outfit: 0
};

export class CharacterModel {
  public group: THREE.Group;
  public rig: CharacterRig;
  public config: CharacterConfig;

  // Material palettes
  private skinTones = [0xb87b52, 0x9e633d, 0x764627];
  private hairColors = [0x151311, 0x2a1c14, 0x442c1e];

  // Outfits palettes: [shirt, pants, detail]
  private maleOutfits = [
    { shirt: 0xba5d34, pants: 0x3d443e, detail: 0x261e19 }, // Terracotta + Olive cargo
    { shirt: 0xc2ab80, pants: 0x2b2e2d, detail: 0x4a3d31 }, // Khaki linen + Charcoal
    { shirt: 0x3e5564, pants: 0x918774, detail: 0x202b33 }  // Slate navy + Sand
  ];

  private femaleOutfits = [
    { shirt: 0xd97724, pants: 0x323a35, detail: 0xe6cf95 }, // Saffron kurti + Slate
    { shirt: 0x5a7765, pants: 0x242826, detail: 0xd4b483 }, // Sage olive + Dark
    { shirt: 0xa63a3a, pants: 0x827b72, detail: 0xf0dcc0 }  // Crimson sand + Taupe
  ];

  constructor(initialConfig: Partial<CharacterConfig> = {}) {
    this.group = new THREE.Group();
    this.group.name = 'PlayerCharacter';
    this.config = { ...defaultCharacterConfig, ...initialConfig };

    // 1. Build initial empty rig joints hierarchy
    this.rig = this.createRigHierarchy();
    this.group.add(this.rig.root);

    // 2. Populate meshes onto rig
    this.rebuildMeshes();
  }

  private createRigHierarchy(): CharacterRig {
    const root = new THREE.Group();
    root.name = 'rig_root';

    const pelvis = new THREE.Group();
    pelvis.name = 'rig_pelvis';
    pelvis.position.set(0, 0.95, 0);
    root.add(pelvis);

    const spine = new THREE.Group();
    spine.name = 'rig_spine';
    spine.position.set(0, 0.10, 0);
    pelvis.add(spine);

    const chest = new THREE.Group();
    chest.name = 'rig_chest';
    chest.position.set(0, 0.20, 0);
    spine.add(chest);

    const satchel = new THREE.Group();
    satchel.name = 'rig_satchel';
    satchel.position.set(0.04, 0.10, -0.13);
    chest.add(satchel);

    const neck = new THREE.Group();
    neck.name = 'rig_neck';
    neck.position.set(0, 0.22, 0);
    chest.add(neck);

    const head = new THREE.Group();
    head.name = 'rig_head';
    head.position.set(0, 0.09, 0);
    neck.add(head);

    // Left Arm
    const leftUpperArm = new THREE.Group();
    leftUpperArm.name = 'rig_leftUpperArm';
    leftUpperArm.position.set(0.20, 0.18, 0);
    chest.add(leftUpperArm);

    const leftForearm = new THREE.Group();
    leftForearm.name = 'rig_leftForearm';
    leftForearm.position.set(0, -0.24, 0);
    leftUpperArm.add(leftForearm);

    const leftHand = new THREE.Group();
    leftHand.name = 'rig_leftHand';
    leftHand.position.set(0, -0.23, 0);
    leftForearm.add(leftHand);

    // Right Arm
    const rightUpperArm = new THREE.Group();
    rightUpperArm.name = 'rig_rightUpperArm';
    rightUpperArm.position.set(-0.20, 0.18, 0);
    chest.add(rightUpperArm);

    const rightForearm = new THREE.Group();
    rightForearm.name = 'rig_rightForearm';
    rightForearm.position.set(0, -0.24, 0);
    rightUpperArm.add(rightForearm);

    const rightHand = new THREE.Group();
    rightHand.name = 'rig_rightHand';
    rightHand.position.set(0, -0.23, 0);
    rightForearm.add(rightHand);

    // Left Leg
    const leftThigh = new THREE.Group();
    leftThigh.name = 'rig_leftThigh';
    leftThigh.position.set(0.10, -0.06, 0);
    pelvis.add(leftThigh);

    const leftShin = new THREE.Group();
    leftShin.name = 'rig_leftShin';
    leftShin.position.set(0, -0.40, 0);
    leftThigh.add(leftShin);

    const leftFoot = new THREE.Group();
    leftFoot.name = 'rig_leftFoot';
    leftFoot.position.set(0, -0.38, 0);
    leftShin.add(leftFoot);

    // Right Leg
    const rightThigh = new THREE.Group();
    rightThigh.name = 'rig_rightThigh';
    rightThigh.position.set(-0.10, -0.06, 0);
    pelvis.add(rightThigh);

    const rightShin = new THREE.Group();
    rightShin.name = 'rig_rightShin';
    rightShin.position.set(0, -0.40, 0);
    rightThigh.add(rightShin);

    const rightFoot = new THREE.Group();
    rightFoot.name = 'rig_rightFoot';
    rightFoot.position.set(0, -0.38, 0);
    rightShin.add(rightFoot);

    return {
      root, pelvis, spine, chest, neck, head,
      leftUpperArm, leftForearm, leftHand,
      rightUpperArm, rightForearm, rightHand,
      leftThigh, leftShin, leftFoot,
      rightThigh, rightShin, rightFoot,
      satchel
    };
  }

  public applyConfig(newConfig: Partial<CharacterConfig>): void {
    Object.assign(this.config, newConfig);
    this.rebuildMeshes();
  }

  private clearRigMeshes(): void {
    const clearGroup = (group: THREE.Group) => {
      for (let i = group.children.length - 1; i >= 0; i--) {
        const child = group.children[i];
        // Don't remove joint child groups
        if (child.name.startsWith('rig_')) continue;
        group.remove(child);
        child.traverse(c => {
          if ((c as THREE.Mesh).isMesh) {
            (c as THREE.Mesh).geometry.dispose();
          }
        });
      }
    };

    Object.values(this.rig).forEach(clearGroup);
  }

  private rebuildMeshes(): void {
    this.clearRigMeshes();

    const isMale = this.config.gender === 'male';
    const skinColor = this.skinTones[this.config.skinTone] || this.skinTones[1];
    const hairColor = this.hairColors[this.config.hairColor] || this.hairColors[0];
    const outfitList = isMale ? this.maleOutfits : this.femaleOutfits;
    const outfit = outfitList[this.config.outfit] || outfitList[0];

    // Shared materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.72,
      metalness: 0.04
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.85,
      metalness: 0.1
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: outfit.shirt,
      roughness: 0.82,
      metalness: 0.02
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: outfit.pants,
      roughness: 0.86,
      metalness: 0.05
    });

    const detailMat = new THREE.MeshStandardMaterial({
      color: outfit.detail,
      roughness: 0.75,
      metalness: 0.08
    });

    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x221c18, // Sturdy leather dust boots
      roughness: 0.7,
      metalness: 0.12
    });

    const soleMat = new THREE.MeshStandardMaterial({
      color: 0x11100f,
      roughness: 0.9,
      metalness: 0.05
    });

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x543926, // Satchel / strap
      roughness: 0.65,
      metalness: 0.1
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x969ea3,
      roughness: 0.28,
      metalness: 0.85
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.3 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x24180e, roughness: 0.2 });
    const lipMat = new THREE.MeshStandardMaterial({
      color: isMale ? THREE.Color.NAMES.sienna : 0xab5348,
      roughness: 0.65
    });

    // Proportions
    const chestWidth = isMale ? 0.35 : 0.29;
    const hipWidth = isMale ? 0.26 : 0.28;
    const armRadius = isMale ? 0.048 : 0.038;
    const thighRadius = isMale ? 0.062 : 0.056;

    // Adjust joint shoulder widths
    const shoulderX = isMale ? 0.21 : 0.17;
    this.rig.leftUpperArm.position.x = shoulderX;
    this.rig.rightUpperArm.position.x = -shoulderX;

    // --- 1. PELVIS & HIPS ---
    const hipGeo = new THREE.BoxGeometry(hipWidth, 0.16, isMale ? 0.19 : 0.20);
    const hipMesh = new THREE.Mesh(hipGeo, pantsMat);
    this.rig.pelvis.add(hipMesh);

    // Leather belt with metal buckle
    const beltGeo = new THREE.BoxGeometry(hipWidth + 0.015, 0.04, isMale ? 0.20 : 0.21);
    const beltMesh = new THREE.Mesh(beltGeo, leatherMat);
    beltMesh.position.y = 0.06;
    this.rig.pelvis.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.05, 0.045, 0.02);
    const buckleMesh = new THREE.Mesh(buckleGeo, metalMat);
    buckleMesh.position.set(0, 0.06, (isMale ? 0.10 : 0.105) + 0.005);
    this.rig.pelvis.add(buckleMesh);

    // Canteen on hip
    const canteen = new THREE.Group();
    canteen.position.set(hipWidth * 0.55 + 0.03, -0.04, 0.03);
    canteen.rotation.z = -0.15;
    const canGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12);
    canteen.add(new THREE.Mesh(canGeo, metalMat));
    const capGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10);
    const capMesh = new THREE.Mesh(capGeo, leatherMat);
    capMesh.position.y = 0.09;
    canteen.add(capMesh);
    this.rig.pelvis.add(canteen);

    // --- 2. SPINE (Mid-torso) ---
    const spineGeo = new THREE.BoxGeometry(isMale ? 0.28 : 0.24, 0.18, 0.18);
    const spineMesh = new THREE.Mesh(spineGeo, shirtMat);
    spineMesh.position.y = 0.09;
    this.rig.spine.add(spineMesh);

    // --- 3. CHEST (Upper torso) ---
    const chestGeo = new THREE.BoxGeometry(chestWidth, 0.23, isMale ? 0.21 : 0.19);
    const chestMesh = new THREE.Mesh(chestGeo, shirtMat);
    chestMesh.position.y = 0.115;
    this.rig.chest.add(chestMesh);

    // Shirt buttons & collar / kurti neckline
    if (isMale) {
      // Button placket
      const placket = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.015), detailMat);
      placket.position.set(0, 0.115, 0.11);
      this.rig.chest.add(placket);

      for (let b = 0; b < 3; b++) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.005, 8), metalMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(0, 0.18 - b * 0.06, 0.118);
        this.rig.chest.add(btn);
      }
    } else {
      // Feminine neckline / embroidered border
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.012), detailMat);
      trim.position.set(0, 0.12, 0.10);
      this.rig.chest.add(trim);

      // Scarf / Dupatta accessory for female
      if (this.config.femaleAccessory === 1) {
        const scarfMat = new THREE.MeshStandardMaterial({
          color: outfit.detail,
          roughness: 0.88,
          side: THREE.DoubleSide
        });
        const scarf1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.04), scarfMat);
        scarf1.position.set(0.09, 0.08, 0.115);
        scarf1.rotation.z = -0.15;
        this.rig.chest.add(scarf1);

        const scarfLoop = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), scarfMat);
        scarfLoop.rotation.x = Math.PI / 2;
        scarfLoop.position.set(0, 0.20, 0.02);
        this.rig.chest.add(scarfLoop);
      }
    }

    // Satchel strap across chest
    const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.44), leatherMat);
    strap.rotation.z = 0.68;
    strap.position.set(-0.02, 0.10, 0.115);
    this.rig.chest.add(strap);

    // Satchel bag on back
    const bagGeo = new THREE.BoxGeometry(0.24, 0.26, 0.10);
    const bagMesh = new THREE.Mesh(bagGeo, leatherMat);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.02), metalMat);
    buckle.position.set(0, -0.04, -0.055);
    bagMesh.add(buckle);
    this.rig.satchel.add(bagMesh);

    // --- 4. NECK ---
    const neckRad = isMale ? 0.055 : 0.046;
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(neckRad, neckRad * 1.15, 0.09, 10), skinMat);
    neckMesh.position.y = 0.04;
    this.rig.neck.add(neckMesh);

    // --- 5. REALISTIC HEAD & FACE ---
    const headGroup = new THREE.Group();

    // Cranium / Face structure
    const headGeo = new THREE.BoxGeometry(isMale ? 0.17 : 0.155, 0.20, 0.18);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.10, 0.01);
    headGroup.add(headMesh);

    // Sculpted Jaw & Chin
    const chinGeo = new THREE.BoxGeometry(isMale ? 0.10 : 0.075, 0.06, 0.06);
    const chinMesh = new THREE.Mesh(chinGeo, skinMat);
    chinMesh.position.set(0, 0.02, 0.07);
    headGroup.add(chinMesh);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.022, 0.065, 4);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.rotation.x = -Math.PI / 2;
    noseMesh.position.set(0, 0.10, 0.11);
    headGroup.add(noseMesh);

    // Mouth / Lips
    const mouthGeo = new THREE.BoxGeometry(isMale ? 0.06 : 0.05, 0.016, 0.012);
    const mouthMesh = new THREE.Mesh(mouthGeo, lipMat);
    mouthMesh.position.set(0, 0.055, 0.102);
    headGroup.add(mouthMesh);

    // Eyes (Left & Right)
    for (const side of [-1, 1]) {
      const eyeX = side * 0.042;
      const eyeY = 0.125;
      const eyeZ = 0.098;

      // Sclera (White)
      const eyeWhite = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.016, 0.01), eyeWhiteMat);
      eyeWhite.position.set(eyeX, eyeY, eyeZ);
      headGroup.add(eyeWhite);

      // Iris / Pupil
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.012), irisMat);
      pupil.position.set(eyeX, eyeY, eyeZ + 0.002);
      headGroup.add(pupil);

      // Eyebrow
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.009, 0.012), hairMat);
      brow.position.set(eyeX, eyeY + 0.02, eyeZ + 0.004);
      brow.rotation.z = side * -0.08;
      headGroup.add(brow);

      // Ears
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.045, 0.025), skinMat);
      ear.position.set(side * (isMale ? 0.09 : 0.082), 0.10, 0.01);
      headGroup.add(ear);
    }

    // Facial Hair (for Male)
    if (isMale) {
      if (this.config.facialHair === 1) {
        // Stubble shadow
        const stubbleMat = new THREE.MeshStandardMaterial({ color: 0x36281e, roughness: 0.95 });
        const stubble = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.06), stubbleMat);
        stubble.position.set(0, 0.04, 0.075);
        headGroup.add(stubble);
      } else if (this.config.facialHair === 2) {
        // Trimmed Beard & Moustache
        const beard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.075), hairMat);
        beard.position.set(0, 0.035, 0.075);
        headGroup.add(beard);

        const stache = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), hairMat);
        stache.position.set(0, 0.072, 0.106);
        headGroup.add(stache);
      }
    }

    // --- HAIRSTYLES ---
    if (isMale) {
      if (this.config.hairStyle === 0) {
        // Style 0: Side-Part Textured Quiff
        const hairBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.19), hairMat);
        hairBase.position.set(0, 0.19, 0.0);
        headGroup.add(hairBase);

        const quiff = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.14), hairMat);
        quiff.position.set(0.01, 0.23, 0.04);
        quiff.rotation.z = -0.12;
        headGroup.add(quiff);
      } else if (this.config.hairStyle === 1) {
        // Style 1: Textured Crop / Fade
        const hairBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.19), hairMat);
        hairBase.position.set(0, 0.185, 0.0);
        headGroup.add(hairBase);

        const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.05), hairMat);
        fringe.position.set(0, 0.19, 0.095);
        headGroup.add(fringe);
      } else {
        // Style 2: Buzz Cut
        const buzz = new THREE.Mesh(new THREE.BoxGeometry(0.176, 0.04, 0.186), hairMat);
        buzz.position.set(0, 0.185, 0.0);
        headGroup.add(buzz);
      }
    } else {
      // Female Hairstyles
      if (this.config.hairStyle === 0) {
        // Style 0: High Ponytail with Bun Tie
        const hairBase = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.11, 0.18), hairMat);
        hairBase.position.set(0, 0.17, 0.0);
        headGroup.add(hairBase);

        // Ponytail tie
        const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8), detailMat);
        tie.position.set(0, 0.19, -0.10);
        tie.rotation.x = Math.PI / 4;
        headGroup.add(tie);

        // Falling ponytail
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.28, 8), hairMat);
        tail.position.set(0, 0.08, -0.15);
        tail.rotation.x = -0.35;
        headGroup.add(tail);
      } else if (this.config.hairStyle === 1) {
        // Style 1: Shoulder-length Textured Bob
        const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.10, 0.18), hairMat);
        hairTop.position.set(0, 0.18, 0.0);
        headGroup.add(hairTop);

        for (const side of [-1, 1]) {
          const sideBob = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.14), hairMat);
          sideBob.position.set(side * 0.082, 0.09, 0.0);
          headGroup.add(sideBob);
        }
      } else {
        // Style 2: Traditional Side Braid
        const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.10, 0.18), hairMat);
        hairTop.position.set(0, 0.18, 0.0);
        headGroup.add(hairTop);

        const braid = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.015, 0.32, 6), hairMat);
        braid.position.set(0.09, 0.03, 0.07);
        braid.rotation.z = -0.22;
        headGroup.add(braid);
      }

      // Female Forehead Band / Visor
      if (this.config.femaleAccessory === 2) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.168, 0.025, 0.185), detailMat);
        band.position.set(0, 0.16, 0.01);
        headGroup.add(band);
      }
    }

    this.rig.head.add(headGroup);

    // --- 6. ARMS ---
    // Left Arm
    const upperArmGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.9, 0.24, 10);
    const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, shirtMat);
    leftUpperArmMesh.position.y = -0.12;
    this.rig.leftUpperArm.add(leftUpperArmMesh);

    // Folded sleeve cuff
    const cuffGeo = new THREE.CylinderGeometry(armRadius * 1.08, armRadius * 1.08, 0.035, 10);
    const leftCuff = new THREE.Mesh(cuffGeo, detailMat);
    leftCuff.position.y = -0.21;
    this.rig.leftUpperArm.add(leftCuff);

    const forearmGeo = new THREE.CylinderGeometry(armRadius * 0.88, armRadius * 0.75, 0.23, 10);
    const leftForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    leftForearmMesh.position.y = -0.115;
    this.rig.leftForearm.add(leftForearmMesh);

    // Survival wrist compass / watch on left arm
    const watch = new THREE.Mesh(new THREE.CylinderGeometry(armRadius * 0.95, armRadius * 0.95, 0.03, 10), leatherMat);
    watch.position.y = -0.18;
    this.rig.leftForearm.add(watch);

    const handGeo = new THREE.BoxGeometry(0.038, 0.075, 0.065);
    const leftHandMesh = new THREE.Mesh(handGeo, skinMat);
    leftHandMesh.position.y = -0.04;
    this.rig.leftHand.add(leftHandMesh);

    // Right Arm
    const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, shirtMat);
    rightUpperArmMesh.position.y = -0.12;
    this.rig.rightUpperArm.add(rightUpperArmMesh);

    const rightCuff = new THREE.Mesh(cuffGeo, detailMat);
    rightCuff.position.y = -0.21;
    this.rig.rightUpperArm.add(rightCuff);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    rightForearmMesh.position.y = -0.115;
    this.rig.rightForearm.add(rightForearmMesh);

    const rightHandMesh = new THREE.Mesh(handGeo, skinMat);
    rightHandMesh.position.y = -0.04;
    this.rig.rightHand.add(rightHandMesh);

    // --- 7. LEGS & BOOTS ---
    const thighGeo = new THREE.CylinderGeometry(thighRadius, thighRadius * 0.85, 0.40, 10);
    const shinGeo = new THREE.CylinderGeometry(thighRadius * 0.82, thighRadius * 0.72, 0.38, 10);

    // Left Leg
    const leftThighMesh = new THREE.Mesh(thighGeo, pantsMat);
    leftThighMesh.position.y = -0.20;
    this.rig.leftThigh.add(leftThighMesh);

    // Cargo pocket on left thigh
    const cargoPocket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.10), detailMat);
    cargoPocket.position.set(thighRadius + 0.015, -0.18, 0);
    this.rig.leftThigh.add(cargoPocket);

    const leftShinMesh = new THREE.Mesh(shinGeo, pantsMat);
    leftShinMesh.position.y = -0.19;
    this.rig.leftShin.add(leftShinMesh);

    // Left Boot
    const bootGroup = this.createRealisticBoot(bootMat, soleMat, metalMat);
    this.rig.leftFoot.add(bootGroup);

    // Right Leg
    const rightThighMesh = new THREE.Mesh(thighGeo, pantsMat);
    rightThighMesh.position.y = -0.20;
    this.rig.rightThigh.add(rightThighMesh);

    const cargoPocketRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.10), detailMat);
    cargoPocketRight.position.set(-(thighRadius + 0.015), -0.18, 0);
    this.rig.rightThigh.add(cargoPocketRight);

    const rightShinMesh = new THREE.Mesh(shinGeo, pantsMat);
    rightShinMesh.position.y = -0.19;
    this.rig.rightShin.add(rightShinMesh);

    // Right Boot
    const rightBootGroup = this.createRealisticBoot(bootMat, soleMat, metalMat);
    this.rig.rightFoot.add(rightBootGroup);

    // Enable shadows across all meshes
    this.group.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private createRealisticBoot(bootMat: THREE.Material, soleMat: THREE.Material, metalMat: THREE.Material): THREE.Group {
    const boot = new THREE.Group();

    // Boot upper body
    const upperGeo = new THREE.BoxGeometry(0.088, 0.11, 0.19);
    const upperMesh = new THREE.Mesh(upperGeo, bootMat);
    upperMesh.position.set(0, -0.035, 0.035);
    boot.add(upperMesh);

    // Heavy rubber lug sole
    const soleGeo = new THREE.BoxGeometry(0.096, 0.03, 0.21);
    const soleMesh = new THREE.Mesh(soleGeo, soleMat);
    soleMesh.position.set(0, -0.09, 0.035);
    boot.add(soleMesh);

    // Heel riser
    const heelGeo = new THREE.BoxGeometry(0.096, 0.02, 0.07);
    const heelMesh = new THREE.Mesh(heelGeo, soleMat);
    heelMesh.position.set(0, -0.105, -0.03);
    boot.add(heelMesh);

    // Metal eyelets / laces
    for (let l = 0; l < 3; l++) {
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.01), metalMat);
      lace.position.set(0, -0.01 + l * 0.025, 0.075 + l * 0.01);
      boot.add(lace);
    }

    return boot;
  }
}
