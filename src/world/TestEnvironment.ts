import * as THREE from 'three';

export class TestEnvironment {
  public scene: THREE.Scene;
  public collisionObjects: THREE.Object3D[] = [];
  public interactables: THREE.Object3D[] = [];
  private heatParticles: THREE.Points | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildLighting();
    this.buildUrbanEnvironment();
    this.buildHeatwaveParticles();
  }

  private buildLighting(): void {
    // Scorching Indian afternoon heatwave sky & ground ambient
    const hemiLight = new THREE.HemisphereLight(0xffecd2, 0x422817, 0.75);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Blazing direct sun light with warm amber tone
    const sunLight = new THREE.DirectionalLight(0xffb066, 1.8);
    sunLight.position.set(24, 38, 20);
    sunLight.castShadow = true;

    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80;

    const shadowDist = 28;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;

    this.scene.add(sunLight);

    // Warm atmospheric heat haze fog
    this.scene.background = new THREE.Color(0xd2a884);
    this.scene.fog = new THREE.FogExp2(0xd2a884, 0.018);
  }

  private buildUrbanEnvironment(): void {
    // Materials
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x332e29,
      roughness: 0.9,
      metalness: 0.05
    });

    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x82776c,
      roughness: 0.85,
      metalness: 0.05
    });

    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0xba9a81, // Dusty stucco / weathered brick tone
      roughness: 0.92,
      metalness: 0.02
    });

    const metalBoxMat = new THREE.MeshStandardMaterial({
      color: 0x48695f, // Industrial oxidized electrical cabinet
      roughness: 0.45,
      metalness: 0.7
    });

    const plasticDrumMat = new THREE.MeshStandardMaterial({
      color: 0x1976d2, // Familiar Indian blue water drum
      roughness: 0.35,
      metalness: 0.05
    });

    const woodCrateMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.85,
      metalness: 0.0
    });

    const yellowWarningMat = new THREE.MeshStandardMaterial({
      color: 0xffb300,
      roughness: 0.5,
      metalness: 0.2
    });

    // 1. Road Ground Plane
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMesh = new THREE.Mesh(groundGeo, asphaltMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);
    this.collisionObjects.push(groundMesh);

    // White dashed road lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xd4c7b8 });
    for (let i = -30; i <= 30; i += 6) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.2), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.01, i);
      this.scene.add(line);
    }

    // 2. Sidewalk Curbs (Left & Right)
    const curbGeo = new THREE.BoxGeometry(6, 0.18, 70);
    const leftCurb = new THREE.Mesh(curbGeo, sidewalkMat);
    leftCurb.position.set(8.5, 0.09, 0);
    leftCurb.castShadow = true;
    leftCurb.receiveShadow = true;
    this.scene.add(leftCurb);
    this.collisionObjects.push(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, sidewalkMat);
    rightCurb.position.set(-8.5, 0.09, 0);
    rightCurb.castShadow = true;
    rightCurb.receiveShadow = true;
    this.scene.add(rightCurb);
    this.collisionObjects.push(rightCurb);

    // 3. Apartment Complex Facade (Left Side - Old Colony)
    const bldgGeo = new THREE.BoxGeometry(10, 14, 40);
    const bldg = new THREE.Mesh(bldgGeo, buildingMat);
    bldg.position.set(16.5, 7.0, 0);
    bldg.castShadow = true;
    bldg.receiveShadow = true;
    this.scene.add(bldg);
    this.collisionObjects.push(bldg);

    // Balconies on apartment
    const balconyMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    for (let floor = 1; floor <= 3; floor++) {
      for (let z = -12; z <= 12; z += 8) {
        const balcony = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 4.0), balconyMat);
        balcony.position.set(11.0, floor * 3.5, z);
        balcony.castShadow = true;
        balcony.receiveShadow = true;
        this.scene.add(balcony);
      }
    }

    // 4. Shaded Portico / Verandah (Refuge from 45°C heat)
    const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.3, 14), sidewalkMat);
    porticoRoof.position.set(8.5, 3.4, 0);
    porticoRoof.castShadow = true;
    this.scene.add(porticoRoof);

    // Pillars supporting portico
    const pillarGeo = new THREE.CylinderGeometry(0.18, 0.18, 3.4, 12);
    const pillar1 = new THREE.Mesh(pillarGeo, buildingMat);
    pillar1.position.set(6.0, 1.7, -6.5);
    pillar1.castShadow = true;
    this.scene.add(pillar1);
    this.collisionObjects.push(pillar1);

    const pillar2 = new THREE.Mesh(pillarGeo, buildingMat);
    pillar2.position.set(6.0, 1.7, 6.5);
    pillar2.castShadow = true;
    this.scene.add(pillar2);
    this.collisionObjects.push(pillar2);

    // 5. Lifeline Infrastructure: Backup Power Transformer Box
    const transformer = new THREE.Group();
    transformer.position.set(7.5, 0.18, -4.0);

    const transMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.0), metalBoxMat);
    transMesh.position.set(0, 0.9, 0);
    transMesh.castShadow = true;
    transformer.add(transMesh);

    // Hazard stripes
    const hazardMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.25), yellowWarningMat);
    hazardMesh.position.set(0, 1.3, 0.51);
    transformer.add(hazardMesh);

    this.scene.add(transformer);
    this.collisionObjects.push(transMesh);

    // 6. Lifeline Infrastructure: Blue Water Storage Drums
    const drumGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16);
    for (let i = 0; i < 3; i++) {
      const drum = new THREE.Mesh(drumGeo, plasticDrumMat);
      drum.position.set(-6.8 - i * 0.8, 0.73, -5.0 + i * 0.4);
      drum.castShadow = true;
      drum.receiveShadow = true;
      this.scene.add(drum);
      this.collisionObjects.push(drum);
    }

    // 7. Interactive Supply Cache Crate (Milestone 1 Test Target)
    const crateGroup = new THREE.Group();
    crateGroup.position.set(7.2, 0.18, 3.5);

    const crateMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 0.85), woodCrateMat);
    crateMesh.position.set(0, 0.425, 0);
    crateMesh.castShadow = true;
    crateMesh.receiveShadow = true;
    crateMesh.userData = {
      prompt: 'Emergency Relief Supply Cache (E to Scavenge)',
      type: 'supply_cache'
    };
    crateGroup.add(crateMesh);

    // Metal straps on crate
    const strapGeo = new THREE.BoxGeometry(1.12, 0.05, 0.87);
    const strap1 = new THREE.Mesh(strapGeo, metalBoxMat);
    strap1.position.set(0, 0.25, 0);
    crateGroup.add(strap1);

    const strap2 = new THREE.Mesh(strapGeo, metalBoxMat);
    strap2.position.set(0, 0.65, 0);
    crateGroup.add(strap2);

    this.scene.add(crateGroup);
    this.collisionObjects.push(crateMesh);
    this.interactables.push(crateMesh);

    // 8. Utility Pole with cross-arm
    const poleGroup = new THREE.Group();
    poleGroup.position.set(-6.2, 0.18, 8.0);

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 8.5, 12);
    const poleMesh = new THREE.Mesh(poleGeo, sidewalkMat);
    poleMesh.position.set(0, 4.25, 0);
    poleMesh.castShadow = true;
    poleGroup.add(poleMesh);

    const armGeo = new THREE.BoxGeometry(2.4, 0.15, 0.15);
    const armMesh = new THREE.Mesh(armGeo, metalBoxMat);
    armMesh.position.set(0, 8.0, 0);
    armMesh.castShadow = true;
    poleGroup.add(armMesh);

    this.scene.add(poleGroup);
    this.collisionObjects.push(poleMesh);
  }

  private buildHeatwaveParticles(): void {
    // Scorching air dust motes rising gently in heat
    const count = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffd180,
      size: 0.07,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.heatParticles = new THREE.Points(geometry, material);
    this.scene.add(this.heatParticles);
  }

  public update(delta: number): void {
    if (this.heatParticles) {
      const posAttr = this.heatParticles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        // Float upwards like heat mirage
        arr[i + 1] += delta * (0.35 + (i % 5) * 0.05);
        if (arr[i + 1] > 8.5) {
          arr[i + 1] = 0.1;
        }
      }
      posAttr.needsUpdate = true;
    }
  }
}
