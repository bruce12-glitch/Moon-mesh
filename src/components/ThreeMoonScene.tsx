import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  dampValue,
  DioramaMoodId,
  DIORAMA_LIGHT_MOODS,
  getDioramaLightMood,
  getForestAudioUiState,
} from '../utils/moonMeshLogic';
import { forestAudio } from '../utils/forestAudio';

interface ThreeMoonSceneProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
  isForestSoundOn?: boolean;
  onToggleForestSound?: () => void;
}

type CameraPresetId = 'overview' | 'miso' | 'plum' | 'pip' | 'sprout' | 'window';

interface CameraPreset {
  id: CameraPresetId;
  label: string;
  badge: string;
  position: [number, number, number];
  target: [number, number, number];
  storyCaption: string;
}

const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'overview',
    label: 'Full Picnic',
    badge: '✦',
    position: [0, 3.85, 11.1],
    target: [0, 0.25, 0],
    storyCaption: 'Welcome to the Moonlit Forest Clearing — click any friend to say hello!',
  },
  {
    id: 'miso',
    label: 'Miso & Buns',
    badge: '🐱',
    position: [-2.15, 2.1, 6.2],
    target: [-1.15, 0.45, 0.2],
    storyCaption: 'Miso wrapped up in a golden knit scarf and offered Plum a warm honey bun!',
  },
  {
    id: 'plum',
    label: 'Plum & Berries',
    badge: '🐰',
    position: [2.25, 2.1, 6.2],
    target: [1.15, 0.45, 0.15],
    storyCaption: 'Plum brought fresh forest strawberries and sweet blueberries in a polka-dot bowl!',
  },
  {
    id: 'pip',
    label: 'Pip Star',
    badge: '⭐',
    position: [-3.1, 1.85, 6.35],
    target: [-2.15, 0.14, 1.3],
    storyCaption: 'Pip the Star is glowing beside the gingham blanket and counting paper moons!',
  },
  {
    id: 'sprout',
    label: 'Sprout & Tea',
    badge: '🐌',
    position: [2.75, 1.55, 5.8],
    target: [1.7, -0.25, 1.55],
    storyCaption: 'Sprout the Snail is keeping the blossom teacup cozy and warm!',
  },
  {
    id: 'window',
    label: 'Moon Window',
    badge: '🌙',
    position: [1.8, 2.75, 7.2],
    target: [1.85, 1.15, -1.6],
    storyCaption: 'Through the golden crescent window, the silver moon shines over the pine hills.',
  },
];

export const ThreeMoonScene: React.FC<ThreeMoonSceneProps> = ({
  isOpen = true,
  onClose,
  embedded = false,
  isForestSoundOn,
  onToggleForestSound,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activePreset, setActivePreset] = useState<CameraPresetId>('overview');
  const [lightingMood, setLightingMood] = useState<DioramaMoodId>('moonlit-night');
  const [storyBanner, setStoryBanner] = useState<string>(CAMERA_PRESETS[0].storyCaption);
  const [internalAudioPlaying, setInternalAudioPlaying] = useState<boolean>(() =>
    forestAudio.getIsPlaying()
  );

  const isAudioPlaying =
    typeof isForestSoundOn === 'boolean' ? isForestSoundOn : internalAudioPlaying;

  useEffect(() => {
    return forestAudio.subscribe((playing) => {
      setInternalAudioPlaying(playing);
    });
  }, []);

  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const activePresetRef = useRef<CameraPresetId>(activePreset);
  useEffect(() => {
    activePresetRef.current = activePreset;
  }, [activePreset]);

  const lightingMoodRef = useRef<DioramaMoodId>(lightingMood);
  useEffect(() => {
    lightingMoodRef.current = lightingMood;
  }, [lightingMood]);

  // Trigger character hop animation when clicked or selected via preset
  const hopTimersRef = useRef<Record<string, number>>({
    miso: 0,
    plum: 0,
    pip: 0,
    sprout: 0,
    heart: 0,
  });

  const handleToggleAudio = useCallback(() => {
    if (onToggleForestSound) {
      onToggleForestSound();
    } else {
      forestAudio.toggle();
    }
  }, [onToggleForestSound]);

  const handleSelectPreset = useCallback((presetId: CameraPresetId) => {
    setActivePreset(presetId);
    const found = CAMERA_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setStoryBanner(found.storyCaption);
    }
    if (presetId === 'overview') {
      setAutoRotate(true);
    } else {
      setAutoRotate(false);
      if (presetId in hopTimersRef.current) {
        hopTimersRef.current[presetId] = 1.0;
        hopTimersRef.current.heart = 1.0;
      }
    }
  }, []);

  useEffect(() => {
    if ((!isOpen && !embedded) || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const initialMood = getDioramaLightMood(lightingMoodRef.current);
    scene.fog = new THREE.FogExp2(initialMood.fogColor, 0.015);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 120);
    camera.position.set(0, 3.85, 11.1);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setIsLoaded(true);
      return;
    }

    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
      : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|Software/i.test(String(rendererStr));

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Rich PBR Studio Environment for subtle ceramic, wood, and golden reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.48;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Dynamic Sky Backdrop Generator matching Lighting Mood
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 512;
    const skyCtx = skyCanvas.getContext('2d');
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const paintSkyTexture = (moodId: DioramaMoodId) => {
      const m = getDioramaLightMood(moodId);
      if (!skyCtx) return;
      const grad = skyCtx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, m.skyTop);
      grad.addColorStop(0.42, m.skyMid);
      grad.addColorStop(0.76, m.skyHorizon);
      grad.addColorStop(1.0, m.skyBottom);
      skyCtx.fillStyle = grad;
      skyCtx.fillRect(0, 0, 512, 512);

      // Soft warm moonbeam glow in upper right
      const radial = skyCtx.createRadialGradient(365, 135, 12, 365, 135, 240);
      radial.addColorStop(0, 'rgba(255, 244, 196, 0.42)');
      radial.addColorStop(0.55, 'rgba(255, 210, 232, 0.16)');
      radial.addColorStop(1, 'rgba(55, 90, 158, 0)');
      skyCtx.fillStyle = radial;
      skyCtx.fillRect(0, 0, 512, 512);
      skyTex.needsUpdate = true;
    };

    paintSkyTexture(lightingMoodRef.current);
    scene.background = skyTex;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.06;
    controls.minPolarAngle = 0.24;
    controls.minDistance = 4.2;
    controls.maxDistance = 16.5;
    controls.target.set(0, 0.25, 0);

    const onStartInteraction = () => {
      if (activePresetRef.current === 'overview') {
        setAutoRotate(false);
      }
    };
    controls.addEventListener('start', onStartInteraction);

    // --- LIGHTING ---
    const ambientLight = new THREE.HemisphereLight(0xfff7e8, 0x3b2d54, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(
      initialMood.keyLightColor,
      initialMood.keyLightIntensity
    );
    keyLight.position.set(5.5, 9.5, 6.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = isSoftwareGl ? 512 : 2048;
    keyLight.shadow.mapSize.height = isSoftwareGl ? 512 : 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    const d = 6.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(
      initialMood.fillLightColor,
      initialMood.fillLightIntensity
    );
    fillLight.position.set(-6.5, 4.2, 4.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x9ec5ff, 1.15);
    rimLight.position.set(0, 5.5, -7.5);
    scene.add(rimLight);

    const moonGlowLight = new THREE.PointLight(0xffd56b, initialMood.moonGlowIntensity, 10);
    moonGlowLight.position.set(1.85, 1.4, -1.3);
    scene.add(moonGlowLight);

    const tableWarmLight = new THREE.PointLight(0xffb86c, 1.45, 5.5);
    tableWarmLight.position.set(0, 0.55, 0.9);
    scene.add(tableWarmLight);

    // --- STORYBOOK INK OUTLINE & CONTACT SHADOW HELPERS ---
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0x3d2219,
      side: THREE.BackSide,
    });

    const addToonMesh = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      parent: THREE.Object3D,
      outlineThickness = 0.032,
      castShadow = true,
      receiveShadow = true
    ) => {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = castShadow && !isSoftwareGl;
      mesh.receiveShadow = receiveShadow && !isSoftwareGl;
      group.add(mesh);

      if (outlineThickness > 0) {
        const outline = new THREE.Mesh(geo, outlineMat);
        outline.scale.setScalar(1 + outlineThickness);
        group.add(outline);
      }
      parent.add(group);
      return group;
    };

    // Soft radial contact shadow texture for grounding characters and props
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const grad = shadowCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
      grad.addColorStop(0, 'rgba(42, 24, 28, 0.46)');
      grad.addColorStop(0.55, 'rgba(42, 24, 28, 0.20)');
      grad.addColorStop(1, 'rgba(42, 24, 28, 0)');
      shadowCtx.fillStyle = grad;
      shadowCtx.fillRect(0, 0, 128, 128);
    }
    const contactShadowTex = new THREE.CanvasTexture(shadowCanvas);

    const addContactShadow = (
      parent: THREE.Object3D,
      x: number,
      y: number,
      z: number,
      radiusX: number,
      radiusZ: number,
      opacity = 0.78
    ) => {
      const mat = new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        opacity,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(radiusX * 2, radiusZ * 2), mat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(x, y, z);
      parent.add(plane);
      return plane;
    };

    // --- SHARED MATERIALS ---
    const matMisoCream = new THREE.MeshStandardMaterial({
      color: 0xfff5e4,
      roughness: 0.58,
      metalness: 0.02,
    });
    const matMisoEarPink = new THREE.MeshStandardMaterial({
      color: 0xffa5b8,
      roughness: 0.55,
    });
    const matScarfGold = new THREE.MeshStandardMaterial({
      color: 0xffbe3b,
      roughness: 0.65,
    });
    const matPlumLavender = new THREE.MeshStandardMaterial({
      color: 0xd9a1f7,
      roughness: 0.56,
      metalness: 0.02,
    });
    const matBerryRed = new THREE.MeshStandardMaterial({
      color: 0xf25252,
      roughness: 0.45,
    });
    const matBlueberry = new THREE.MeshStandardMaterial({
      color: 0x4f64c4,
      roughness: 0.38,
      metalness: 0.08,
    });
    const matPipGold = new THREE.MeshStandardMaterial({
      color: 0xffd23f,
      roughness: 0.36,
      emissive: 0xffa600,
      emissiveIntensity: 0.22,
    });
    const matSproutBody = new THREE.MeshStandardMaterial({
      color: 0xfff0c2,
      roughness: 0.55,
    });
    const matSproutShell = new THREE.MeshStandardMaterial({
      color: 0x8cc952,
      roughness: 0.5,
    });
    const matSproutSpiral = new THREE.MeshStandardMaterial({
      color: 0x5c9433,
      roughness: 0.55,
    });
    const matDarkInk = new THREE.MeshStandardMaterial({
      color: 0x3b2219,
      roughness: 0.3,
    });
    const matBlush = new THREE.MeshBasicMaterial({
      color: 0xff859d,
      transparent: true,
      opacity: 0.8,
    });
    const matWoodTable = new THREE.MeshStandardMaterial({
      color: 0xf49342,
      roughness: 0.5,
      metalness: 0.05,
    });
    const matBunWarm = new THREE.MeshStandardMaterial({
      color: 0xffb84d,
      roughness: 0.42,
    });
    const matBunTop = new THREE.MeshStandardMaterial({
      color: 0xe68325,
      roughness: 0.38,
    });
    const matGoldFrame = new THREE.MeshStandardMaterial({
      color: 0xffb72b,
      roughness: 0.32,
      metalness: 0.22,
      emissive: 0xff9900,
      emissiveIntensity: 0.14,
    });
    const matLeafGreen = new THREE.MeshStandardMaterial({
      color: 0x6ec25a,
      roughness: 0.62,
    });
    const matPineDark = new THREE.MeshStandardMaterial({
      color: 0x3c8d5a,
      roughness: 0.65,
    });
    const matPineLight = new THREE.MeshStandardMaterial({
      color: 0x5eb56e,
      roughness: 0.62,
    });
    const matIslandGrass = new THREE.MeshStandardMaterial({
      color: 0x68b85e,
      roughness: 0.78,
    });
    const matIslandSoil = new THREE.MeshStandardMaterial({
      color: 0x8c583a,
      roughness: 0.85,
    });
    const matRibbonBlue = new THREE.MeshStandardMaterial({
      color: 0x8cc8f8,
      roughness: 0.48,
    });
    const matHeartCoral = new THREE.MeshStandardMaterial({
      color: 0xff5c77,
      roughness: 0.35,
      emissive: 0xff3b5c,
      emissiveIntensity: 0.25,
    });

    // --- MAIN DIORAMA GROUP ---
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Interactive click targets registry
    const interactiveTargets: Array<{ mesh: THREE.Object3D; presetId: CameraPresetId }> = [];
    const registerInteractive = (root: THREE.Object3D, presetId: CameraPresetId) => {
      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          interactiveTargets.push({ mesh: child, presetId });
        }
      });
    };

    // 1. FLOATING STORYBOOK ISLAND BASE
    const islandGroup = new THREE.Group();
    worldGroup.add(islandGroup);

    const grassTopGeo = new THREE.CylinderGeometry(4.75, 4.95, 0.56, 48);
    addToonMesh(grassTopGeo, matIslandGrass, islandGroup, 0.015, false, true).position.y = -0.98;

    const soilBaseGeo = new THREE.CylinderGeometry(4.65, 3.35, 1.15, 40);
    addToonMesh(soilBaseGeo, matIslandSoil, islandGroup, 0.018, false, true).position.y = -1.72;

    // 2. COZY RED-AND-CREAM GINGHAM PICNIC BLANKET
    const ginghamCanvas = document.createElement('canvas');
    ginghamCanvas.width = 512;
    ginghamCanvas.height = 512;
    const gCtx = ginghamCanvas.getContext('2d');
    if (gCtx) {
      const cells = 8;
      const step = 512 / cells;
      for (let r = 0; r < cells; r++) {
        for (let c = 0; c < cells; c++) {
          const isEvenR = r % 2 === 0;
          const isEvenC = c % 2 === 0;
          if (isEvenR && isEvenC) {
            gCtx.fillStyle = '#FFF5E8';
          } else if (!isEvenR && !isEvenC) {
            gCtx.fillStyle = '#E85D75';
          } else {
            gCtx.fillStyle = '#F7A1B2';
          }
          gCtx.fillRect(c * step, r * step, step, step);
        }
      }
      gCtx.strokeStyle = 'rgba(180, 50, 75, 0.16)';
      gCtx.lineWidth = 2;
      for (let i = 0; i <= 512; i += 16) {
        gCtx.beginPath();
        gCtx.moveTo(i, 0);
        gCtx.lineTo(i, 512);
        gCtx.stroke();
        gCtx.beginPath();
        gCtx.moveTo(0, i);
        gCtx.lineTo(512, i);
        gCtx.stroke();
      }
    }
    const ginghamTex = new THREE.CanvasTexture(ginghamCanvas);
    ginghamTex.wrapS = THREE.RepeatWrapping;
    ginghamTex.wrapT = THREE.RepeatWrapping;
    ginghamTex.repeat.set(2.2, 1.8);
    ginghamTex.colorSpace = THREE.SRGBColorSpace;

    const matBlanket = new THREE.MeshStandardMaterial({
      map: ginghamTex,
      roughness: 0.72,
    });

    const blanketGeo = new THREE.CylinderGeometry(3.85, 3.95, 0.14, 48);
    const blanketMesh = addToonMesh(blanketGeo, matBlanket, islandGroup, 0.015, true, true);
    blanketMesh.scale.set(1.06, 1, 0.84);
    blanketMesh.position.set(0, -0.66, 0.35);

    const floorY = -0.58;

    // 3. STORYBOOK FOREST PINE & BLOSSOM TREES AROUND BACK PERIMETER
    const createStorybookTree = (
      x: number,
      z: number,
      scale: number,
      isBlossom = false
    ) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, floorY - 0.1, z);
      treeGroup.scale.setScalar(scale);

      addContactShadow(worldGroup, x, floorY - 0.1, z, 0.65 * scale, 0.65 * scale, 0.55);

      const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 0.85, 12);
      addToonMesh(trunkGeo, matIslandSoil, treeGroup, 0.04).position.y = 0.38;

      if (isBlossom) {
        // Rounded pastel sakura/evening puff foliage
        const puffPositions: [number, number, number, number][] = [
          [0, 1.15, 0, 0.62],
          [-0.36, 0.98, 0.18, 0.44],
          [0.38, 1.0, -0.12, 0.46],
          [0, 1.52, -0.05, 0.45],
        ];
        const blossomMat = new THREE.MeshStandardMaterial({
          color: 0xffa6c1,
          roughness: 0.6,
        });
        puffPositions.forEach(([px, py, pz, r]) => {
          const puffGeo = new THREE.SphereGeometry(r, 18, 16);
          addToonMesh(puffGeo, blossomMat, treeGroup, 0.035).position.set(px, py, pz);
        });
      } else {
        // Tiered storybook pine cones
        const tier1 = new THREE.ConeGeometry(0.82, 1.05, 16);
        addToonMesh(tier1, matPineDark, treeGroup, 0.032).position.y = 1.02;
        const tier2 = new THREE.ConeGeometry(0.66, 0.92, 16);
        addToonMesh(tier2, matPineLight, treeGroup, 0.032).position.y = 1.56;
        const tier3 = new THREE.ConeGeometry(0.46, 0.75, 16);
        addToonMesh(tier3, matLeafGreen, treeGroup, 0.035).position.y = 2.04;
      }

      worldGroup.add(treeGroup);
      return treeGroup;
    };

    createStorybookTree(-3.45, -2.15, 1.05, false);
    createStorybookTree(-2.35, -2.95, 0.86, true);
    createStorybookTree(-0.85, -3.25, 0.92, false);
    createStorybookTree(3.55, -1.95, 0.98, false);
    createStorybookTree(2.85, -2.85, 0.78, true);

    // 4. CRESCENT MOON WINDOW BACKDROP (Matching the Book Cover!)
    const windowGroup = new THREE.Group();
    windowGroup.position.set(1.85, 1.25, -1.65);
    windowGroup.rotation.y = -0.22;
    worldGroup.add(windowGroup);

    const outerRingGeo = new THREE.TorusGeometry(1.48, 0.14, 20, 48);
    addToonMesh(outerRingGeo, matGoldFrame, windowGroup, 0.035);

    const nightSkyMat = new THREE.MeshBasicMaterial({ color: 0x1e3566 });
    const skyDiscGeo = new THREE.CircleGeometry(1.4, 40);
    const skyDisc = new THREE.Mesh(skyDiscGeo, nightSkyMat);
    skyDisc.position.z = -0.06;
    windowGroup.add(skyDisc);

    // Lush green bush visible inside the bottom-right of the crescent window (just like the book cover!)
    const windowBushGroup = new THREE.Group();
    windowBushGroup.position.set(0.42, -0.68, -0.02);
    windowGroup.add(windowBushGroup);
    [
      [0, 0, 0, 0.42],
      [-0.35, -0.15, 0.02, 0.32],
      [0.32, 0.12, 0.02, 0.34],
    ].forEach(([bx, by, bz, br]) => {
      const bGeo = new THREE.SphereGeometry(br, 16, 14);
      bGeo.scale(1, 0.85, 0.35);
      addToonMesh(bGeo, matLeafGreen, windowBushGroup, 0.03);
      windowBushGroup.children[windowBushGroup.children.length - 1].position.set(bx, by, bz);
    });

    // Window crossbars
    const barHorizGeo = new THREE.CylinderGeometry(0.055, 0.055, 2.75, 12);
    const barHoriz = addToonMesh(barHorizGeo, matGoldFrame, windowGroup, 0.035);
    barHoriz.rotation.z = Math.PI / 2;
    barHoriz.position.set(0, -0.12, 0.02);

    const barVertGeo = new THREE.CylinderGeometry(0.055, 0.055, 2.75, 12);
    const barVert = addToonMesh(barVertGeo, matGoldFrame, windowGroup, 0.035);
    barVert.position.set(0.18, 0, 0.02);

    // Sculpted Golden Crescent inside the window
    const moonCrescentGroup = new THREE.Group();
    moonCrescentGroup.position.set(-0.35, 0.25, 0.05);
    windowGroup.add(moonCrescentGroup);

    const crescentCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.48, 0.72, 0),
      new THREE.Vector3(-0.18, 0.48, 0),
      new THREE.Vector3(-0.42, 0.0, 0),
      new THREE.Vector3(-0.18, -0.48, 0),
      new THREE.Vector3(0.48, -0.72, 0),
    ]);
    const crescentGeo = new THREE.TubeGeometry(crescentCurve, 28, 0.18, 14, false);
    addToonMesh(crescentGeo, matPipGold, moonCrescentGroup, 0.035);

    // Hanging small crescent moon inside upper-right pane of the window
    const miniMoonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.16, 0.22, 0),
      new THREE.Vector3(-0.06, 0.12, 0),
      new THREE.Vector3(-0.12, 0.0, 0),
      new THREE.Vector3(-0.06, -0.12, 0),
      new THREE.Vector3(0.16, -0.22, 0),
    ]);
    const miniMoonGeo = new THREE.TubeGeometry(miniMoonCurve, 16, 0.065, 10, false);
    const miniMoonMesh = addToonMesh(miniMoonGeo, matPipGold, windowGroup, 0.04);
    miniMoonMesh.position.set(0.62, 0.48, 0.04);

    registerInteractive(windowGroup, 'window');

    // 5. PAPER MOON & STAR BUNTING GARLAND (Upper-Left Signature Detail from the Book Cover!)
    const garlandGroup = new THREE.Group();
    garlandGroup.position.set(-1.95, 2.05, -0.85);
    garlandGroup.rotation.y = 0.22;
    worldGroup.add(garlandGroup);

    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.35, 0.32, 0),
      new THREE.Vector3(-0.65, 0.05, 0.08),
      new THREE.Vector3(0.0, -0.06, 0.12),
      new THREE.Vector3(0.65, 0.06, 0.08),
      new THREE.Vector3(1.35, 0.35, 0),
    ]);
    const cordGeo = new THREE.TubeGeometry(cordCurve, 32, 0.022, 8, false);
    addToonMesh(cordGeo, matDarkInk, garlandGroup, 0);

    // Cute bows at both ends of the garland string
    [-1.35, 1.35].forEach((endX, idx) => {
      const bowEnd = new THREE.Group();
      bowEnd.position.set(endX, idx === 0 ? 0.32 : 0.35, 0);
      garlandGroup.add(bowEnd);
      const loopGeo = new THREE.TorusGeometry(0.09, 0.025, 8, 16);
      const leftL = new THREE.Mesh(loopGeo, matDarkInk);
      leftL.position.set(-0.08, 0.02, 0);
      leftL.rotation.z = 0.4;
      const rightL = new THREE.Mesh(loopGeo, matDarkInk);
      rightL.position.set(0.08, 0.02, 0);
      rightL.rotation.z = -0.4;
      bowEnd.add(leftL, rightL);
    });

    // 3 dangling golden paper crescent moons along the garland cord
    const paperMoonPendulums: THREE.Group[] = [];
    const moonHangCoords: [number, number, number][] = [
      [-0.78, 0.08, 0.92],
      [0.0, -0.05, 1.05],
      [0.78, 0.09, 0.88],
    ];
    moonHangCoords.forEach(([hx, hy, scale]) => {
      const pendulum = new THREE.Group();
      pendulum.position.set(hx, hy, 0.1);
      garlandGroup.add(pendulum);

      const stringGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6);
      const strMesh = new THREE.Mesh(stringGeo, matDarkInk);
      strMesh.position.y = -0.14;
      pendulum.add(strMesh);

      const pCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.14 * scale, -0.16 * scale, 0),
        new THREE.Vector3(-0.08 * scale, -0.24 * scale, 0),
        new THREE.Vector3(-0.14 * scale, -0.38 * scale, 0),
        new THREE.Vector3(-0.04 * scale, -0.52 * scale, 0),
        new THREE.Vector3(0.18 * scale, -0.48 * scale, 0),
      ]);
      const pMoonGeo = new THREE.TubeGeometry(pCurve, 18, 0.072 * scale, 12, false);
      addToonMesh(pMoonGeo, matPipGold, pendulum, 0.045);
      paperMoonPendulums.push(pendulum);
    });

    // 6. LOW ROUND WOODEN PICNIC TABLE & COZY FEAST
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, floorY + 0.23, 0.88);
    worldGroup.add(tableGroup);

    addContactShadow(worldGroup, 0, floorY + 0.015, 0.88, 1.38, 1.05, 0.85);

    const tableTopGeo = new THREE.CylinderGeometry(1.24, 1.24, 0.14, 36);
    const tableTop = addToonMesh(tableTopGeo, matWoodTable, tableGroup, 0.03);
    tableTop.scale.set(1.12, 1, 0.86);
    tableTop.position.y = 0.18;

    const legPositions = [
      [-0.86, 0, 0.46],
      [0.86, 0, 0.46],
      [-0.86, 0, -0.46],
      [0.86, 0, -0.46],
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.34, 14);
      const leg = addToonMesh(legGeo, matWoodTable, tableGroup, 0.04);
      leg.position.set(lx, ly, lz);
    });

    // Polka-dot Ceramic Berry Bowl (Left of Table)
    const bowlGroup = new THREE.Group();
    bowlGroup.position.set(-0.42, 0.26, 0.06);
    tableGroup.add(bowlGroup);

    const bowlCanvas = document.createElement('canvas');
    bowlCanvas.width = 256;
    bowlCanvas.height = 128;
    const bCtx = bowlCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#FFF9EC';
      bCtx.fillRect(0, 0, 256, 128);
      bCtx.fillStyle = '#FF7E95';
      for (let x = 20; x < 256; x += 42) {
        for (let y = 28; y < 110; y += 38) {
          bCtx.beginPath();
          bCtx.arc(x + ((y % 2) * 16), y, 8, 0, Math.PI * 2);
          bCtx.fill();
        }
      }
    }
    const bowlTex = new THREE.CanvasTexture(bowlCanvas);
    bowlTex.colorSpace = THREE.SRGBColorSpace;
    const matBowl = new THREE.MeshStandardMaterial({ map: bowlTex, roughness: 0.32 });

    const bowlGeo = new THREE.SphereGeometry(0.4, 24, 16, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55);
    const bowlMesh = addToonMesh(bowlGeo, matBowl, bowlGroup, 0.038);
    bowlMesh.position.y = 0.24;

    // Strawberries AND Blueberries inside the bowl (matching the book cover!)
    const strawberryOffsets: [number, number, number][] = [
      [-0.12, 0.24, 0.04],
      [0.06, 0.28, -0.06],
      [-0.02, 0.33, 0.02],
    ];
    strawberryOffsets.forEach(([bx, by, bz]) => {
      const sGeo = new THREE.ConeGeometry(0.115, 0.2, 12);
      const sMesh = addToonMesh(sGeo, matBerryRed, bowlGroup, 0.04);
      sMesh.position.set(bx, by, bz);
      sMesh.rotation.set(bx * 1.4, 0, -bz * 1.4);

      // Tiny green calyx leaf on each strawberry
      const leafCap = new THREE.ConeGeometry(0.065, 0.04, 6);
      const capMesh = new THREE.Mesh(leafCap, matLeafGreen);
      capMesh.position.set(bx, by + 0.08, bz);
      bowlGroup.add(capMesh);
    });

    const blueberryOffsets: [number, number, number][] = [
      [0.14, 0.24, 0.1],
      [-0.14, 0.23, -0.11],
      [0.02, 0.23, 0.16],
      [0.16, 0.22, -0.08],
    ];
    blueberryOffsets.forEach(([bx, by, bz]) => {
      const bbGeo = new THREE.SphereGeometry(0.095, 14, 14);
      const bbMesh = addToonMesh(bbGeo, matBlueberry, bowlGroup, 0.04);
      bbMesh.position.set(bx, by, bz);
    });

    // Plate of Golden Steamed Honey Buns (Right of Table)
    const plateGroup = new THREE.Group();
    plateGroup.position.set(0.46, 0.26, 0.06);
    tableGroup.add(plateGroup);

    const plateMat = new THREE.MeshStandardMaterial({ color: 0xfffdf7, roughness: 0.28 });
    const plateGeo = new THREE.CylinderGeometry(0.44, 0.36, 0.06, 24);
    addToonMesh(plateGeo, plateMat, plateGroup, 0.035);

    const createHoneyBun = (parent: THREE.Object3D, x: number, y: number, z: number, scale = 1) => {
      const bunGroup = new THREE.Group();
      bunGroup.position.set(x, y, z);
      bunGroup.scale.setScalar(scale);
      parent.add(bunGroup);

      const bunGeo = new THREE.SphereGeometry(0.24, 20, 16);
      bunGeo.scale(1.18, 0.78, 1.18);
      addToonMesh(bunGeo, matBunWarm, bunGroup, 0.04);

      const glazeGeo = new THREE.SphereGeometry(0.17, 16, 12);
      glazeGeo.scale(1.12, 0.42, 1.12);
      const glaze = new THREE.Mesh(glazeGeo, matBunTop);
      glaze.position.y = 0.11;
      bunGroup.add(glaze);
      return bunGroup;
    };

    createHoneyBun(plateGroup, 0, 0.14, 0, 1.05);

    // Cozy Blossom Teacup on the Picnic Blanket near Sprout
    const teacupGroup = new THREE.Group();
    teacupGroup.position.set(1.22, floorY + 0.16, 1.56);
    worldGroup.add(teacupGroup);

    const cupGeo = new THREE.CylinderGeometry(0.2, 0.16, 0.3, 20);
    addToonMesh(cupGeo, plateMat, teacupGroup, 0.04);

    // Pink blossom emblem on the front of the teacup
    const cupFlowerGeo = new THREE.CircleGeometry(0.065, 12);
    const cupFlower = new THREE.Mesh(cupFlowerGeo, matBlush);
    cupFlower.position.set(0, 0.0, 0.185);
    teacupGroup.add(cupFlower);

    const teaLiquidMat = new THREE.MeshStandardMaterial({ color: 0xd9822b, roughness: 0.18 });
    const teaGeo = new THREE.CircleGeometry(0.17, 16);
    const teaMesh = new THREE.Mesh(teaGeo, teaLiquidMat);
    teaMesh.rotation.x = -Math.PI / 2;
    teaMesh.position.y = 0.142;
    teacupGroup.add(teaMesh);

    // 7. CHARACTER 1: MISO THE CREAM KITTEN (Left of Table, Sharing a Warm Bun)
    const misoBaseY = floorY + 0.68;
    const misoGroup = new THREE.Group();
    misoGroup.position.set(-1.32, misoBaseY, 0.18);
    misoGroup.rotation.y = 0.42;
    worldGroup.add(misoGroup);

    addContactShadow(worldGroup, -1.32, floorY + 0.015, 0.18, 0.92, 0.85, 0.82);

    const misoBodyGeo = new THREE.SphereGeometry(0.68, 28, 24);
    misoBodyGeo.scale(0.96, 1.06, 0.9);
    addToonMesh(misoBodyGeo, matMisoCream, misoGroup, 0.032);

    const misoFootGeo = new THREE.SphereGeometry(0.22, 16, 16);
    misoFootGeo.scale(1.1, 0.72, 1.3);
    const misoFootL = addToonMesh(misoFootGeo, matMisoCream, misoGroup, 0.038);
    misoFootL.position.set(-0.34, -0.5, 0.45);
    const misoFootR = addToonMesh(misoFootGeo, matMisoCream, misoGroup, 0.038);
    misoFootR.position.set(0.34, -0.5, 0.45);

    const misoHeadGroup = new THREE.Group();
    misoHeadGroup.position.set(0, 0.86, 0.05);
    misoGroup.add(misoHeadGroup);

    const misoHeadGeo = new THREE.SphereGeometry(0.76, 32, 28);
    misoHeadGeo.scale(1.16, 0.96, 1.0);
    addToonMesh(misoHeadGeo, matMisoCream, misoHeadGroup, 0.03);

    // Cat Ears
    const earGeo = new THREE.ConeGeometry(0.32, 0.52, 16);
    const earInnerGeo = new THREE.ConeGeometry(0.18, 0.34, 12);

    const earLGroup = new THREE.Group();
    earLGroup.position.set(-0.56, 0.62, 0);
    earLGroup.rotation.z = 0.38;
    addToonMesh(earGeo, matMisoCream, earLGroup, 0.038);
    const earLInner = new THREE.Mesh(earInnerGeo, matMisoEarPink);
    earLInner.position.set(0, -0.02, 0.14);
    earLGroup.add(earLInner);
    misoHeadGroup.add(earLGroup);

    const earRGroup = new THREE.Group();
    earRGroup.position.set(0.56, 0.62, 0);
    earRGroup.rotation.z = -0.38;
    addToonMesh(earGeo, matMisoCream, earRGroup, 0.038);
    const earRInner = new THREE.Mesh(earInnerGeo, matMisoEarPink);
    earRInner.position.set(0, -0.02, 0.14);
    earRGroup.add(earRInner);
    misoHeadGroup.add(earRGroup);

    // Pastel Blue Bow on Miso's Left Ear
    const bowGroup = new THREE.Group();
    bowGroup.position.set(-0.38, 0.68, 0.34);
    bowGroup.rotation.set(0.15, 0.2, 0.32);
    misoHeadGroup.add(bowGroup);

    const bowCenterGeo = new THREE.SphereGeometry(0.1, 14, 14);
    addToonMesh(bowCenterGeo, matRibbonBlue, bowGroup, 0.045);

    const bowWingGeo = new THREE.ConeGeometry(0.18, 0.32, 14);
    bowWingGeo.scale(1, 1, 0.52);
    const bowWingL = addToonMesh(bowWingGeo, matRibbonBlue, bowGroup, 0.045);
    bowWingL.rotation.z = -Math.PI / 2;
    bowWingL.position.x = -0.18;
    const bowWingR = addToonMesh(bowWingGeo, matRibbonBlue, bowGroup, 0.045);
    bowWingR.rotation.z = Math.PI / 2;
    bowWingR.position.x = 0.18;

    // Miso Face (Eyes, Blush, W-Smile)
    const eyeGeo = new THREE.SphereGeometry(0.068, 16, 16);
    const eyeHighlightGeo = new THREE.SphereGeometry(0.024, 10, 10);
    const matEyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const misoEyeL = new THREE.Mesh(eyeGeo, matDarkInk);
    misoEyeL.position.set(-0.31, 0.02, 0.73);
    const misoHlL = new THREE.Mesh(eyeHighlightGeo, matEyeWhite);
    misoHlL.position.set(-0.29, 0.05, 0.785);

    const misoEyeR = new THREE.Mesh(eyeGeo, matDarkInk);
    misoEyeR.position.set(0.31, 0.02, 0.73);
    const misoHlR = new THREE.Mesh(eyeHighlightGeo, matEyeWhite);
    misoHlR.position.set(0.33, 0.05, 0.785);
    misoHeadGroup.add(misoEyeL, misoHlL, misoEyeR, misoHlR);

    const cheekGeo = new THREE.CircleGeometry(0.115, 16);
    const misoCheekL = new THREE.Mesh(cheekGeo, matBlush);
    misoCheekL.position.set(-0.48, -0.1, 0.69);
    misoCheekL.rotation.y = -0.35;
    const misoCheekR = new THREE.Mesh(cheekGeo, matBlush);
    misoCheekR.position.set(0.48, -0.1, 0.69);
    misoCheekR.rotation.y = 0.35;
    misoHeadGroup.add(misoCheekL, misoCheekR);

    const mouthArcGeo = new THREE.TorusGeometry(0.062, 0.02, 10, 18, Math.PI);
    const mouthL = new THREE.Mesh(mouthArcGeo, matDarkInk);
    mouthL.rotation.x = Math.PI;
    mouthL.position.set(-0.06, -0.05, 0.75);
    const mouthR = new THREE.Mesh(mouthArcGeo, matDarkInk);
    mouthR.rotation.x = Math.PI;
    mouthR.position.set(0.06, -0.05, 0.75);
    misoHeadGroup.add(mouthL, mouthR);

    // Cozy Golden Scarf & Tail
    const scarfGeo = new THREE.TorusGeometry(0.56, 0.16, 18, 36);
    const scarf = addToonMesh(scarfGeo, matScarfGold, misoGroup, 0.035);
    scarf.rotation.x = Math.PI / 2 + 0.08;
    scarf.position.set(0, 0.42, 0.05);

    const scarfTailGeo = new THREE.BoxGeometry(0.24, 0.46, 0.12);
    const scarfTail = addToonMesh(scarfTailGeo, matScarfGold, misoGroup, 0.04);
    scarfTail.position.set(-0.48, 0.2, 0.44);
    scarfTail.rotation.set(0.18, 0.2, 0.32);

    // Miso's Arms Offering a Warm Steamed Bun Toward Plum
    const pawGeo = new THREE.CapsuleGeometry(0.15, 0.38, 12, 16);
    const misoArmL = addToonMesh(pawGeo, matMisoCream, misoGroup, 0.038);
    misoArmL.position.set(0.18, 0.14, 0.56);
    misoArmL.rotation.set(1.15, 0, -0.45);

    const misoArmR = addToonMesh(pawGeo, matMisoCream, misoGroup, 0.038);
    misoArmR.position.set(0.54, 0.18, 0.48);
    misoArmR.rotation.set(1.15, 0, 0.25);

    const sharedBunGroup = createHoneyBun(misoGroup, 0.48, 0.22, 0.76, 0.86);

    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.35, -0.55),
      new THREE.Vector3(-0.35, -0.2, -0.85),
      new THREE.Vector3(-0.55, 0.18, -0.75),
    ]);
    const tailGeo = new THREE.TubeGeometry(tailCurve, 16, 0.12, 12, false);
    addToonMesh(tailGeo, matMisoCream, misoGroup, 0.04);

    registerInteractive(misoGroup, 'miso');

    // 8. CHARACTER 2: PLUM THE LAVENDER LOP-EARED BUNNY (Right of Table)
    // Authentic rounded lavender bunny head + long lop ears + dainty strawberry leaf crown!
    const plumBaseY = floorY + 0.66;
    const plumGroup = new THREE.Group();
    plumGroup.position.set(1.32, plumBaseY, 0.14);
    plumGroup.rotation.y = -0.48;
    worldGroup.add(plumGroup);

    addContactShadow(worldGroup, 1.32, floorY + 0.015, 0.14, 0.9, 0.84, 0.82);

    const plumBodyGeo = new THREE.SphereGeometry(0.65, 28, 24);
    plumBodyGeo.scale(0.95, 1.04, 0.9);
    addToonMesh(plumBodyGeo, matPlumLavender, plumGroup, 0.032);

    const plumFootL = addToonMesh(misoFootGeo, matPlumLavender, plumGroup, 0.038);
    plumFootL.position.set(-0.32, -0.48, 0.44);
    const plumFootR = addToonMesh(misoFootGeo, matPlumLavender, plumGroup, 0.038);
    plumFootR.position.set(0.32, -0.48, 0.44);

    const plumHeadGroup = new THREE.Group();
    plumHeadGroup.position.set(0, 0.82, 0.05);
    plumGroup.add(plumHeadGroup);

    const plumHeadGeo = new THREE.SphereGeometry(0.72, 32, 28);
    plumHeadGeo.scale(1.14, 0.95, 0.98);
    addToonMesh(plumHeadGeo, matPlumLavender, plumHeadGroup, 0.03);

    // Dainty Strawberry-Blossom Leaf Crown perched neatly on top of Plum's head (no oversized helmet!)
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 0.68, 0.04);
    plumHeadGroup.add(crownGroup);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const leafGeo = new THREE.ConeGeometry(0.11, 0.26, 8);
      leafGeo.scale(1, 1, 0.38);
      const leaf = addToonMesh(leafGeo, matLeafGreen, crownGroup, 0.04);
      leaf.position.set(Math.cos(angle) * 0.14, 0.02, Math.sin(angle) * 0.14);
      leaf.rotation.x = Math.PI / 2;
      leaf.rotation.z = -angle - Math.PI / 2;
    }
    const crownBerryGeo = new THREE.SphereGeometry(0.11, 14, 14);
    const crownBerry = addToonMesh(crownBerryGeo, matBerryRed, crownGroup, 0.04);
    crownBerry.position.y = 0.08;

    // Long Floppy Lop Bunny Ears Framing Plum's Face (Just Like the Book Cover!)
    const lopEarGeo = new THREE.CapsuleGeometry(0.21, 0.66, 14, 20);
    lopEarGeo.scale(0.88, 1, 0.5);
    const lopEarL = addToonMesh(lopEarGeo, matPlumLavender, plumHeadGroup, 0.034);
    lopEarL.position.set(-0.74, -0.02, 0.06);
    lopEarL.rotation.set(0.08, 0, -0.34);

    const lopEarR = addToonMesh(lopEarGeo, matPlumLavender, plumHeadGroup, 0.034);
    lopEarR.position.set(0.74, -0.02, 0.06);
    lopEarR.rotation.set(0.08, 0, 0.34);

    // Plum Eyes, Blush, and Smile
    const plumEyeL = new THREE.Mesh(eyeGeo, matDarkInk);
    plumEyeL.position.set(-0.28, -0.02, 0.69);
    const plumHlL = new THREE.Mesh(eyeHighlightGeo, matEyeWhite);
    plumHlL.position.set(-0.26, 0.01, 0.745);

    const plumEyeR = new THREE.Mesh(eyeGeo, matDarkInk);
    plumEyeR.position.set(0.28, -0.02, 0.69);
    const plumHlR = new THREE.Mesh(eyeHighlightGeo, matEyeWhite);
    plumHlR.position.set(0.3, 0.01, 0.745);
    plumHeadGroup.add(plumEyeL, plumHlL, plumEyeR, plumHlR);

    const plumCheekL = new THREE.Mesh(cheekGeo, matBlush);
    plumCheekL.position.set(-0.44, -0.14, 0.65);
    plumCheekL.rotation.y = -0.32;
    const plumCheekR = new THREE.Mesh(cheekGeo, matBlush);
    plumCheekR.position.set(0.44, -0.14, 0.65);
    plumCheekR.rotation.y = 0.32;
    plumHeadGroup.add(plumCheekL, plumCheekR);

    const plumMouthL = new THREE.Mesh(mouthArcGeo, matDarkInk);
    plumMouthL.rotation.x = Math.PI;
    plumMouthL.position.set(-0.055, -0.09, 0.71);
    const plumMouthR = new THREE.Mesh(mouthArcGeo, matDarkInk);
    plumMouthR.rotation.x = Math.PI;
    plumMouthR.position.set(0.055, -0.09, 0.71);
    plumHeadGroup.add(plumMouthL, plumMouthR);

    // Plum's Paws Reaching Happily for the Shared Warm Bun
    const plumArmL = addToonMesh(pawGeo, matPlumLavender, plumGroup, 0.038);
    plumArmL.position.set(-0.42, 0.16, 0.48);
    plumArmL.rotation.set(1.18, 0, -0.32);

    const plumArmR = addToonMesh(pawGeo, matPlumLavender, plumGroup, 0.038);
    plumArmR.position.set(0.24, 0.12, 0.5);
    plumArmR.rotation.set(1.1, 0, 0.38);

    // Fluffy Bunny Cotton Tail
    const bunnyTailGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const bunnyTail = addToonMesh(bunnyTailGeo, matMisoCream, plumGroup, 0.04);
    bunnyTail.position.set(0, -0.36, -0.62);

    registerInteractive(plumGroup, 'plum');

    // 9. SCULPTED 3D FLOATING HEART (♥) BETWEEN MISO & PLUM (Book Cover Centerpiece!)
    const heartGroup = new THREE.Group();
    heartGroup.position.set(0.02, floorY + 1.56, 0.35);
    worldGroup.add(heartGroup);

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.18);
    heartShape.bezierCurveTo(0, -0.18, -0.26, 0.02, -0.26, 0.16);
    heartShape.bezierCurveTo(-0.26, 0.29, -0.08, 0.32, 0, 0.18);
    heartShape.bezierCurveTo(0.08, 0.32, 0.26, 0.29, 0.26, 0.16);
    heartShape.bezierCurveTo(0.26, 0.02, 0, -0.18, 0, -0.18);

    const heartExtrudeGeo = new THREE.ExtrudeGeometry(heartShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.045,
      bevelThickness: 0.045,
    });
    heartExtrudeGeo.center();
    addToonMesh(heartExtrudeGeo, matHeartCoral, heartGroup, 0.06, false, false);

    // 10. CHARACTER 3: PIP THE CHUBBY GOLDEN STAR (Front-Left of Blanket)
    const pipBaseY = floorY + 0.60;
    const pipGroup = new THREE.Group();
    pipGroup.position.set(-2.18, pipBaseY, 1.32);
    pipGroup.rotation.y = 0.48;
    worldGroup.add(pipGroup);

    addContactShadow(worldGroup, -2.18, floorY + 0.015, 1.32, 0.58, 0.52, 0.75);

    const starShape = new THREE.Shape();
    const outerR = 0.56;
    const innerR = 0.32;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const sx = Math.cos(angle) * r;
      const sy = -Math.sin(angle) * r;
      if (i === 0) starShape.moveTo(sx, sy);
      else starShape.lineTo(sx, sy);
    }
    starShape.closePath();

    const starExtrudeGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.12,
    });
    starExtrudeGeo.center();
    starExtrudeGeo.translate(0, 0.08, 0);
    addToonMesh(starExtrudeGeo, matPipGold, pipGroup, 0.038);

    const pipFootGeo = new THREE.SphereGeometry(0.14, 14, 14);
    const pipFootL = addToonMesh(pipFootGeo, matPipGold, pipGroup, 0.045);
    pipFootL.position.set(-0.18, -0.44, 0.22);
    const pipFootR = addToonMesh(pipFootGeo, matPipGold, pipGroup, 0.045);
    pipFootR.position.set(0.18, -0.44, 0.22);

    const pipEyeGeo = new THREE.SphereGeometry(0.048, 12, 12);
    const pipEyeL = new THREE.Mesh(pipEyeGeo, matDarkInk);
    pipEyeL.position.set(-0.14, 0.10, 0.26);
    const pipEyeR = new THREE.Mesh(pipEyeGeo, matDarkInk);
    pipEyeR.position.set(0.14, 0.10, 0.26);
    pipGroup.add(pipEyeL, pipEyeR);

    const pipSmileGeo = new THREE.TorusGeometry(0.048, 0.016, 8, 16, Math.PI);
    const pipSmile = new THREE.Mesh(pipSmileGeo, matDarkInk);
    pipSmile.rotation.x = Math.PI;
    pipSmile.position.set(0, 0.06, 0.26);
    pipGroup.add(pipSmile);

    registerInteractive(pipGroup, 'pip');

    // 11. CHARACTER 4: SPROUT THE FRIENDLY GREEN SNAIL (Front-Right beside Teacup)
    const sproutBaseY = floorY + 0.14;
    const sproutGroup = new THREE.Group();
    sproutGroup.position.set(1.78, sproutBaseY, 1.48);
    sproutGroup.rotation.y = -0.58;
    worldGroup.add(sproutGroup);

    addContactShadow(worldGroup, 1.78, floorY + 0.015, 1.48, 0.56, 0.44, 0.72);

    const snailBodyGeo = new THREE.CapsuleGeometry(0.16, 0.48, 14, 18);
    const snailBody = addToonMesh(snailBodyGeo, matSproutBody, sproutGroup, 0.045);
    snailBody.rotation.z = Math.PI / 2;
    snailBody.position.set(0, 0.05, 0);

    const snailHeadGeo = new THREE.SphereGeometry(0.21, 18, 18);
    const snailHead = addToonMesh(snailHeadGeo, matSproutBody, sproutGroup, 0.045);
    snailHead.position.set(-0.28, 0.18, 0);

    const shellGeo = new THREE.SphereGeometry(0.32, 24, 20);
    shellGeo.scale(1.0, 1.05, 0.76);
    const shell = addToonMesh(shellGeo, matSproutShell, sproutGroup, 0.04);
    shell.position.set(0.14, 0.28, 0);

    const spiralGeo = new THREE.TorusGeometry(0.14, 0.028, 10, 24);
    const spiralL = new THREE.Mesh(spiralGeo, matSproutSpiral);
    spiralL.position.set(0.14, 0.28, 0.25);
    const spiralR = new THREE.Mesh(spiralGeo, matSproutSpiral);
    spiralR.position.set(0.14, 0.28, -0.25);
    sproutGroup.add(spiralL, spiralR);

    [-0.08, 0.08].forEach((zOff) => {
      const stalkGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8);
      const stalk = new THREE.Mesh(stalkGeo, matDarkInk);
      stalk.position.set(-0.34, 0.42, zOff);
      stalk.rotation.z = 0.2;
      const knobGeo = new THREE.SphereGeometry(0.042, 10, 10);
      const knob = addToonMesh(knobGeo, matSproutBody, sproutGroup, 0.05);
      knob.position.set(-0.37, 0.51, zOff);
      sproutGroup.add(stalk);
    });

    const sproutEyeGeo = new THREE.SphereGeometry(0.032, 10, 10);
    const sproutEyeL = new THREE.Mesh(sproutEyeGeo, matDarkInk);
    sproutEyeL.position.set(-0.46, 0.2, 0.08);
    const sproutEyeR = new THREE.Mesh(sproutEyeGeo, matDarkInk);
    sproutEyeR.position.set(-0.46, 0.2, -0.08);
    sproutGroup.add(sproutEyeL, sproutEyeR);

    registerInteractive(sproutGroup, 'sprout');

    // 12. STORYBOOK FLOWERS, LANTERN, AND TOADSTOOL MUSHROOMS AROUND THE CLEARING
    const createFlower = (x: number, z: number, petalColor: number, scale = 1) => {
      const fGroup = new THREE.Group();
      fGroup.position.set(x, floorY + 0.02, z);
      fGroup.scale.setScalar(scale);
      worldGroup.add(fGroup);

      const centerMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.4 });
      const petalMat = new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.5 });

      const cGeo = new THREE.SphereGeometry(0.09, 12, 12);
      addToonMesh(cGeo, centerMat, fGroup, 0.04).position.y = 0.06;

      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const pGeo = new THREE.SphereGeometry(0.09, 12, 12);
        pGeo.scale(1, 0.55, 1);
        const p = addToonMesh(pGeo, petalMat, fGroup, 0.04);
        p.position.set(Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.14);
      }

      const leafGeo = new THREE.ConeGeometry(0.1, 0.24, 8);
      leafGeo.scale(1, 1, 0.4);
      const leaf = addToonMesh(leafGeo, matLeafGreen, fGroup, 0.04);
      leaf.rotation.x = Math.PI / 2;
      leaf.rotation.z = x > 0 ? -0.6 : 0.6;
      leaf.position.set(x > 0 ? 0.18 : -0.18, 0.02, 0);
    };

    createFlower(-3.2, 1.85, 0xff85a1, 1.15);
    createFlower(-2.75, 2.35, 0xffc83d, 0.95);
    createFlower(-3.55, 0.95, 0xc394f7, 1.0);
    createFlower(2.95, 1.95, 0xff85a1, 1.15);
    createFlower(2.45, 2.4, 0xffc83d, 0.95);
    createFlower(3.45, 1.05, 0xc394f7, 1.0);

    // Cozy Toadstool Mushrooms & Glowing Paper Lantern
    const createMushroom = (x: number, z: number, scale = 1) => {
      const mGroup = new THREE.Group();
      mGroup.position.set(x, floorY, z);
      mGroup.scale.setScalar(scale);
      worldGroup.add(mGroup);

      const stemGeo = new THREE.CylinderGeometry(0.11, 0.15, 0.34, 14);
      addToonMesh(stemGeo, matMisoCream, mGroup, 0.04).position.y = 0.16;

      const capGeo = new THREE.SphereGeometry(0.28, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
      addToonMesh(capGeo, matBerryRed, mGroup, 0.04).position.y = 0.26;

      // White spots on mushroom cap
      [
        [0, 0.52, 0.08],
        [-0.14, 0.45, -0.06],
        [0.14, 0.44, -0.05],
      ].forEach(([sx, sy, sz]) => {
        const spotGeo = new THREE.SphereGeometry(0.045, 10, 10);
        const spot = new THREE.Mesh(spotGeo, matMisoCream);
        spot.position.set(sx, sy, sz);
        mGroup.add(spot);
      });
    };

    createMushroom(-3.55, -0.45, 1.05);
    createMushroom(-3.85, -0.05, 0.72);
    createMushroom(3.55, -0.25, 0.92);

    // Glowing Paper Picnic Lantern on the Left Grass
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(-2.95, floorY + 0.02, 0.45);
    worldGroup.add(lanternGroup);

    const lanternBaseGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.08, 16);
    addToonMesh(lanternBaseGeo, matDarkInk, lanternGroup, 0.03).position.y = 0.04;
    const lanternGlobeMat = new THREE.MeshStandardMaterial({
      color: 0xfff2b2,
      emissive: 0xffb72b,
      emissiveIntensity: 0.75,
      roughness: 0.3,
    });
    const lanternGlobeGeo = new THREE.SphereGeometry(0.24, 20, 16);
    lanternGlobeGeo.scale(0.9, 1.15, 0.9);
    addToonMesh(lanternGlobeGeo, lanternGlobeMat, lanternGroup, 0.035).position.y = 0.28;
    const lanternCapGeo = new THREE.ConeGeometry(0.24, 0.16, 16);
    addToonMesh(lanternCapGeo, matDarkInk, lanternGroup, 0.035).position.y = 0.54;

    // 13. DRIFTING GOLDEN FIREFLIES & TWINKLING 3D STARS
    const starsGroup = new THREE.Group();
    scene.add(starsGroup);

    const starOrbGeo = new THREE.OctahedronGeometry(0.11, 0);
    const starPositions: [number, number, number, number][] = [
      [-4.2, 3.2, -2.5, 1.2],
      [-2.8, 3.9, -3.2, 0.9],
      [-1.1, 3.7, -2.8, 1.1],
      [0.4, 4.1, -3.0, 0.85],
      [3.9, 3.5, -2.5, 1.15],
      [-4.6, 1.9, -1.8, 0.8],
      [4.5, 2.1, -1.5, 0.95],
      [-3.5, 2.7, 1.2, 0.75],
      [3.7, 2.9, 1.1, 0.8],
    ];

    starPositions.forEach(([sx, sy, sz, sScale]) => {
      const sMesh = addToonMesh(starOrbGeo, matPipGold, starsGroup, 0.05, false, false);
      sMesh.position.set(sx, sy, sz);
      sMesh.scale.setScalar(sScale);
    });

    // Golden Fireflies Drifting Gently Around the Clearing
    const firefliesGroup = new THREE.Group();
    worldGroup.add(firefliesGroup);
    const fireflyMat = new THREE.MeshBasicMaterial({
      color: 0xffe875,
      transparent: true,
      opacity: 0.92,
    });
    const fireflyGeo = new THREE.SphereGeometry(0.052, 10, 10);
    const fireflySeeds: Array<{
      mesh: THREE.Mesh;
      baseX: number;
      baseY: number;
      baseZ: number;
      phase: number;
      speed: number;
    }> = [];

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const rad = 1.8 + (i % 4) * 0.75;
      const fx = Math.cos(angle) * rad;
      const fz = Math.sin(angle) * rad * 0.82;
      const fy = floorY + 0.45 + (i % 5) * 0.48;
      const m = new THREE.Mesh(fireflyGeo, fireflyMat);
      m.position.set(fx, fy, fz);
      firefliesGroup.add(m);
      fireflySeeds.push({
        mesh: m,
        baseX: fx,
        baseY: fy,
        baseZ: fz,
        phase: i * 1.17,
        speed: 1.1 + (i % 3) * 0.35,
      });
    }

    // Rising Warm Steam Puffs above the Teacup and Honey Buns
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xfffdf8,
      transparent: true,
      opacity: 0.52,
    });
    const steamGeo = new THREE.SphereGeometry(0.068, 12, 12);
    const steamPuffs: Array<{
      mesh: THREE.Mesh;
      originX: number;
      originY: number;
      originZ: number;
      phase: number;
    }> = [];

    const steamOrigins: [number, number, number][] = [
      [1.22, floorY + 0.36, 1.56], // Blossom teacup
      [0.46, floorY + 0.62, 0.94], // Plate of honey buns on table
      [-0.78, floorY + 0.88, 0.72], // Shared warm bun held by Miso
    ];
    steamOrigins.forEach(([ox, oy, oz], sIdx) => {
      for (let p = 0; p < 3; p++) {
        const puff = new THREE.Mesh(steamGeo, steamMat);
        puff.position.set(ox, oy + p * 0.18, oz);
        worldGroup.add(puff);
        steamPuffs.push({
          mesh: puff,
          originX: ox,
          originY: oy,
          originZ: oz,
          phase: sIdx * 1.3 + p * 2.1,
        });
      }
    });

    // --- RAYCAST CLICK INTERACTION FOR CHARACTERS ---
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return; // Ignore drag orbits

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const meshes = interactiveTargets.map((item) => item.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        const found = interactiveTargets.find((item) => item.mesh === hitObj);
        if (found) {
          handleSelectPreset(found.presetId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // --- ANIMATION LOOP ---
    let reqId: number;
    let prevTime = performance.now();
    let elapsed = 0;
    let appliedMoodId: DioramaMoodId = lightingMoodRef.current;

    const animate = (now: number) => {
      reqId = requestAnimationFrame(animate);
      const dt = Math.min((now - prevTime) / 1000, 0.1);
      prevTime = now;
      elapsed += dt;

      // Apply Lighting Mood transitions smoothly if user switched mood
      if (appliedMoodId !== lightingMoodRef.current) {
        appliedMoodId = lightingMoodRef.current;
        const moodCfg = getDioramaLightMood(appliedMoodId);
        paintSkyTexture(appliedMoodId);
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.setHex(moodCfg.fogColor);
        }
        keyLight.color.setHex(moodCfg.keyLightColor);
        keyLight.intensity = moodCfg.keyLightIntensity;
        fillLight.color.setHex(moodCfg.fillLightColor);
        fillLight.intensity = moodCfg.fillLightIntensity;
        moonGlowLight.intensity = moodCfg.moonGlowIntensity;
        fireflyMat.opacity = moodCfg.fireflyOpacity;
      }

      // Decay any joyful hop timers
      for (const k of Object.keys(hopTimersRef.current)) {
        if (hopTimersRef.current[k] > 0) {
          hopTimersRef.current[k] = Math.max(0, hopTimersRef.current[k] - dt * 1.45);
        }
      }

      const misoHop = Math.sin(hopTimersRef.current.miso * Math.PI) * 0.36;
      const plumHop = Math.sin(hopTimersRef.current.plum * Math.PI) * 0.36;
      const pipHop = Math.sin(hopTimersRef.current.pip * Math.PI) * 0.4;
      const sproutHop = Math.sin(hopTimersRef.current.sprout * Math.PI) * 0.24;
      const heartPulse = 1 + Math.sin(hopTimersRef.current.heart * Math.PI) * 0.34;

      // Lively, grounded character breathing, bobbing, ear wiggling & warm bun handoff (never dipping below floorY!)
      misoGroup.position.y = misoBaseY + (1 + Math.sin(elapsed * 2.4)) * 0.5 * 0.045 + misoHop;
      misoHeadGroup.rotation.z = Math.sin(elapsed * 2.1) * 0.085;
      misoHeadGroup.rotation.x = Math.sin(elapsed * 1.7) * 0.045;
      misoHeadGroup.position.y = 0.86 + Math.sin(elapsed * 2.6) * 0.032;
      misoArmR.rotation.x = 1.15 + Math.sin(elapsed * 2.8) * 0.12;
      sharedBunGroup.position.y = 0.22 + Math.sin(elapsed * 2.8) * 0.055;

      plumGroup.position.y = plumBaseY + (1 + Math.cos(elapsed * 2.3)) * 0.5 * 0.045 + plumHop;
      plumHeadGroup.rotation.z = Math.cos(elapsed * 2.0) * 0.085;
      plumHeadGroup.rotation.x = Math.cos(elapsed * 1.6) * 0.045;
      plumHeadGroup.position.y = 0.82 + Math.cos(elapsed * 2.5) * 0.032;
      lopEarL.rotation.z = -0.34 + Math.sin(elapsed * 3.0) * 0.09;
      lopEarR.rotation.z = 0.34 - Math.sin(elapsed * 3.0) * 0.09;
      plumArmL.rotation.x = 1.18 + Math.cos(elapsed * 2.8) * 0.12;

      // Sculpted Floating Heart between Miso & Plum
      heartGroup.position.y =
        floorY + 1.64 + Math.sin(elapsed * 3.1) * 0.14 + (misoHop + plumHop) * 0.4;
      heartGroup.rotation.y = Math.sin(elapsed * 1.9) * 0.42;
      heartGroup.scale.setScalar((1 + Math.sin(elapsed * 3.8) * 0.11) * heartPulse);

      // Pip the Star joyful bounce & tilt (strictly grounded >= pipBaseY above the blanket)
      pipGroup.position.y = pipBaseY + (1 + Math.sin(elapsed * 3.0)) * 0.5 * 0.11 + pipHop;
      pipGroup.rotation.z = Math.sin(elapsed * 2.2) * 0.09;

      // Sprout the Snail cozy glide & nod
      sproutGroup.position.y = sproutBaseY + Math.abs(Math.sin(elapsed * 2.2)) * 0.035 + sproutHop;
      sproutGroup.position.x = 1.78 + Math.sin(elapsed * 1.2) * 0.065;
      sproutGroup.rotation.z = Math.sin(elapsed * 2.0) * 0.05;

      // Swinging paper crescent moons on the garland cord
      paperMoonPendulums.forEach((p, idx) => {
        p.rotation.z = Math.sin(elapsed * 2.1 + idx * 0.9) * 0.14;
      });
      moonCrescentGroup.rotation.z = Math.sin(elapsed * 1.4) * 0.06;

      // Rising warm steam puffs above teacup and buns
      steamPuffs.forEach((sp) => {
        const cycle = ((elapsed * 0.55 + sp.phase) % 1.0);
        sp.mesh.position.y = sp.originY + cycle * 0.62;
        sp.mesh.position.x = sp.originX + Math.sin(elapsed * 2.2 + sp.phase) * 0.06;
        const scale = 0.55 + Math.sin(cycle * Math.PI) * 0.85;
        sp.mesh.scale.setScalar(scale);
      });

      // Twinkling stars
      starsGroup.children.forEach((star, idx) => {
        star.rotation.y = elapsed * 1.1 + idx;
        star.position.y += Math.sin(elapsed * 2.4 + idx) * 0.0014;
      });

      // Drifting golden fireflies
      fireflySeeds.forEach((f) => {
        f.mesh.position.x = f.baseX + Math.sin(elapsed * f.speed + f.phase) * 0.34;
        f.mesh.position.y = f.baseY + Math.cos(elapsed * (f.speed * 1.3) + f.phase) * 0.24;
        f.mesh.position.z = f.baseZ + Math.sin(elapsed * 1.1 + f.phase) * 0.26;
      });

      // Smooth camera preset focus & continuous gentle storybook island sway
      const currentPresetId = activePresetRef.current;
      const preset = CAMERA_PRESETS.find((p) => p.id === currentPresetId) || CAMERA_PRESETS[0];

      if (autoRotateRef.current && currentPresetId === 'overview') {
        const targetSwayY = Math.sin(elapsed * 0.55) * 0.26;
        worldGroup.rotation.y = dampValue(worldGroup.rotation.y, targetSwayY, 3.5, dt);
      } else if (currentPresetId !== 'overview') {
        const subtleSwayY = Math.sin(elapsed * 0.75) * 0.055;
        worldGroup.rotation.y = dampValue(worldGroup.rotation.y, subtleSwayY, 4.5, dt);
        camera.position.x = dampValue(camera.position.x, preset.position[0], 4.5, dt);
        camera.position.y = dampValue(camera.position.y, preset.position[1], 4.5, dt);
        camera.position.z = dampValue(camera.position.z, preset.position[2], 4.5, dt);
      }

      controls.target.x = dampValue(controls.target.x, preset.target[0], 5.5, dt);
      controls.target.y = dampValue(controls.target.y, preset.target[1], 5.5, dt);
      controls.target.z = dampValue(controls.target.z, preset.target[2], 5.5, dt);

      controls.update();
      renderer.render(scene, camera);
    };

    reqId = requestAnimationFrame(animate);
    setIsLoaded(true);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.removeEventListener('start', onStartInteraction);
      cancelAnimationFrame(reqId);
      controls.dispose();
      envTarget.dispose();
      skyTex.dispose();
      contactShadowTex.dispose();
      ginghamTex.dispose();
      bowlTex.dispose();
      renderer.dispose();
    };
  }, [isOpen, embedded, handleSelectPreset]);

  if (!isOpen && !embedded) return null;

  const audioUi = getForestAudioUiState(isAudioPlaying);

  return (
    <div
      className={
        embedded
          ? 'three-diorama-embedded relative w-full h-[580px] sm:h-[660px] rounded-[28px] overflow-hidden border-[3px] border-[#4A251D] shadow-[0_14px_0_#4A251D] bg-[#243B6B]'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6'
      }
      role={embedded ? 'region' : 'dialog'}
      aria-label="3D Moon Picnic Interactive World"
    >
      <div
        className={
          embedded
            ? 'relative w-full h-full flex flex-col justify-between'
            : 'relative w-full max-w-6xl h-[86vh] rounded-[28px] overflow-hidden border-[3px] border-[#4A251D] shadow-[0_14px_0_#4A251D] bg-[#243B6B] flex flex-col justify-between'
        }
      >
        {/* Top Overlay Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-3.5 sm:p-5 pointer-events-none">
          <div className="bg-[#FFFDF8] border-2 border-[#4A251D] rounded-2xl px-4 py-2 shadow-[0_4px_0_#4A251D] pointer-events-auto">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C85A32] block">
              ✦ Interactive 3D Storybook World
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-[#3B2219] leading-tight">
              The Little Moon Picnic · Clearing
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            {/* Ambient Forest Sound Toggle Button */}
            <button
              type="button"
              onClick={handleToggleAudio}
              aria-pressed={isAudioPlaying}
              aria-label={audioUi.ariaLabel}
              style={{
                backgroundColor: isAudioPlaying ? '#FFE066' : '#FFFDF8',
                color: '#3B2219',
              }}
              className="px-3.5 py-2 rounded-full border-2 border-[#4A251D] text-xs sm:text-sm font-extrabold shadow-[0_4px_0_#4A251D] transition-transform active:translate-y-0.5 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              title="Toggle cozy ambient forest breeze & wooden wind chimes"
            >
              <span className="inline-flex items-center justify-center w-4 h-4" aria-hidden="true">
                {isAudioPlaying ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.4]">
                    <path
                      d="M11 5L6 9H2v6h4l5 4V5z"
                      fill="currentColor"
                      strokeLinejoin="round"
                    />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.4]">
                    <path
                      d="M11 5L6 9H2v6h4l5 4V5z"
                      fill="currentColor"
                      strokeLinejoin="round"
                    />
                    <line x1="22" y1="9" x2="16" y2="15" strokeLinecap="round" />
                    <line x1="16" y1="9" x2="22" y2="15" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              <span>{audioUi.buttonLabel}</span>
              <span
                style={{
                  backgroundColor: isAudioPlaying ? '#3B2219' : '#F3E8EE',
                  color: isAudioPlaying ? '#FFE066' : '#5E4352',
                }}
                className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-[#4A251D]/30"
              >
                {audioUi.statusBadge}
              </span>
            </button>

            {!embedded && onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{ backgroundColor: '#FF6B8B', color: '#FFFFFF' }}
                className="px-3.5 py-2 rounded-full hover:bg-[#FF5277] border-2 border-[#4A251D] text-xs sm:text-sm font-extrabold shadow-[0_4px_0_#4A251D] transition-transform active:translate-y-0.5 cursor-pointer whitespace-nowrap"
                aria-label="Close 3D scene"
              >
                ✕ Close
              </button>
            )}
          </div>
        </div>

        {/* 3D WebGL Canvas Mount */}
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        />

        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#243B6B] text-[#FFFDF8] font-bold">
            Preparing Miso &amp; Plum&apos;s Moon Picnic…
          </div>
        )}

        {/* Bottom Camera Tour, Story Caption & Lighting Mood Controls */}
        <div className="relative z-10 p-3 sm:p-4 flex flex-col items-center gap-2 pointer-events-none">
          {/* Interactive Story Caption Banner */}
          <div
            style={{ backgroundColor: 'rgba(255, 253, 248, 0.96)', color: '#3B2219' }}
            className="border-2 border-[#4A251D] rounded-full px-4 py-1 text-xs sm:text-sm font-bold shadow-[0_3px_0_#4A251D] text-center max-w-xl pointer-events-auto"
            role="status"
            aria-live="polite"
          >
            {storyBanner}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pointer-events-auto">
            {/* Character Camera Tour Pills */}
            <div
              style={{ backgroundColor: '#FFFDF8' }}
              className="flex flex-wrap items-center justify-center gap-1.5 border-2 border-[#4A251D] rounded-2xl px-2.5 py-1.5 shadow-[0_4px_0_#4A251D]"
            >
              {CAMERA_PRESETS.map((preset) => {
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    aria-pressed={isActive}
                    style={{
                      backgroundColor: isActive ? '#FFE066' : 'transparent',
                      color: '#3B2219',
                      borderColor: isActive ? '#4A251D' : 'transparent',
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border ${
                      isActive ? 'shadow-sm scale-105' : 'hover:bg-[#F3E8EE]'
                    }`}
                  >
                    <span aria-hidden="true">{preset.badge}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Atmosphere Lighting Mood Switcher */}
            <div
              style={{ backgroundColor: '#FFFDF8' }}
              className="flex items-center gap-1 border-2 border-[#4A251D] rounded-2xl px-2.5 py-1.5 shadow-[0_4px_0_#4A251D]"
              role="group"
              aria-label="3D scene lighting mood"
            >
              {(Object.keys(DIORAMA_LIGHT_MOODS) as DioramaMoodId[]).map((moodKey) => {
                const moodCfg = DIORAMA_LIGHT_MOODS[moodKey];
                const isSelected = lightingMood === moodKey;
                return (
                  <button
                    key={moodKey}
                    type="button"
                    onClick={() => setLightingMood(moodKey)}
                    aria-pressed={isSelected}
                    style={{
                      backgroundColor: isSelected ? '#FFE066' : 'transparent',
                      color: isSelected ? '#3B2219' : '#5E4352',
                      borderColor: isSelected ? '#4A251D' : 'transparent',
                    }}
                    className="px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap border hover:bg-[#F3E8EE]"
                  >
                    {moodCfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
