import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ThreeMoonSceneProps {
  mode?: 'embedded' | 'modal';
  isOpen?: boolean;
  embedded?: boolean;
  onClose?: () => void;
  onOpenColoringStudio?: () => void;
  onExpandFullscreen?: () => void;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
  onOpenColoring?: () => void;
}

type FocusTargetKey = 'room' | 'miso' | 'plum' | 'pip' | 'sprout' | 'window';

interface CameraPreset {
  pos: [number, number, number];
  target: [number, number, number];
  label: string;
  badge: string;
}

const CAMERA_PRESETS: Record<FocusTargetKey, CameraPreset> = {
  room: {
    pos: [0.2, 4.1, 7.8],
    target: [0, 1.35, -0.1],
    label: 'Full Picnic',
    badge: '3D Toy Island · Golden Moon & Lanterns',
  },
  miso: {
    pos: [-1.45, 2.55, 3.85],
    target: [-1.35, 1.45, 0.05],
    label: 'Miso',
    badge: 'Miso · Cream Kitten, Sky Bow & Warm Bun',
  },
  plum: {
    pos: [1.55, 2.55, 3.85],
    target: [1.35, 1.45, 0.05],
    label: 'Plum (0.95)',
    badge: 'Plum · Strawberry Hood & Fresh Tulips',
  },
  pip: {
    pos: [-0.95, 1.65, 3.35],
    target: [-0.82, 0.68, 1.15],
    label: 'Pip (0.45)',
    badge: 'Pip · Plump Star Pillow & Berry Bowl',
  },
  sprout: {
    pos: [0.35, 2.05, 2.75],
    target: [0.32, 1.05, 0.18],
    label: 'Sprout (0.30)',
    badge: 'Sprout · Leaf Coaster, Cocoa & Coloring Book',
  },
  window: {
    pos: [0.0, 3.45, 5.5],
    target: [0, 2.35, -1.2],
    label: 'Moon Arch',
    badge: 'Sculpted Crescent Moon · Cottage Window & Lanterns',
  },
};

export const ThreeMoonScene: React.FC<ThreeMoonSceneProps> = ({
  mode,
  isOpen = true,
  embedded = false,
  onClose,
  onOpenColoringStudio,
  onExpandFullscreen,
  onOpenModal,
  onCloseModal,
  onOpenColoring,
}) => {
  const effectiveMode: 'embedded' | 'modal' = mode ?? (embedded ? 'embedded' : 'modal');
  const handleOpenModal = onOpenModal ?? onExpandFullscreen;
  const handleCloseModal = onCloseModal ?? onClose;
  const handleOpenColoring = onOpenColoring ?? onOpenColoringStudio;

  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeFocus, setActiveFocus] = useState<FocusTargetKey>('room');
  const [webglError, setWebglError] = useState<boolean>(false);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  const focusRef = useRef<FocusTargetKey>('room');
  const isUserDraggingRef = useRef<boolean>(false);

  const handleSelectFocus = (key: FocusTargetKey) => {
    focusRef.current = key;
    setActiveFocus(key);
  };

  useEffect(() => {
    if (effectiveMode === 'modal' && !isOpen) return;
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || 860;
    const height = container.clientHeight || 540;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Rich cozy storybook twilight sky backdrop so the golden moon, cream cat & lanterns pop
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#241B38');
    scene.fog = new THREE.FogExp2('#241B38', 0.022);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 80);
    camera.position.set(...CAMERA_PRESETS.room.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minPolarAngle = 0.22;
    controls.minDistance = 2.4;
    controls.maxDistance = 13.5;
    controls.target.set(...CAMERA_PRESETS.room.target);

    const onStart = () => {
      isUserDraggingRef.current = true;
    };
    const onEnd = () => {
      setTimeout(() => {
        isUserDraggingRef.current = false;
      }, 2800);
    };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);

    // =========================================================================
    // TOY-STUDIO SOFT CLAY & VINYL PBR MATERIALS
    // =========================================================================
    const createClayMat = (
      hex: string,
      opts: {
        roughness?: number;
        clearcoat?: number;
        clearcoatRoughness?: number;
        emissive?: string;
        emissiveIntensity?: number;
        map?: THREE.Texture;
      } = {}
    ) => {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hex),
        roughness: opts.roughness ?? 0.48,
        metalness: 0.0,
        clearcoat: opts.clearcoat ?? 0.14,
        clearcoatRoughness: opts.clearcoatRoughness ?? 0.36,
        reflectivity: 0.25,
        emissive: opts.emissive ? new THREE.Color(opts.emissive) : new THREE.Color('#000000'),
        emissiveIntensity: opts.emissiveIntensity ?? 0,
        map: opts.map ?? null,
      });
    };

    const createEyeMat = () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#231715'),
        roughness: 0.08,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
      });

    // Procedural gingham picnic blanket texture
    const createGinghamTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#FFF9F2';
      ctx.fillRect(0, 0, 512, 512);

      const step = 64;
      for (let y = 0; y < 512; y += step) {
        for (let x = 0; x < 512; x += step) {
          const isEvenX = (x / step) % 2 === 0;
          const isEvenY = (y / step) % 2 === 0;
          if (!isEvenX && !isEvenY) {
            ctx.fillStyle = '#F28B9C';
            ctx.fillRect(x, y, step, step);
          } else if (!isEvenX || !isEvenY) {
            ctx.fillStyle = '#FBD0D9';
            ctx.fillRect(x, y, step, step);
          }
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2.5, 2.5);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // Procedural honey-oak plank texture
    const createWoodDeckTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#DFAD76';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 8; i++) {
        const y = i * 64;
        ctx.fillStyle = i % 2 === 0 ? '#E3B37C' : '#D8A36C';
        ctx.fillRect(0, y, 512, 61);
        ctx.fillStyle = '#B8804A';
        ctx.fillRect(0, y + 61, 512, 3);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // Procedural open coloring book spread texture
    const createColoringSpreadTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#FFFDF9';
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#D9C5B2';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(256, 0);
      ctx.lineTo(256, 256);
      ctx.stroke();

      // Left page: colored strawberry + star
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#3A231E';
      ctx.fillStyle = '#FF6B7B';
      ctx.beginPath();
      ctx.arc(128, 134, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6DC07A';
      ctx.beginPath();
      ctx.ellipse(128, 86, 28, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right page: golden moon & clouds
      ctx.fillStyle = '#FFD86B';
      ctx.beginPath();
      ctx.arc(376, 120, 44, 0.3, Math.PI * 1.65);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#BDE3FF';
      ctx.beginPath();
      ctx.arc(390, 174, 24, 0, Math.PI * 2);
      ctx.arc(416, 174, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // =========================================================================
    // 3-POINT TOY-STUDIO LIGHTING RIG
    // =========================================================================
    const hemiLight = new THREE.HemisphereLight('#FFF6EA', '#9A7BB5', 1.15);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFF3DE', 1.45);
    keyLight.position.set(5.5, 9.0, 6.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 24;
    const d = 4.8;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Soft lavender fill light from the left
    const fillLight = new THREE.DirectionalLight('#E0C8FF', 0.68);
    fillLight.position.set(-6.0, 5.0, 4.0);
    scene.add(fillLight);

    // Warm golden rim light from the moon arch behind
    const rimLight = new THREE.DirectionalLight('#FFD27D', 0.82);
    rimLight.position.set(0.0, 5.5, -5.5);
    scene.add(rimLight);

    // =========================================================================
    // MASTER DIORAMA GROUP & INTERACTIVE TARGETS
    // =========================================================================
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const interactiveMeshes: { mesh: THREE.Object3D; focus: FocusTargetKey; name: string }[] = [];
    const registerInteractive = (root: THREE.Object3D, focus: FocusTargetKey, name: string) => {
      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.userData = { focus, name };
          interactiveMeshes.push({ mesh: child, focus, name });
        }
      });
    };

    // =========================================================================
    // 1. FLOATING STORYBOOK ISLAND BASE, CLOUDS, MEADOW & PICNIC BLANKET
    // =========================================================================
    const islandGroup = new THREE.Group();
    worldGroup.add(islandGroup);

    // Terracotta & lavender-clay tiered island base
    const subBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.45, 2.75, 0.55, 64),
      createClayMat('#B9929F', { roughness: 0.65 })
    );
    subBase.position.y = -0.45;
    subBase.receiveShadow = true;
    islandGroup.add(subBase);

    // Lush sage-green rounded meadow rim
    const meadowRim = new THREE.Mesh(
      new THREE.CylinderGeometry(3.65, 3.48, 0.34, 64),
      createClayMat('#8CC67B', { roughness: 0.56 })
    );
    meadowRim.position.y = -0.08;
    meadowRim.receiveShadow = true;
    islandGroup.add(meadowRim);

    const meadowLip = new THREE.Mesh(
      new THREE.TorusGeometry(3.52, 0.16, 20, 64),
      createClayMat('#9BD189', { roughness: 0.54 })
    );
    meadowLip.rotation.x = Math.PI / 2;
    meadowLip.position.y = 0.04;
    meadowLip.receiveShadow = true;
    islandGroup.add(meadowLip);

    // Warm honey-oak circular wooden deck inset
    const woodDeck = new THREE.Mesh(
      new THREE.CylinderGeometry(3.15, 3.18, 0.14, 64),
      createClayMat('#FFFFFF', { map: createWoodDeckTexture(), roughness: 0.5 })
    );
    woodDeck.position.y = 0.1;
    woodDeck.receiveShadow = true;
    islandGroup.add(woodDeck);

    // Plush gingham picnic blanket with cream trim border
    const blanketMain = new THREE.Mesh(
      new THREE.CylinderGeometry(2.38, 2.42, 0.06, 64),
      createClayMat('#FFFFFF', { map: createGinghamTexture(), roughness: 0.62, clearcoat: 0.04 })
    );
    blanketMain.position.set(0, 0.18, 0.18);
    blanketMain.receiveShadow = true;
    islandGroup.add(blanketMain);

    const blanketTrim = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.045, 16, 64),
      createClayMat('#FFF5E4', { roughness: 0.6 })
    );
    blanketTrim.rotation.x = Math.PI / 2;
    blanketTrim.position.set(0, 0.19, 0.18);
    islandGroup.add(blanketTrim);

    // Floating 3D Cloud Ring cradling the island
    const cloudMat = createClayMat('#F8F2FF', {
      roughness: 0.38,
      clearcoat: 0.2,
      emissive: '#4A3869',
      emissiveIntensity: 0.15,
    });
    const cloudPositions: [number, number, number, number][] = [
      [-3.55, -0.18, 1.1, 0.56],
      [-3.15, -0.25, 1.85, 0.44],
      [-3.7, -0.2, 0.35, 0.48],
      [3.55, -0.18, 1.0, 0.54],
      [3.15, -0.24, 1.75, 0.42],
      [3.7, -0.22, 0.2, 0.48],
      [-2.7, -0.22, -2.5, 0.62],
      [-2.0, -0.28, -3.0, 0.5],
      [2.6, -0.22, -2.5, 0.6],
      [1.9, -0.26, -3.0, 0.48],
      [0.0, -0.35, 3.65, 0.46],
      [-0.65, -0.38, 3.55, 0.38],
      [0.65, -0.38, 3.55, 0.38],
    ];
    const cloudsGroup = new THREE.Group();
    cloudPositions.forEach(([x, y, z, r]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24), cloudMat);
      puff.scale.set(1.22, 0.78, 1.05);
      puff.position.set(x, y, z);
      puff.receiveShadow = true;
      cloudsGroup.add(puff);
    });
    islandGroup.add(cloudsGroup);

    // Cute 3D Garden Toadstool Mushrooms & Bushes along the meadow rim
    const addMushroom = (x: number, z: number, scale = 1, rotY = 0) => {
      const mGroup = new THREE.Group();
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11 * scale, 0.15 * scale, 0.26 * scale, 20),
        createClayMat('#FFF5E6', { roughness: 0.5 })
      );
      stem.position.y = 0.13 * scale;
      stem.castShadow = true;
      mGroup.add(stem);

      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.25 * scale, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.58),
        createClayMat('#F25C69', { roughness: 0.38, clearcoat: 0.25 })
      );
      cap.position.y = 0.22 * scale;
      cap.castShadow = true;
      mGroup.add(cap);

      const spotMat = createClayMat('#FFFDF9', { roughness: 0.4 });
      [
        [0, 0.23, 0.11],
        [0.14, 0.18, 0.12],
        [-0.14, 0.18, 0.11],
        [0.08, 0.19, -0.14],
        [-0.09, 0.19, -0.12],
      ].forEach(([sx, sy, sz]) => {
        const spot = new THREE.Mesh(new THREE.SphereGeometry(0.042 * scale, 12, 12), spotMat);
        spot.position.set(sx * scale, (0.22 + sy * 0.5) * scale, sz * scale);
        mGroup.add(spot);
      });

      mGroup.position.set(x, 0.12, z);
      mGroup.rotation.y = rotY;
      islandGroup.add(mGroup);
    };
    addMushroom(-3.05, 0.85, 1.0, 0.3);
    addMushroom(-3.25, 1.25, 0.72, -0.4);
    addMushroom(3.08, 0.75, 0.92, -0.2);

    // Sculpted Shrubs with Pastel Blossoms
    const bushMat = createClayMat('#6EBA68', { roughness: 0.55 });
    const flowerPinkMat = createClayMat('#FF9EB5', { roughness: 0.4 });
    const flowerYellowMat = createClayMat('#FFD86B', { roughness: 0.4 });
    [
      [-2.85, 0.24, -1.65, 0.4],
      [-2.4, 0.2, -2.1, 0.32],
      [2.85, 0.24, -1.65, 0.4],
      [2.4, 0.2, -2.1, 0.32],
    ].forEach(([bx, by, bz, br], idx) => {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(br, 24, 24), bushMat);
      bush.scale.set(1.15, 0.82, 1.05);
      bush.position.set(bx, by, bz);
      bush.castShadow = true;
      islandGroup.add(bush);

      const blossom = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 14, 14),
        idx % 2 === 0 ? flowerPinkMat : flowerYellowMat
      );
      blossom.position.set(bx + 0.1, by + br * 0.75, bz + 0.12);
      islandGroup.add(blossom);
    });

    // =========================================================================
    // 2. TRUE SCULPTED 3D CRESCENT MOON, COTTAGE WINDOW & GLOWING LANTERNS
    // =========================================================================
    const moonWindowGroup = new THREE.Group();
    worldGroup.add(moonWindowGroup);

    // True 3D Sculpted Crescent Moon created with exact two-circle intersection arcs & ExtrudeGeometry
    const createCrescentMoonMesh = () => {
      const shape = new THREE.Shape();
      const R1 = 1.35;
      const R2 = 1.15;
      const d = 0.52;
      const xInt = (R1 * R1 - R2 * R2 + d * d) / (2 * d);
      const yInt = Math.sqrt(Math.max(0, R1 * R1 - xInt * xInt));
      const theta1 = Math.atan2(yInt, xInt);
      const theta2 = Math.atan2(yInt, xInt - d);

      // Outer circular arc from top horn through left belly to bottom horn
      shape.absarc(0, 0, R1, theta1, Math.PI * 2 - theta1, false);
      // Inner circular arc back from bottom horn through inner hollow to top horn
      shape.absarc(d, 0, R2, Math.PI * 2 - theta2, theta2, true);
      shape.closePath();

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: 0.24,
        bevelEnabled: true,
        bevelSegments: 14,
        steps: 1,
        bevelSize: 0.14,
        bevelThickness: 0.18,
        curveSegments: 48,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      const mat = createClayMat('#FFD859', {
        roughness: 0.3,
        clearcoat: 0.35,
        emissive: '#F5B027',
        emissiveIntensity: 0.28,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    const crescentMoon = createCrescentMoonMesh();
    // Nestled in the upper-left twilight sky beside the cottage window, 100% inside the frame
    crescentMoon.scale.set(0.68, 0.68, 0.68);
    crescentMoon.position.set(-1.82, 2.58, -1.45);
    crescentMoon.rotation.z = -0.22;
    crescentMoon.rotation.y = 0.24;
    moonWindowGroup.add(crescentMoon);

    // Cozy Arched Cottage Window Frame at the back of the deck
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0.25, 1.85, -1.95);
    moonWindowGroup.add(windowGroup);

    const frameWoodMat = createClayMat('#B57642', { roughness: 0.5 });
    const sillWoodMat = createClayMat('#965D2E', { roughness: 0.52 });

    // Night sky glass backing inside the arched window
    const skyGlassMat = new THREE.MeshBasicMaterial({ color: '#1B254B' });
    const skyCircle = new THREE.Mesh(new THREE.CircleGeometry(1.02, 40), skyGlassMat);
    skyCircle.position.set(0, 0.22, -0.04);
    windowGroup.add(skyCircle);

    const skyRect = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 1.05), skyGlassMat);
    skyRect.position.set(0, -0.3, -0.04);
    windowGroup.add(skyRect);

    // Little glowing stars & mini crescent inside the cottage window pane
    const paneStarMat = new THREE.MeshBasicMaterial({ color: '#FFE885' });
    [
      [-0.45, 0.55],
      [0.48, 0.62],
      [-0.58, -0.25],
      [0.52, -0.18],
      [-0.22, 0.22],
      [0.32, 0.28],
    ].forEach(([sx, sy], idx) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(idx % 2 === 0 ? 0.042 : 0.028, 12, 12),
        paneStarMat
      );
      dot.position.set(sx, sy, -0.01);
      windowGroup.add(dot);
    });

    // Arched upper frame
    const archFrame = new THREE.Mesh(
      new THREE.TorusGeometry(1.04, 0.12, 20, 48, Math.PI),
      frameWoodMat
    );
    archFrame.position.set(0, 0.22, 0);
    archFrame.castShadow = true;
    windowGroup.add(archFrame);

    // Side pillars
    [-1.04, 1.04].forEach((px) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1.08, 20),
        frameWoodMat
      );
      pillar.position.set(px, -0.32, 0);
      pillar.castShadow = true;
      windowGroup.add(pillar);
    });

    // Window crossbars
    const vCross = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.08, 16), frameWoodMat);
    vCross.position.set(0, 0.22, 0.02);
    windowGroup.add(vCross);

    const hCross = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.04, 16), frameWoodMat);
    hCross.rotation.z = Math.PI / 2;
    hCross.position.set(0, 0.2, 0.02);
    windowGroup.add(hCross);

    // Chunky wooden window sill
    const sill = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.18, 0.34), sillWoodMat);
    sill.position.set(0, -0.86, 0.04);
    sill.castShadow = true;
    sill.receiveShadow = true;
    windowGroup.add(sill);

    // Hanging Warm Paper Lanterns + Floating 3D Star Pillows in the sky
    const lanterns: THREE.Group[] = [];
    const lanternCapMat = createClayMat('#8E552B', { roughness: 0.5 });
    const lanternBodyMat = createClayMat('#FFF3C4', {
      roughness: 0.3,
      emissive: '#FFB838',
      emissiveIntensity: 0.55,
    });
    const lanternRibMat = createClayMat('#E89A3C', {
      roughness: 0.4,
      emissive: '#E89A3C',
      emissiveIntensity: 0.25,
    });

    const createHangingLantern = (x: number, y: number, z: number, cordLen: number) => {
      const lGroup = new THREE.Group();
      lGroup.position.set(x, y, z);

      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, cordLen, 10),
        lanternCapMat
      );
      cord.position.y = cordLen / 2 + 0.22;
      lGroup.add(cord);

      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), lanternBodyMat);
      globe.scale.set(0.95, 1.18, 0.95);
      lGroup.add(globe);

      // Decorative paper ribs
      [-0.1, 0, 0.1].forEach((ry) => {
        const rib = new THREE.Mesh(
          new THREE.TorusGeometry(0.225 * Math.cos(ry * 2.2), 0.01, 10, 28),
          lanternRibMat
        );
        rib.rotation.x = Math.PI / 2;
        rib.position.y = ry;
        lGroup.add(rib);
      });

      const topCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.13, 0.055, 18),
        lanternCapMat
      );
      topCap.position.y = 0.26;
      lGroup.add(topCap);

      const botCap = topCap.clone();
      botCap.position.y = -0.26;
      lGroup.add(botCap);

      // Tassel
      const tassel = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.14, 12),
        createClayMat('#F26678', { roughness: 0.5 })
      );
      tassel.position.y = -0.35;
      lGroup.add(tassel);

      const ptLight = new THREE.PointLight('#FFCC66', 0.65, 5.5);
      lGroup.add(ptLight);

      moonWindowGroup.add(lGroup);
      lanterns.push(lGroup);
    };

    createHangingLantern(-2.15, 3.05, -0.95, 0.75);
    createHangingLantern(0.05, 3.35, -1.25, 0.65);
    createHangingLantern(2.05, 3.05, -0.95, 0.75);

    // Floating 3D Star Pillows in the twilight sky
    const skyStarMat = createClayMat('#FFE47A', {
      roughness: 0.32,
      emissive: '#FFBF38',
      emissiveIntensity: 0.45,
    });
    const floatingSkyStars: THREE.Mesh[] = [];
    [
      [-3.1, 3.4, -1.8, 0.16],
      [2.85, 3.55, -1.7, 0.15],
      [-1.85, 3.85, -2.2, 0.11],
      [1.45, 3.8, -2.1, 0.12],
      [3.2, 2.2, -1.4, 0.11],
      [-3.25, 2.1, -1.3, 0.12],
    ].forEach(([sx, sy, sz, sr]) => {
      const starOct = new THREE.Mesh(new THREE.OctahedronGeometry(sr, 1), skyStarMat);
      starOct.scale.set(1, 1, 0.55);
      starOct.position.set(sx, sy, sz);
      moonWindowGroup.add(starOct);
      floatingSkyStars.push(starOct);
    });

    registerInteractive(
      moonWindowGroup,
      'window',
      'Crescent Moon Arch · Cottage Window & Lanterns'
    );

    // =========================================================================
    // 3. LOW ROUND OAK PICNIC TABLE, TREATS, CRAYONS & COLORING BOOK
    // =========================================================================
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0.21, 0.15);
    worldGroup.add(tableGroup);

    const tableTopMat = createClayMat('#E6B37A', { roughness: 0.42, clearcoat: 0.2 });
    const tableLegMat = createClayMat('#C68B53', { roughness: 0.5 });

    // Beveled oak tabletop
    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.12, 1.12, 0.11, 48),
      tableTopMat
    );
    tableTop.position.y = 0.56;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    const tableRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.055, 16, 48),
      tableTopMat
    );
    tableRim.rotation.x = Math.PI / 2;
    tableRim.position.y = 0.56;
    tableGroup.add(tableRim);

    // 4 splayed rounded wooden legs
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.075, 0.54, 20),
        tableLegMat
      );
      leg.position.set(Math.cos(angle) * 0.72, 0.27, Math.sin(angle) * 0.72);
      leg.rotation.z = -Math.cos(angle) * 0.1;
      leg.rotation.x = Math.sin(angle) * 0.1;
      leg.castShadow = true;
      tableGroup.add(leg);
    }

    // Open Coloring Book on the table
    const bookGroup = new THREE.Group();
    bookGroup.position.set(-0.08, 0.63, 0.36);
    bookGroup.rotation.y = 0.06;

    const bookCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.03, 0.52),
      createClayMat('#F0788C', { roughness: 0.5 })
    );
    bookCover.castShadow = true;
    bookGroup.add(bookCover);

    const bookSpread = new THREE.Mesh(
      new THREE.BoxGeometry(0.71, 0.035, 0.47),
      createClayMat('#FFFFFF', { map: createColoringSpreadTexture(), roughness: 0.55 })
    );
    bookSpread.position.y = 0.018;
    bookGroup.add(bookSpread);
    tableGroup.add(bookGroup);

    // Ceramic Crayon Cup with 5 Pastel Wax Crayons
    const crayonCupGroup = new THREE.Group();
    crayonCupGroup.position.set(-0.28, 0.62, -0.2);

    const cupMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.1, 0.22, 24),
      createClayMat('#FFF8EE', { roughness: 0.3, clearcoat: 0.4 })
    );
    cupMesh.position.y = 0.11;
    cupMesh.castShadow = true;
    crayonCupGroup.add(cupMesh);

    const crayonData: [string, number, number, number, number][] = [
      ['#FF6B7B', -0.04, 0.02, 0.16, 0.08],
      ['#FFD154', 0.04, 0.03, -0.14, 0.1],
      ['#6BC88B', 0.0, -0.04, 0.06, -0.14],
      ['#72BAFC', -0.03, -0.02, -0.1, -0.08],
      ['#B98EFF', 0.03, 0.0, 0.12, 0.06],
    ];
    crayonData.forEach(([cHex, cx, cz, rx, rz]) => {
      const cStick = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.22, 14),
        createClayMat(cHex, { roughness: 0.4 })
      );
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.026, 0.065, 14),
        createClayMat(cHex, { roughness: 0.35 })
      );
      tip.position.y = 0.14;
      cStick.add(body, tip);
      cStick.position.set(cx, 0.18, cz);
      cStick.rotation.set(rx, 0, rz);
      crayonCupGroup.add(cStick);
    });
    tableGroup.add(crayonCupGroup);

    // Warm Pink Cocoa Mug with Whipped Cream & Heart Topping
    const mugGroup = new THREE.Group();
    mugGroup.position.set(-0.52, 0.62, 0.08);

    const mugBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.115, 0.24, 24),
      createClayMat('#F4798B', { roughness: 0.32, clearcoat: 0.45 })
    );
    mugBody.position.y = 0.12;
    mugBody.castShadow = true;
    mugGroup.add(mugBody);

    const mugHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.022, 12, 20, Math.PI),
      createClayMat('#F4798B', { roughness: 0.32 })
    );
    mugHandle.rotation.z = -Math.PI / 2;
    mugHandle.position.set(-0.12, 0.12, 0);
    mugGroup.add(mugHandle);

    const whip = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 18, 18),
      createClayMat('#FFFBF4', { roughness: 0.4 })
    );
    whip.scale.set(1, 0.72, 1);
    whip.position.y = 0.24;
    mugGroup.add(whip);
    tableGroup.add(mugGroup);

    // Glazed Swirled Cinnamon Bun on a Cream Plate
    const plateGroup = new THREE.Group();
    plateGroup.position.set(-0.02, 0.62, -0.32);

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.19, 0.035, 28),
      createClayMat('#FFFDF9', { roughness: 0.3, clearcoat: 0.4 })
    );
    plate.position.y = 0.018;
    plateGroup.add(plate);

    const bun = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 24, 20),
      createClayMat('#E59446', { roughness: 0.38, clearcoat: 0.28 })
    );
    bun.scale.set(1.15, 0.68, 1.15);
    bun.position.y = 0.1;
    plateGroup.add(bun);

    const icing = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.026, 12, 24),
      createClayMat('#FFFDF9', { roughness: 0.25, clearcoat: 0.6 })
    );
    icing.rotation.x = Math.PI / 2;
    icing.position.y = 0.19;
    plateGroup.add(icing);
    tableGroup.add(plateGroup);

    // =========================================================================
    // 4. SPROUT THE SNAIL (0.30 SCALE) ON LEAF COASTER
    // =========================================================================
    const sproutGroup = new THREE.Group();
    sproutGroup.position.set(0.45, 0.62, 0.05);
    sproutGroup.rotation.y = -0.45;
    tableGroup.add(sproutGroup);

    const leafMat = createClayMat('#78C268', { roughness: 0.5 });
    const leafPad = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.035, 32), leafMat);
    leafPad.scale.set(1.22, 1, 0.88);
    leafPad.position.y = 0.018;
    leafPad.castShadow = true;
    sproutGroup.add(leafPad);

    const snailMintMat = createClayMat('#B5E69C', { roughness: 0.42, clearcoat: 0.22 });
    const snailFoot = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.2, 16, 20), snailMintMat);
    snailFoot.rotation.z = Math.PI / 2;
    snailFoot.position.set(-0.02, 0.09, 0);
    snailFoot.castShadow = true;
    sproutGroup.add(snailFoot);

    const snailHead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 20), snailMintMat);
    snailHead.position.set(-0.14, 0.15, 0);
    sproutGroup.add(snailHead);

    // Spiraled Cinnamon-Caramel Snail Shell
    const shellGroup = new THREE.Group();
    shellGroup.position.set(0.06, 0.2, 0);

    const shellMain = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 24, 24),
      createClayMat('#C87D4B', { roughness: 0.44, clearcoat: 0.2 })
    );
    shellMain.scale.set(1.05, 1.05, 0.78);
    shellMain.castShadow = true;
    shellGroup.add(shellMain);

    const swirlMat = createClayMat('#8E4F29', { roughness: 0.5 });
    [0.085, 0.04].forEach((sr, idx) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(sr, 0.015, 12, 24), swirlMat);
      ring.position.z = 0.125 + idx * 0.005;
      shellGroup.add(ring);

      const ringBack = ring.clone();
      ringBack.position.z = -(0.125 + idx * 0.005);
      shellGroup.add(ringBack);
    });
    sproutGroup.add(shellGroup);

    // Eye stalks & glossy eyes
    const eyeMat = createEyeMat();
    const blushMat = createClayMat('#FF8B9E', { roughness: 0.5 });
    [-0.045, 0.045].forEach((ez) => {
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, 0.1, 10),
        snailMintMat
      );
      stalk.position.set(-0.18, 0.25, ez);
      stalk.rotation.z = 0.25;
      sproutGroup.add(stalk);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 14), eyeMat);
      eye.position.set(-0.2, 0.3, ez);
      sproutGroup.add(eye);

      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 10), blushMat);
      cheek.position.set(-0.22, 0.14, ez * 1.3);
      sproutGroup.add(cheek);
    });

    // Petite strawberry beside Sprout
    const miniBerry = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.14, 18),
      createClayMat('#F2495E', { roughness: 0.35, clearcoat: 0.3 })
    );
    miniBerry.rotation.x = Math.PI;
    miniBerry.position.set(-0.22, 0.1, 0.24);
    sproutGroup.add(miniBerry);

    registerInteractive(
      sproutGroup,
      'sprout',
      'Sprout (0.30 scale) · Cozy Snail on Leaf Coaster'
    );

    // =========================================================================
    // HELPER: CREATE TUFTED PLUSH FLOOR CUSHION
    // =========================================================================
    const createTuftedCushion = (radius: number, height: number, hex: string, buttonHex: string) => {
      const cGroup = new THREE.Group();
      const mat = createClayMat(hex, { roughness: 0.56 });
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.85, radius * 0.85, height, 32),
        mat
      );
      core.castShadow = true;
      core.receiveShadow = true;
      cGroup.add(core);

      const lobes = 10;
      for (let i = 0; i < lobes; i++) {
        const ang = (i * Math.PI * 2) / lobes;
        const lobe = new THREE.Mesh(new THREE.SphereGeometry(height * 0.72, 20, 20), mat);
        lobe.scale.set(1.25, 0.75, 1.35);
        lobe.position.set(Math.cos(ang) * radius * 0.76, 0, Math.sin(ang) * radius * 0.76);
        lobe.rotation.y = -ang;
        lobe.castShadow = true;
        lobe.receiveShadow = true;
        cGroup.add(lobe);
      }

      const btn = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.12, 14, 14),
        createClayMat(buttonHex, { roughness: 0.5 })
      );
      btn.scale.set(1, 0.45, 1);
      btn.position.y = height * 0.52;
      cGroup.add(btn);

      return cGroup;
    };

    // =========================================================================
    // HELPER: ADD EXPRESSIVE FLUSH KAWAII FACE (EYES, CATCHLIGHTS, NOSE, W-MOUTH)
    // =========================================================================
    const attachKawaiiFace = (
      headGroup: THREE.Group,
      faceZ: number,
      eyeSpacing: number,
      eyeY: number,
      noseHex = '#F47B8E'
    ) => {
      const catchMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
      const mouthLineMat = createClayMat('#3A231E', { roughness: 0.4 });

      [-1, 1].forEach((dir) => {
        // Large glossy oval kawaii eye
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.086, 22, 22), eyeMat);
        eye.scale.set(0.95, 1.12, 0.58);
        eye.position.set(dir * eyeSpacing, eyeY, faceZ);
        headGroup.add(eye);

        // Big upper-left white catchlight
        const catchBig = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), catchMat);
        catchBig.position.set(dir * eyeSpacing - 0.022, eyeY + 0.032, faceZ + 0.046);
        headGroup.add(catchBig);

        // Tiny lower-right white catchlight
        const catchSmall = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 10), catchMat);
        catchSmall.position.set(dir * eyeSpacing + 0.022, eyeY - 0.026, faceZ + 0.045);
        headGroup.add(catchSmall);

        // Soft rosy cheek oval
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 18), blushMat);
        cheek.scale.set(1.3, 0.68, 0.35);
        cheek.position.set(dir * (eyeSpacing + 0.13), eyeY - 0.1, faceZ - 0.03);
        cheek.rotation.y = dir * 0.25;
        headGroup.add(cheek);
      });

      // Tiny button nose flush on the face
      const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.044, 16, 16),
        createClayMat(noseHex, { roughness: 0.35 })
      );
      nose.scale.set(1.25, 0.85, 0.65);
      nose.position.set(0, eyeY - 0.055, faceZ + 0.04);
      headGroup.add(nose);

      // Cute curved 'w' cat/bunny mouth right below the nose
      [-1, 1].forEach((dir) => {
        const smile = new THREE.Mesh(
          new THREE.TorusGeometry(0.046, 0.013, 12, 24, Math.PI),
          mouthLineMat
        );
        smile.rotation.z = Math.PI;
        smile.position.set(dir * 0.044, eyeY - 0.085, faceZ + 0.035);
        headGroup.add(smile);
      });
    };

    // =========================================================================
    // 5. MISO THE CREAM KITTEN (1.00 HERO SCALE)
    // =========================================================================
    const misoGroup = new THREE.Group();
    misoGroup.position.set(-1.38, 0.21, 0.18);
    misoGroup.rotation.y = 0.56;
    worldGroup.add(misoGroup);

    // Tufted Coral-Pink Floor Cushion
    const misoCushion = createTuftedCushion(0.76, 0.22, '#F78C9B', '#FFE5EC');
    misoCushion.position.y = 0.11;
    misoGroup.add(misoCushion);

    const misoCreamMat = createClayMat('#FFF6E5', { roughness: 0.44, clearcoat: 0.16 });
    const misoCaramelMat = createClayMat('#E3A66B', { roughness: 0.46, clearcoat: 0.14 });
    const innerEarPinkMat = createClayMat('#F9B4C2', { roughness: 0.5 });

    // Plump teardrop torso
    const misoTorso = new THREE.Mesh(new THREE.SphereGeometry(0.58, 32, 32), misoCreamMat);
    misoTorso.scale.set(1.04, 0.94, 0.96);
    misoTorso.position.y = 0.66;
    misoTorso.castShadow = true;
    misoTorso.receiveShadow = true;
    misoGroup.add(misoTorso);

    // Seated lower paws with pink toe beans
    [-0.27, 0.27].forEach((fx) => {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), misoCreamMat);
      foot.scale.set(1.0, 0.72, 1.25);
      foot.position.set(fx, 0.34, 0.46);
      foot.castShadow = true;
      misoGroup.add(foot);

      const pad = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), innerEarPinkMat);
      pad.scale.set(1.1, 0.8, 0.4);
      pad.position.set(fx, 0.33, 0.64);
      misoGroup.add(pad);
    });

    // Knitted Golden-Mustard Scarf around neck
    const scarfMat = createClayMat('#F7BD45', { roughness: 0.52 });
    const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.125, 22, 42), scarfMat);
    scarfRing.rotation.x = Math.PI / 2 + 0.08;
    scarfRing.position.set(0, 1.04, 0.03);
    scarfRing.castShadow = true;
    misoGroup.add(scarfRing);

    const scarfKnot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 18), scarfMat);
    scarfKnot.position.set(0.22, 0.98, 0.42);
    misoGroup.add(scarfKnot);

    const scarfTail = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.24, 14, 18), scarfMat);
    scarfTail.position.set(0.25, 0.78, 0.47);
    scarfTail.rotation.z = -0.14;
    scarfTail.rotation.x = -0.12;
    scarfTail.castShadow = true;
    misoGroup.add(scarfTail);

    // Plump Kawaii Cat Head
    const misoHead = new THREE.Group();
    misoHead.position.set(0, 1.56, 0.04);
    misoGroup.add(misoHead);

    const misoHeadSphere = new THREE.Mesh(new THREE.SphereGeometry(0.68, 36, 36), misoCreamMat);
    misoHeadSphere.scale.set(1.16, 0.95, 1.04);
    misoHeadSphere.castShadow = true;
    misoHeadSphere.receiveShadow = true;
    misoHead.add(misoHeadSphere);

    // Cute cream fluff tuft on top of head
    const headTuft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), misoCreamMat);
    headTuft.scale.set(1.2, 0.7, 0.8);
    headTuft.position.set(0.02, 0.62, 0.15);
    misoHead.add(headTuft);

    // Sculpted Rounded Cat Ears (Left ear cream, Right ear honey-caramel tip)
    [-1, 1].forEach((dir) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(dir * 0.48, 0.5, -0.02);
      earGroup.rotation.z = -dir * 0.42;
      earGroup.rotation.x = 0.08;

      const outerEar = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 24, 24),
        dir === 1 ? misoCaramelMat : misoCreamMat
      );
      outerEar.scale.set(0.92, 1.22, 0.56);
      outerEar.castShadow = true;
      earGroup.add(outerEar);

      const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 18), innerEarPinkMat);
      innerEar.scale.set(0.82, 1.05, 0.35);
      innerEar.position.set(0, -0.02, 0.1);
      earGroup.add(innerEar);

      misoHead.add(earGroup);
    });

    // Signature Sky-Blue Puffy Ribbon Bow by Miso's Left Ear (clean geometry, zero clipping)
    const bowBlueMat = createClayMat('#74BEFA', { roughness: 0.36, clearcoat: 0.26 });
    const bowKnotMat = createClayMat('#4EA0E8', { roughness: 0.36, clearcoat: 0.26 });
    const bowGroup = new THREE.Group();
    bowGroup.position.set(-0.44, 0.52, 0.24);
    bowGroup.rotation.set(0.15, 0.28, 0.36);

    const bowCenter = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 18), bowKnotMat);
    bowCenter.scale.set(1, 0.9, 0.82);
    bowGroup.add(bowCenter);

    [-1, 1].forEach((bDir) => {
      const loop = new THREE.Mesh(new THREE.SphereGeometry(0.16, 22, 22), bowBlueMat);
      loop.scale.set(1.3, 0.85, 0.58);
      loop.position.set(bDir * 0.16, 0.02, -0.01);
      loop.rotation.z = bDir * 0.2;
      bowGroup.add(loop);

      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.11, 10, 14), bowBlueMat);
      tail.position.set(bDir * 0.08, -0.14, 0.02);
      tail.rotation.z = bDir * 0.38;
      bowGroup.add(tail);
    });
    misoHead.add(bowGroup);

    // Expressive Flush Kawaii Face on Miso
    attachKawaiiFace(misoHead, 0.67, 0.25, -0.03, '#F47B8E');

    // 3 Delicate Cat Whiskers on each cheek
    const whiskerMat = createClayMat('#4A3228', { roughness: 0.4 });
    [-1, 1].forEach((dir) => {
      [-0.04, -0.08, -0.12].forEach((wy, idx) => {
        const whisker = new THREE.Mesh(
          new THREE.CylinderGeometry(0.009, 0.009, 0.15, 8),
          whiskerMat
        );
        whisker.rotation.z = Math.PI / 2 + dir * (idx - 1) * 0.14;
        whisker.rotation.y = -dir * 0.32;
        whisker.position.set(dir * 0.56, wy, 0.53);
        misoHead.add(whisker);
      });
    });

    // Miso's Paws (Right paw offering a warm glazed cinnamon bun, Left paw waving)
    const misoArmR = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.125, 0.32, 16, 20),
      misoCreamMat
    );
    misoArmR.position.set(0.42, 0.8, 0.36);
    misoArmR.rotation.set(-0.78, -0.25, -0.45);
    misoArmR.castShadow = true;
    misoGroup.add(misoArmR);

    const misoHandBun = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 18, 18),
      createClayMat('#E59446', { roughness: 0.38, clearcoat: 0.28 })
    );
    misoHandBun.scale.set(1.15, 0.72, 1.15);
    misoHandBun.position.set(0.5, 0.88, 0.55);
    misoGroup.add(misoHandBun);

    const misoHandBunIcing = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.02, 10, 18),
      createClayMat('#FFFDF9', { roughness: 0.25 })
    );
    misoHandBunIcing.rotation.x = Math.PI / 2;
    misoHandBunIcing.position.set(0.5, 0.96, 0.55);
    misoGroup.add(misoHandBunIcing);

    const misoArmL = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.125, 0.3, 16, 20),
      misoCreamMat
    );
    misoArmL.position.set(-0.46, 0.78, 0.28);
    misoArmL.rotation.set(-0.55, 0.2, 0.45);
    misoArmL.castShadow = true;
    misoGroup.add(misoArmL);

    // Curled Cat Tail with Caramel Tip
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.25, 0.45, -0.42),
      new THREE.Vector3(-0.62, 0.62, -0.48),
      new THREE.Vector3(-0.78, 0.96, -0.25),
      new THREE.Vector3(-0.68, 1.22, -0.08),
    ]);
    const misoTail = new THREE.Mesh(
      new THREE.TubeGeometry(tailCurve, 24, 0.095, 16, false),
      misoCreamMat
    );
    misoTail.castShadow = true;
    misoGroup.add(misoTail);

    const misoTailTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 16, 16),
      misoCaramelMat
    );
    misoTailTip.position.set(-0.68, 1.22, -0.08);
    misoGroup.add(misoTailTip);

    registerInteractive(
      misoGroup,
      'miso',
      'Miso (1.00 scale) · Cream Kitten with Sky Bow & Warm Bun'
    );

    // =========================================================================
    // 6. PLUM THE RABBIT IN STRAWBERRY HOOD (0.95 SCALE)
    // =========================================================================
    const plumGroup = new THREE.Group();
    plumGroup.position.set(1.38, 0.21, 0.18);
    plumGroup.rotation.y = -0.58;
    plumGroup.scale.setScalar(0.95);
    worldGroup.add(plumGroup);

    // Tufted Sage-Mint Floor Cushion
    const plumCushion = createTuftedCushion(0.76, 0.22, '#9AD493', '#FFF5E4');
    plumCushion.position.y = 0.11;
    plumGroup.add(plumCushion);

    const plumLavMat = createClayMat('#E4CEF7', { roughness: 0.44, clearcoat: 0.16 });
    const berryHoodMat = createClayMat('#F24B60', { roughness: 0.36, clearcoat: 0.28 });
    const hoodTrimMat = createClayMat('#FFF6E8', { roughness: 0.52 });

    // Plump Lavender Bunny Torso
    const plumTorso = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 32), plumLavMat);
    plumTorso.scale.set(1.04, 0.92, 0.96);
    plumTorso.position.y = 0.65;
    plumTorso.castShadow = true;
    plumTorso.receiveShadow = true;
    plumGroup.add(plumTorso);

    // Soft Cream Belly Patch
    const plumBelly = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 24, 24),
      createClayMat('#FFF8EE', { roughness: 0.48 })
    );
    plumBelly.scale.set(0.92, 0.88, 0.35);
    plumBelly.position.set(0, 0.62, 0.44);
    plumGroup.add(plumBelly);

    // Seated Bunny Paws
    [-0.26, 0.26].forEach((fx) => {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), plumLavMat);
      foot.scale.set(1.0, 0.72, 1.25);
      foot.position.set(fx, 0.34, 0.45);
      foot.castShadow = true;
      plumGroup.add(foot);
    });

    // Sky-Blue Collar Bow at Neck
    const collarBow = new THREE.Group();
    collarBow.position.set(0, 1.03, 0.48);
    const cKnot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), bowKnotMat);
    collarBow.add(cKnot);
    [-1, 1].forEach((bDir) => {
      const cLoop = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 18), bowBlueMat);
      cLoop.scale.set(1.25, 0.82, 0.52);
      cLoop.position.set(bDir * 0.13, 0, 0);
      cLoop.rotation.z = bDir * 0.18;
      collarBow.add(cLoop);
    });
    plumGroup.add(collarBow);

    // Plum's Head & Tilted-Back Strawberry Hood with Cream Trim Rim
    const plumHead = new THREE.Group();
    plumHead.position.set(0, 1.54, 0.04);
    plumGroup.add(plumHead);

    const plumHeadSphere = new THREE.Mesh(new THREE.SphereGeometry(0.66, 36, 36), plumLavMat);
    plumHeadSphere.scale.set(1.14, 0.94, 1.02);
    plumHeadSphere.castShadow = true;
    plumHeadSphere.receiveShadow = true;
    plumHead.add(plumHeadSphere);

    // Cute lavender fluff tuft on Plum's forehead inside the hood opening
    const plumTuft = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), plumLavMat);
    plumTuft.scale.set(1.25, 0.75, 0.65);
    plumTuft.position.set(0, 0.34, 0.58);
    plumHead.add(plumTuft);

    // Sculpted 3D Strawberry Hood (tilted back slightly so Plum's face is 100% open and cute)
    const hoodGroup = new THREE.Group();
    hoodGroup.rotation.x = -0.24;
    plumHead.add(hoodGroup);

    const hoodCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.73, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.54),
      berryHoodMat
    );
    hoodCap.scale.set(1.14, 0.98, 1.06);
    hoodCap.position.y = 0.05;
    hoodCap.castShadow = true;
    hoodGroup.add(hoodCap);

    // Golden Strawberry Seeds on the Hood
    const seedMat = createClayMat('#FFE074', { roughness: 0.35 });
    [
      [-0.45, 0.42, 0.45],
      [0.45, 0.42, 0.45],
      [0.0, 0.52, 0.48],
      [-0.25, 0.58, 0.35],
      [0.25, 0.58, 0.35],
      [-0.62, 0.32, 0.15],
      [0.62, 0.32, 0.15],
      [-0.38, 0.45, -0.45],
      [0.38, 0.45, -0.45],
    ].forEach(([sx, sy, sz]) => {
      const seed = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.032, 8, 8), seedMat);
      seed.position.set(sx, sy, sz);
      seed.lookAt(0, 0, 0);
      hoodGroup.add(seed);
    });

    // 6-Leaf Green Strawberry Calyx Crown & Stem on Top of Hood
    const calyxGroup = new THREE.Group();
    calyxGroup.position.set(0, 0.74, 0);
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), leafMat);
      leaf.scale.set(0.62, 0.22, 1.55);
      leaf.position.set(Math.cos(ang) * 0.2, 0.01, Math.sin(ang) * 0.2);
      leaf.rotation.y = -ang + Math.PI / 2;
      leaf.rotation.x = 0.2;
      calyxGroup.add(leaf);
    }
    const hoodStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.05, 0.16, 14),
      createClayMat('#559E49', { roughness: 0.5 })
    );
    hoodStem.position.y = 0.09;
    hoodStem.rotation.z = 0.15;
    calyxGroup.add(hoodStem);
    hoodGroup.add(calyxGroup);

    // Long Floppy Lop Bunny Ears Framing Plum's Cheeks
    [-1, 1].forEach((dir) => {
      const lopGroup = new THREE.Group();
      lopGroup.position.set(dir * 0.68, 0.05, 0.06);
      lopGroup.rotation.z = dir * 0.22;
      lopGroup.rotation.x = 0.12;

      const lopEar = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.165, 0.54, 18, 24),
        plumLavMat
      );
      lopEar.scale.set(0.88, 1, 0.56);
      lopEar.position.y = -0.26;
      lopEar.castShadow = true;
      lopGroup.add(lopEar);

      const lopInner = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.095, 0.38, 14, 18),
        innerEarPinkMat
      );
      lopInner.scale.set(0.8, 1, 0.35);
      lopInner.position.set(0, -0.26, 0.06);
      lopGroup.add(lopInner);

      plumHead.add(lopGroup);
    });

    // Expressive Flush Kawaii Face on Plum
    attachKawaiiFace(plumHead, 0.64, 0.24, -0.05, '#D86B8E');

    // Plum's Paws Holding a Fresh Bouquet of 3 Tulips (Coral, Sunny Yellow, Lavender)
    const plumArmL = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.3, 16, 20),
      plumLavMat
    );
    plumArmL.position.set(-0.38, 0.78, 0.36);
    plumArmL.rotation.set(-0.75, 0.32, 0.45);
    plumArmL.castShadow = true;
    plumGroup.add(plumArmL);

    const plumArmR = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.28, 16, 20),
      plumLavMat
    );
    plumArmR.position.set(0.38, 0.76, 0.34);
    plumArmR.rotation.set(-0.65, -0.25, -0.42);
    plumArmR.castShadow = true;
    plumGroup.add(plumArmR);

    const bouquetGroup = new THREE.Group();
    bouquetGroup.position.set(-0.44, 0.88, 0.52);
    bouquetGroup.rotation.set(0.16, 0.2, 0.24);
    const tulipSpecs: [string, number, number, number, number][] = [
      ['#FF6E7E', -0.08, 0.22, 0.0, 0.22],
      ['#FFD654', 0.0, 0.26, 0.05, 0.0],
      ['#BA8CFF', 0.08, 0.21, -0.02, -0.22],
    ];
    tulipSpecs.forEach(([tHex, tx, ty, tz, rotZ]) => {
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.32, 10),
        leafMat
      );
      stem.position.set(tx * 0.5, 0.06, tz);
      stem.rotation.z = rotZ * 0.5;
      bouquetGroup.add(stem);

      const cup = new THREE.Mesh(
        new THREE.SphereGeometry(0.082, 18, 18),
        createClayMat(tHex, { roughness: 0.36, clearcoat: 0.25 })
      );
      cup.scale.set(0.92, 1.25, 0.92);
      cup.position.set(tx, ty, tz);
      cup.rotation.z = rotZ;
      bouquetGroup.add(cup);
    });
    plumGroup.add(bouquetGroup);

    // Cotton-ball Bunny Tail
    const bunnyTail = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 18, 18),
      createClayMat('#FFF8EE', { roughness: 0.52 })
    );
    bunnyTail.position.set(0, 0.45, -0.52);
    plumGroup.add(bunnyTail);

    registerInteractive(
      plumGroup,
      'plum',
      'Plum (0.95 scale) · Rabbit in Strawberry Hood with Tulip Bouquet'
    );

    // =========================================================================
    // 7. PIP THE PLUMP STAR (0.45 SCALE) & POLKA-DOT STRAWBERRY BOWL
    // =========================================================================
    const pipGroup = new THREE.Group();
    pipGroup.position.set(-0.78, 0.21, 1.18);
    pipGroup.rotation.y = 0.36;
    worldGroup.add(pipGroup);

    // Mini Tufted Honey Cushion for Pip
    const pipCushion = createTuftedCushion(0.42, 0.14, '#FAD075', '#FFF8E8');
    pipCushion.position.y = 0.07;
    pipGroup.add(pipCushion);

    // Extruded Beveled 5-Point Star Body
    const createStarMesh = () => {
      const starShape = new THREE.Shape();
      const pts = 5;
      const outerR = 0.44;
      const innerR = 0.25;
      for (let i = 0; i < pts * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / pts - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = -Math.sin(a) * r;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
      }
      starShape.closePath();

      const extrudeOpts: THREE.ExtrudeGeometryOptions = {
        depth: 0.14,
        bevelEnabled: true,
        bevelSegments: 12,
        steps: 1,
        bevelSize: 0.09,
        bevelThickness: 0.11,
      };
      const geo = new THREE.ExtrudeGeometry(starShape, extrudeOpts);
      geo.center();
      const mesh = new THREE.Mesh(
        geo,
        createClayMat('#FFE05D', {
          roughness: 0.34,
          clearcoat: 0.26,
          emissive: '#F5B82E',
          emissiveIntensity: 0.14,
        })
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    const pipBody = createStarMesh();
    pipBody.position.y = 0.52;
    pipGroup.add(pipBody);

    // Pip's Glossy Eyes, Catchlights, Smile & Rosy Cheeks
    const catchMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
    [-0.1, 0.1].forEach((ex) => {
      const pEye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 16), eyeMat);
      pEye.position.set(ex, 0.55, 0.17);
      pipGroup.add(pEye);

      const pCatch = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), catchMat);
      pCatch.position.set(ex - 0.01, 0.565, 0.198);
      pipGroup.add(pCatch);

      const pCheek = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), blushMat);
      pCheek.scale.set(1.2, 0.75, 0.4);
      pCheek.position.set(ex * 1.65, 0.49, 0.165);
      pipGroup.add(pCheek);
    });

    const pipSmile = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.009, 10, 20, Math.PI),
      createClayMat('#3A231E', { roughness: 0.4 })
    );
    pipSmile.rotation.z = Math.PI;
    pipSmile.position.set(0, 0.51, 0.175);
    pipGroup.add(pipSmile);

    // Polka-Dot Ceramic Berry Bowl Filled with 6 Plump Strawberries beside Pip
    const bowlGroup = new THREE.Group();
    bowlGroup.position.set(0.55, 0.02, 0.14);

    const bowlOuter = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 28, 20, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55),
      createClayMat('#D68CF5', { roughness: 0.3, clearcoat: 0.45 })
    );
    bowlOuter.position.y = 0.25;
    bowlOuter.castShadow = true;
    bowlGroup.add(bowlOuter);

    const bowlRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.275, 0.024, 14, 32),
      createClayMat('#FFFDF9', { roughness: 0.3 })
    );
    bowlRim.rotation.x = Math.PI / 2;
    bowlRim.position.y = 0.28;
    bowlGroup.add(bowlRim);

    const dotMat = createClayMat('#FFFDF9', { roughness: 0.35 });
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 10), dotMat);
      dot.position.set(Math.cos(a) * 0.265, 0.17, Math.sin(a) * 0.265);
      bowlGroup.add(dot);
    }

    [
      [0, 0.29, 0],
      [-0.12, 0.26, 0.08],
      [0.12, 0.26, 0.08],
      [-0.08, 0.26, -0.11],
      [0.09, 0.26, -0.1],
      [0, 0.34, 0.04],
    ].forEach(([bx, by, bz], idx) => {
      const b = new THREE.Mesh(
        new THREE.ConeGeometry(0.085, 0.15, 16),
        createClayMat('#F2495E', { roughness: 0.34, clearcoat: 0.3 })
      );
      b.rotation.set(Math.PI + (idx % 2) * 0.2, idx * 0.5, (idx % 3 - 1) * 0.2);
      b.position.set(bx, by, bz);
      bowlGroup.add(b);

      const bLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), leafMat);
      bLeaf.scale.set(1.2, 0.3, 1.2);
      bLeaf.position.set(bx, by + 0.06, bz);
      bowlGroup.add(bLeaf);
    });
    pipGroup.add(bowlGroup);

    registerInteractive(
      pipGroup,
      'pip',
      'Pip (0.45 scale) · Plump Star Friend & Polka-Dot Berry Bowl'
    );

    // =========================================================================
    // 8. RAYCASTER CLICK & HOVER INTERACTION
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const updatePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        interactiveMeshes.map((m) => m.mesh),
        false
      );
      if (hits.length > 0) {
        const data = hits[0].object.userData as { focus: FocusTargetKey; name: string };
        if (data?.name) {
          setHoveredName(data.name);
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredName(null);
      renderer.domElement.style.cursor = 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        interactiveMeshes.map((m) => m.mesh),
        false
      );
      if (hits.length > 0) {
        const data = hits[0].object.userData as { focus: FocusTargetKey; name: string };
        if (data?.focus) {
          isUserDraggingRef.current = false;
          handleSelectFocus(data.focus);
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('pointermove', onPointerMove);
    domElem.addEventListener('pointerup', onPointerUp);

    // =========================================================================
    // 9. ANIMATION LOOP (BREATHING CHARACTERS, LANTERN SWAY & CAMERA GLIDE)
    // =========================================================================
    let frameId = 0;
    const clock = new THREE.Clock();
    const desiredCamPos = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Gentle breathing & head tilt on Miso, Plum, Pip, and Sprout
      misoHead.rotation.z = Math.sin(t * 1.5) * 0.035;
      misoHead.position.y = 1.56 + Math.sin(t * 2.1) * 0.015;
      misoArmR.rotation.x = -0.78 + Math.sin(t * 2.4) * 0.04;

      plumHead.rotation.z = Math.sin(t * 1.4 + 1.2) * 0.035;
      plumHead.position.y = 1.54 + Math.sin(t * 2.0 + 1.0) * 0.015;
      bouquetGroup.rotation.z = 0.24 + Math.sin(t * 2.2) * 0.04;

      pipBody.position.y = 0.52 + Math.sin(t * 2.6 + 0.5) * 0.025;
      pipBody.rotation.z = Math.sin(t * 1.8) * 0.045;

      sproutGroup.position.y = 0.62 + Math.sin(t * 2.4) * 0.008;
      cloudsGroup.position.y = Math.sin(t * 1.1) * 0.025;

      // Gentle sway on hanging lanterns & twinkle on sky stars
      lanterns.forEach((l, idx) => {
        l.rotation.z = Math.sin(t * 1.3 + idx * 1.4) * 0.04;
      });
      floatingSkyStars.forEach((st, idx) => {
        st.rotation.y = t * 0.6 + idx;
        st.position.y += Math.sin(t * 2.0 + idx) * 0.0008;
      });

      // Smooth camera transition toward selected focus preset
      if (!isUserDraggingRef.current) {
        const preset = CAMERA_PRESETS[focusRef.current];
        desiredCamPos.set(...preset.pos);
        desiredTarget.set(...preset.target);

        if (focusRef.current === 'room') {
          desiredCamPos.x += Math.sin(t * 0.32) * 0.42;
          desiredCamPos.y += Math.sin(t * 0.45) * 0.08;
        }
        camera.position.lerp(desiredCamPos, 0.06);
        controls.target.lerp(desiredTarget, 0.08);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 860;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('pointermove', onPointerMove);
      domElem.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, [effectiveMode, isOpen]);

  if (effectiveMode === 'modal' && !isOpen) {
    return null;
  }

  if (webglError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl bg-[#FFF9F2] p-8 text-center border-2 border-[#322F37]">
        <p className="font-bold text-lg text-[#322F37]">
          Interactive 3D Picnic Preview — Miso, Plum, Pip &amp; Sprout
        </p>
        <img
          src="/assets/hero-moon-picnic.jpg"
          alt="The Little Moon Picnic illustration"
          className="mt-4 max-h-72 rounded-2xl object-contain"
        />
      </div>
    );
  }

  const currentPreset = CAMERA_PRESETS[activeFocus];

  const cardContent = (
    <div
      className={`three-moon-wrapper relative flex flex-col overflow-hidden rounded-[24px] border-2 border-[#322F37] bg-[#241B38] shadow-[0_14px_34px_rgba(36,27,56,0.22)] ${
        effectiveMode === 'modal' ? 'h-[min(82vh,720px)] w-[min(94vw,1120px)]' : 'h-[490px] w-full'
      }`}
    >
      {/* Top Floating Badge & Hover Readout */}
      <div className="pointer-events-none absolute top-3.5 left-3.5 right-3.5 z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[#322F37]/15 bg-[#FFFDF9]/95 px-3.5 py-1.5 text-xs font-bold text-[#322F37] shadow-sm backdrop-blur-sm">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#F5B82E]" />
          <span>{hoveredName || currentPreset.badge}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {handleOpenColoring && (
            <button
              type="button"
              onClick={handleOpenColoring}
              className="rounded-full border border-[#322F37]/20 bg-[#FFE066] px-3.5 py-1.5 text-xs font-bold text-[#322F37] shadow-sm transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              Color This Scene ✦
            </button>
          )}
          {effectiveMode === 'embedded' && handleOpenModal && (
            <button
              type="button"
              onClick={handleOpenModal}
              data-testid="button-open-3d-modal"
              className="rounded-full border border-[#322F37] bg-[#322F37] px-3.5 py-1.5 text-xs font-bold text-[#FFFDF9] shadow-sm transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              Fullscreen 3D Studio ↗
            </button>
          )}
          {effectiveMode === 'modal' && handleCloseModal && (
            <button
              type="button"
              onClick={handleCloseModal}
              data-testid="button-close-3d-modal"
              className="rounded-full border border-[#322F37] bg-[#FFFDF9] px-3.5 py-1.5 text-xs font-bold text-[#322F37] shadow-sm transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              Close ✕
            </button>
          )}
        </div>
      </div>

      {/* Three.js Canvas Mount */}
      <div
        ref={mountRef}
        className="relative h-full w-full flex-1 cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D Moon Picnic diorama with Miso, Plum, Pip, and Sprout"
      />

      {/* Bottom Camera Focus Bar */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-2 border-t border-[#322F37]/15 bg-[#FFFDF9]/95 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-[#6D6478]">
            Camera Focus:
          </span>
          {(Object.keys(CAMERA_PRESETS) as FocusTargetKey[]).map((key) => {
            const preset = CAMERA_PRESETS[key];
            const isSelected = activeFocus === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectFocus(key)}
                className={`diorama-focus-pill rounded-full px-3 py-1 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isSelected ? 'is-selected' : ''
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <span className="hidden text-xs font-medium text-[#6D6478] sm:inline">
          Drag to orbit · Scroll to zoom · Click any character
        </span>
      </div>
    </div>
  );

  if (effectiveMode === 'modal') {
    return (
      <div
        className="scene-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#181224]/80 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="3D Moon Picnic Studio"
      >
        {cardContent}
      </div>
    );
  }

  return cardContent;
};
