'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { WorldData, BlockType, BLOCK_COLORS } from '@/lib/minecraft-types';
import { soundManager } from '@/lib/audio-manager';
import { MinecraftButton } from './MinecraftButton';
import { Download, Code, Play, Home, Eye, Sparkles } from 'lucide-react';

interface VoxelWorldViewProps {
  world: WorldData;
  onExit: (updatedWorld: WorldData) => void;
  onOpenUnityCode: () => void;
}

const HOTBAR_BLOCKS: BlockType[] = [
  'grass',
  'dirt',
  'stone',
  'cobblestone',
  'wood',
  'leaves',
  'plank',
  'brick',
  'glass'
];

export const VoxelWorldView: React.FC<VoxelWorldViewProps> = ({
  world,
  onExit,
  onOpenUnityCode
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockType>('grass');
  const [fps, setFps] = useState<number>(60);
  const [playerCoords, setPlayerCoords] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 10, z: 0 });
  const [showDebugF3, setShowDebugF3] = useState<boolean>(true);
  const [pointerLocked, setPointerLocked] = useState<boolean>(false);
  const [flying, setFlying] = useState<boolean>(world.gameMode === 'creative');
  const [modifiedCount, setModifiedCount] = useState<number>(0);
  const [meshGroupCount, setMeshGroupCount] = useState<number>(0);

  // Storage for voxel modifications
  const modifiedBlocksRef = useRef<Record<string, BlockType>>(world.modifiedBlocks || {});
  const worldRef = useRef<WorldData>(world);

  // References for three.js loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Block meshes and voxel lookup
  const voxelDataRef = useRef<Map<string, BlockType>>(new Map());
  const instancedMeshesRef = useRef<Map<BlockType, THREE.InstancedMesh>>(new Map());
  const highlightMeshRef = useRef<THREE.LineSegments | null>(null);

  // Controls state
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mouseLook = useRef<{ yaw: number; pitch: number }>({
    yaw: world.playerYaw || 0,
    pitch: world.playerPitch || 0
  });
  const velocity = useRef<THREE.Vector3>(new THREE.Vector3());

  // Generate voxel map
  const generateWorldVoxels = useCallback(() => {
    const voxels = new Map<string, BlockType>();
    const seedNumber = Math.abs(
      world.seed.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0)
    ) || 12345;

    // Simple pseudo-random Perlin-like 2D noise
    const pseudoPerlin = (x: number, z: number, scale: number, seedOffset: number) => {
      const s = seedNumber + seedOffset;
      const nx = (x + s) * scale;
      const nz = (z + s * 0.7) * scale;
      return (
        (Math.sin(nx) * Math.cos(nz) +
         Math.sin(nx * 1.9 + 1.2) * Math.cos(nz * 2.1 + 0.8) * 0.5 +
         Math.sin(nx * 3.7 + 2.5) * Math.cos(nz * 3.9 + 1.7) * 0.25) / 1.75
      );
    };

    const CHUNK_RADIUS = 28; // -28 to +28 voxels grid around center

    if (world.worldType === 'flat') {
      const layers = world.flatLayers || [
        { block: 'bedrock', count: 1 },
        { block: 'dirt', count: 2 },
        { block: 'grass', count: 1 }
      ];

      for (let x = -CHUNK_RADIUS; x <= CHUNK_RADIUS; x++) {
        for (let z = -CHUNK_RADIUS; z <= CHUNK_RADIUS; z++) {
          let currentY = 0;
          for (let l = 0; l < layers.length; l++) {
            const layer = layers[l];
            for (let c = 0; c < layer.count; c++) {
              voxels.set(`${x},${currentY},${z}`, layer.block);
              currentY++;
            }
          }
        }
      }
    } else {
      // Default procedural world
      for (let x = -CHUNK_RADIUS; x <= CHUNK_RADIUS; x++) {
        for (let z = -CHUNK_RADIUS; z <= CHUNK_RADIUS; z++) {
          const noise = pseudoPerlin(x, z, 0.045, 42);
          const detail = pseudoPerlin(x, z, 0.09, 88) * 0.3;
          const combined = (noise + detail);
          const surfaceY = Math.floor(8 + combined * 7);

          // Bedrock at base
          voxels.set(`${x},0,${z}`, 'bedrock');

          // Deep stone
          for (let y = 1; y < surfaceY - 3; y++) {
            // 3D cave hollows
            const caveVal = Math.sin(x * 0.15 + seedNumber) * Math.cos(y * 0.2) * Math.sin(z * 0.15);
            if (caveVal < 0.65) {
              voxels.set(`${x},${y},${z}`, 'stone');
            }
          }

          // Subsurface dirt
          for (let y = Math.max(1, surfaceY - 3); y < surfaceY; y++) {
            voxels.set(`${x},${y},${z}`, 'dirt');
          }

          // Surface grass or sand
          if (surfaceY <= 4) {
            voxels.set(`${x},${surfaceY},${z}`, 'sand');
            // Water layer
            for (let wy = surfaceY + 1; wy <= 5; wy++) {
              voxels.set(`${x},${wy},${z}`, 'water');
            }
          } else {
            voxels.set(`${x},${surfaceY},${z}`, 'grass');
          }

          // Trees in default world
          if (world.generateStructures && surfaceY > 5) {
            const treeHash = Math.sin(x * 12.9898 + z * 78.233 + seedNumber) * 43758.5453;
            const treeChance = treeHash - Math.floor(treeHash);

            if (treeChance > 0.965 && Math.abs(x) > 3 && Math.abs(z) > 3) {
              const trunkHeight = 4;
              for (let ty = 1; ty <= trunkHeight; ty++) {
                voxels.set(`${x},${surfaceY + ty},${z}`, 'wood');
              }
              const leafBase = surfaceY + trunkHeight;
              for (let ox = -2; ox <= 2; ox++) {
                for (let oz = -2; oz <= 2; oz++) {
                  for (let oy = 0; oy <= 2; oy++) {
                    if (Math.abs(ox) === 2 && Math.abs(oz) === 2 && oy === 2) continue;
                    const lPos = `${x + ox},${leafBase + oy},${z + oz}`;
                    if (!voxels.has(lPos) || voxels.get(lPos) === 'air') {
                      voxels.set(lPos, 'leaves');
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Apply saved player modifications (breaks and placements)
    if (world.modifiedBlocks) {
      Object.entries(world.modifiedBlocks).forEach(([posKey, block]) => {
        if (block === 'air') {
          voxels.delete(posKey);
        } else {
          voxels.set(posKey, block);
        }
      });
    }

    voxelDataRef.current = voxels;
  }, [world]);

  // Build Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(world.worldType === 'flat' ? 0x8ab4f8 : 0x78a7ff);
    scene.fog = new THREE.Fog(scene.background, 25, 48);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 100);
    const startY = world.playerPos ? world.playerPos[1] : (world.worldType === 'flat' ? 5.8 : 14.5);
    camera.position.set(world.playerPos ? world.playerPos[0] : 0, startY, world.playerPos ? world.playerPos[2] : 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false; // voxel style looks sharper without soft shadows
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting (Sunlight + Ambient)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 0.85);
    dirLight.position.set(40, 60, 25);
    scene.add(dirLight);

    // Clouds plane
    const cloudGeo = new THREE.PlaneGeometry(120, 120);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    clouds.position.y = 35;
    clouds.rotation.x = Math.PI / 2;
    scene.add(clouds);

    // Highlight wireframe cube for targeted voxel
    const highlightGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const highlightMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const wireframe = new THREE.LineSegments(new THREE.WireframeGeometry(highlightGeo), highlightMat);
    wireframe.visible = false;
    scene.add(wireframe);
    highlightMeshRef.current = wireframe;

    // Generate voxel data
    generateWorldVoxels();

    // Group blocks by type to create InstancedMeshes
    const blocksByType = new Map<BlockType, THREE.Vector3[]>();
    voxelDataRef.current.forEach((blockType, key) => {
      const [x, y, z] = key.split(',').map(Number);

      // Face culling check: only add block if at least one neighbor is exposed/transparent
      const neighbors = [
        `${x+1},${y},${z}`, `${x-1},${y},${z}`,
        `${x},${y+1},${z}`, `${x},${y-1},${z}`,
        `${x},${y},${z+1}`, `${x},${y},${z-1}`
      ];
      const isExposed = neighbors.some(nKey => {
        const neighborBlock = voxelDataRef.current.get(nKey);
        return !neighborBlock || neighborBlock === 'air' || neighborBlock === 'water' || neighborBlock === 'glass';
      });

      if (isExposed) {
        if (!blocksByType.has(blockType)) {
          blocksByType.set(blockType, []);
        }
        blocksByType.get(blockType)!.push(new THREE.Vector3(x, y, z));
      }
    });

    // Box geometry for blocks
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const dummy = new THREE.Object3D();

    instancedMeshesRef.current.clear();

    blocksByType.forEach((positions, bType) => {
      const colorInfo = BLOCK_COLORS[bType] || { hex: '#777777' };
      const mat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(colorInfo.hex),
        transparent: bType === 'water' || bType === 'glass',
        opacity: bType === 'water' ? 0.75 : (bType === 'glass' ? 0.6 : 1.0)
      });

      const instancedMesh = new THREE.InstancedMesh(boxGeometry, mat, positions.length);
      instancedMesh.userData = { blockType: bType, positions: positions };

      positions.forEach((pos, index) => {
        dummy.position.copy(pos);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(index, dummy.matrix);
      });

      instancedMesh.instanceMatrix.needsUpdate = true;
      scene.add(instancedMesh);
      instancedMeshesRef.current.set(bType, instancedMesh);
    });

    setMeshGroupCount(blocksByType.size);

    // Window resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const currentTime = performance.now();
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // FPS calculation
      frameCount++;
      if (currentTime - fpsTimer >= 500) {
        setFps(Math.round((frameCount * 1000) / (currentTime - fpsTimer)));
        frameCount = 0;
        fpsTimer = currentTime;
      }

      // Update player movement when not paused
      if (!isPaused && camera) {
        const moveSpeed = (flying ? 18.0 : 9.0) * delta;
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), mouseLook.current.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), mouseLook.current.yaw);

        const moveDir = new THREE.Vector3();
        if (keysPressed.current['KeyW']) moveDir.add(forward);
        if (keysPressed.current['KeyS']) moveDir.sub(forward);
        if (keysPressed.current['KeyD']) moveDir.add(right);
        if (keysPressed.current['KeyA']) moveDir.sub(right);

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize().multiplyScalar(moveSpeed);
          camera.position.add(moveDir);
        }

        // Vertical movement
        if (flying) {
          if (keysPressed.current['Space']) camera.position.y += moveSpeed;
          if (keysPressed.current['ShiftLeft']) camera.position.y -= moveSpeed;
        } else {
          // Simple gravity and terrain floor clamp
          const floorVoxelY = world.worldType === 'flat' ? 4.6 : 8.0;
          if (keysPressed.current['Space'] && camera.position.y <= floorVoxelY + 0.1) {
            velocity.current.y = 8.5; // jump
          }
          velocity.current.y -= 22 * delta; // gravity
          camera.position.y += velocity.current.y * delta;
          if (camera.position.y < floorVoxelY) {
            camera.position.y = floorVoxelY;
            velocity.current.y = 0;
          }
        }

        // Keep camera rotation synced
        camera.rotation.order = 'YXZ';
        camera.rotation.y = mouseLook.current.yaw;
        camera.rotation.x = mouseLook.current.pitch;

        // Update player coordinates display
        setPlayerCoords({
          x: Math.round(camera.position.x * 10) / 10,
          y: Math.round(camera.position.y * 10) / 10,
          z: Math.round(camera.position.z * 10) / 10
        });

        // Raycast from camera center to find targeted voxel
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        raycaster.far = 7.0;

        const allInstancedMeshes = Array.from(instancedMeshesRef.current.values());
        const intersects = raycaster.intersectObjects(allInstancedMeshes, false);

        const hit = intersects[0];
        if (hit && typeof hit.instanceId === 'number') {
          const instanceId = hit.instanceId;
          const mesh = hit.object as THREE.InstancedMesh;
          const matrix = new THREE.Matrix4();
          mesh.getMatrixAt(instanceId, matrix);
          const blockPos = new THREE.Vector3().setFromMatrixPosition(matrix);

          if (highlightMeshRef.current) {
            highlightMeshRef.current.position.copy(blockPos);
            highlightMeshRef.current.visible = true;
          }
        } else {
          if (highlightMeshRef.current) {
            highlightMeshRef.current.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      renderer.dispose();
    };
  }, [generateWorldVoxels, isPaused, world, flying]);

  // Pointer lock and keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;

      // Number keys 1-9 for hotbar selection
      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const slot = parseInt(e.code.replace('Digit', ''), 10) - 1;
        if (slot < HOTBAR_BLOCKS.length) {
          setSelectedBlock(HOTBAR_BLOCKS[slot]);
          soundManager.playButtonClick();
        }
      }

      // F3 toggle debug
      if (e.code === 'F3') {
        e.preventDefault();
        setShowDebugF3(prev => !prev);
      }

      // Double space flight toggle in creative
      if (e.code === 'Space' && world.gameMode === 'creative') {
        // Toggle flying
      }

      // Escape menu
      if (e.code === 'Escape') {
        setIsPaused(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === mountRef.current) {
        const sensitivity = 0.0022;
        mouseLook.current.yaw -= e.movementX * sensitivity;
        mouseLook.current.pitch -= e.movementY * sensitivity;
        mouseLook.current.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, mouseLook.current.pitch));
      }
    };

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === mountRef.current;
      setPointerLocked(isLocked);
      if (!isLocked && !isPaused) {
        setIsPaused(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [isPaused, world.gameMode]);

  // Request pointer lock on canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPaused) return;

    if (!pointerLocked && mountRef.current) {
      mountRef.current.requestPointerLock();
      return;
    }

    if (!cameraRef.current) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
    raycaster.far = 7.0;

    const allMeshes = Array.from(instancedMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(allMeshes, false);

    const hit = intersects[0];
    if (hit && typeof hit.instanceId === 'number') {
      const instanceId = hit.instanceId;
      const mesh = hit.object as THREE.InstancedMesh;
      const matrix = new THREE.Matrix4();
      mesh.getMatrixAt(instanceId, matrix);
      const hitBlockPos = new THREE.Vector3().setFromMatrixPosition(matrix);
      const bx = Math.round(hitBlockPos.x);
      const by = Math.round(hitBlockPos.y);
      const bz = Math.round(hitBlockPos.z);
      const key = `${bx},${by},${bz}`;

      // Left click: Break Block
      if (e.button === 0) {
        if (by === 0 && voxelDataRef.current.get(key) === 'bedrock') {
          // Cannot break bedrock
          return;
        }

        soundManager.playBlockBreak();
        voxelDataRef.current.set(key, 'air');
        modifiedBlocksRef.current[key] = 'air';
        setModifiedCount(prev => prev + 1);

        // Hide broken instance
        const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
        mesh.setMatrixAt(instanceId, zeroMatrix);
        mesh.instanceMatrix.needsUpdate = true;
      }
      // Right click: Place Block
      else if (e.button === 2 && hit.face) {
        e.preventDefault();
        const normal = hit.face.normal;
        const placeX = bx + Math.round(normal.x);
        const placeY = by + Math.round(normal.y);
        const placeZ = bz + Math.round(normal.z);
        const placeKey = `${placeX},${placeY},${placeZ}`;

        // Check not colliding with camera position
        const camPos = cameraRef.current.position;
        const distToCam = new THREE.Vector3(placeX, placeY, placeZ).distanceTo(camPos);
        if (distToCam < 0.8) return;

        soundManager.playBlockPlace();
        voxelDataRef.current.set(placeKey, selectedBlock);
        modifiedBlocksRef.current[placeKey] = selectedBlock;
        setModifiedCount(prev => prev + 1);

        // Add a temporary or new mesh for placed block in scene
        const colorInfo = BLOCK_COLORS[selectedBlock];
        const placeGeo = new THREE.BoxGeometry(1, 1, 1);
        const placeMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(colorInfo.hex) });
        const placedMesh = new THREE.Mesh(placeGeo, placeMat);
        placedMesh.position.set(placeX, placeY, placeZ);
        sceneRef.current?.add(placedMesh);
      }
    }
  };

  const handleSaveAndExit = () => {
    soundManager.playButtonClick();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    const updatedWorld: WorldData = {
      ...worldRef.current,
      modifiedBlocks: { ...modifiedBlocksRef.current },
      playerPos: cameraRef.current
        ? [cameraRef.current.position.x, cameraRef.current.position.y, cameraRef.current.position.z]
        : world.playerPos,
      playerYaw: mouseLook.current.yaw,
      playerPitch: mouseLook.current.pitch,
      lastPlayed: Date.now()
    };

    onExit(updatedWorld);
  };

  const handleExportWorldFile = () => {
    soundManager.playButtonClick();
    const dataToExport = {
      ...worldRef.current,
      modifiedBlocks: modifiedBlocksRef.current,
      exportEngine: 'Unity C# Voxel Engine PC',
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${world.folderName}_world_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none font-mono">
      {/* 3D WebGL Canvas Container */}
      <div
        id="voxel-world-canvas-container"
        ref={mountRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
        onContextMenu={(e) => {
          e.preventDefault();
          handleCanvasClick(e);
        }}
      />

      {/* Screen Crosshair '+' */}
      {!isPaused && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative w-4 h-4">
            <div className="absolute top-1/2 left-0 w-4 h-[2px] -translate-y-1/2 bg-white/80 shadow-[0px_0px_2px_#000000]"></div>
            <div className="absolute left-1/2 top-0 h-4 w-[2px] -translate-x-1/2 bg-white/80 shadow-[0px_0px_2px_#000000]"></div>
          </div>
        </div>
      )}

      {/* F3 Minecraft Debug Overlay */}
      {showDebugF3 && !isPaused && (
        <div className="pointer-events-none absolute top-3 left-3 text-xs sm:text-sm text-[#ffffff] text-mc-dark-shadow space-y-1 z-10 bg-black/35 p-2.5 rounded backdrop-blur-[1px]">
          <p className="font-bold text-[#ffff55]">
            Minecraft 1.20.4 (Unity C# Engine Port)
          </p>
          <p>
            {fps} FPS | C: {meshGroupCount} mesh groups | Вокселей изменено: {modifiedCount}
          </p>
          <p>
            XYZ: {playerCoords.x} / {playerCoords.y} / {playerCoords.z}
          </p>
          <p>
            Тип мира: <span className="text-[#55ff55]">{world.worldType === 'flat' ? 'Суперплоский (Flat)' : 'Обычный (Default)'}</span>
          </p>
          <p>
            Сид мира: <span className="text-[#55ffff]">{world.seed}</span>
          </p>
          <p>
            Режим: <span className="capitalize">{world.gameMode}</span> | Полет: {flying ? 'Вкл (Creative)' : 'Выкл'}
          </p>
          <p className="text-[#aaaaaa] text-xs pt-1">
            [F3] Скрыть инфо | [ЛКМ] Сломать блок | [ПКМ] Поставить | [Esc] Пауза / Меню
          </p>
        </div>
      )}

      {/* Top right quick controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <MinecraftButton
          size="sm"
          variant="secondary"
          onClick={() => {
            if (world.gameMode === 'creative') {
              setFlying(!flying);
            }
          }}
          title="Переключить режим полета"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{flying ? 'Полёт: Вкл' : 'Полёт: Выкл'}</span>
        </MinecraftButton>

        <MinecraftButton
          size="sm"
          variant="primary"
          onClick={() => setIsPaused(true)}
        >
          Пауза (Esc)
        </MinecraftButton>
      </div>

      {/* Minecraft Hotbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        {/* Current block label */}
        <div className="bg-black/60 px-3 py-0.5 rounded text-xs text-[#ffffff] text-mc-dark-shadow font-bold">
          {BLOCK_COLORS[selectedBlock]?.nameRu || selectedBlock}
        </div>

        {/* 9 Hotbar Slots */}
        <div className="flex items-center gap-1 bg-[#8f8f8f]/90 p-1 border-2 border-[#373737] shadow-2xl rounded">
          {HOTBAR_BLOCKS.map((bType, index) => {
            const isSelected = selectedBlock === bType;
            const colorInfo = BLOCK_COLORS[bType];
            return (
              <button
                key={bType}
                id={`hotbar-slot-${index + 1}`}
                onClick={() => {
                  setSelectedBlock(bType);
                  soundManager.playButtonClick();
                }}
                className={`
                  relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center mc-slot-bevel transition-transform
                  ${isSelected ? 'border-2 border-white scale-105 bg-[#3a3a3a]' : 'bg-[#505050] hover:bg-[#5e5e5e]'}
                `}
                title={`${colorInfo.nameRu} (клавиша ${index + 1})`}
              >
                {/* Simulated 3D Block Icon */}
                <div
                  className="w-6 h-6 border border-black/40 shadow-sm"
                  style={{
                    backgroundColor: colorInfo.hex,
                    boxShadow: 'inset 2px 2px 0px rgba(255,255,255,0.4), inset -2px -2px 0px rgba(0,0,0,0.5)'
                  }}
                />
                <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white/90 text-mc-dark-shadow">
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Click to Play / Resume Prompt Overlay when not pointer locked */}
      {!pointerLocked && !isPaused && (
        <div
          onClick={() => mountRef.current?.requestPointerLock()}
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-20 cursor-pointer text-center px-4"
        >
          <div className="bg-[#2b1f15] border-2 border-black p-6 shadow-2xl max-w-md w-full mc-card-bevel">
            <h2 className="text-xl sm:text-2xl font-bold text-[#ffffa0] text-mc-shadow mb-3">
              Кликните для управления
            </h2>
            <p className="text-sm text-neutral-300 font-mono mb-4 leading-relaxed">
              Нажмите в любое место, чтобы захватить курсор мыши для вращения камеры и движения (WASD).
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400 text-left bg-black/50 p-3 rounded mb-4">
              <div>• WASD: Движение</div>
              <div>• Пробел: Прыжок / Вверх</div>
              <div>• ЛКМ: Разрушить блок</div>
              <div>• ПКМ: Поставить блок</div>
              <div>• 1-9: Выбор блока</div>
              <div>• Shift: Вниз</div>
            </div>
            <MinecraftButton fullWidth size="lg">
              <Play className="w-4 h-4 fill-current" />
              Вернуться в мир
            </MinecraftButton>
          </div>
        </div>
      )}

      {/* In-game Pause Menu */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-mc-dark-dirt border-4 border-black p-6 sm:p-8 max-w-md w-full mc-card-bevel flex flex-col items-center text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-mc-shadow mb-6">
              Меню игры
            </h2>

            <div className="w-full space-y-3 mb-6">
              <MinecraftButton
                fullWidth
                size="md"
                onClick={() => {
                  setIsPaused(false);
                  mountRef.current?.requestPointerLock();
                }}
              >
                Вернуться к игре
              </MinecraftButton>

              <MinecraftButton
                fullWidth
                size="md"
                variant="secondary"
                onClick={onOpenUnityCode}
              >
                <Code className="w-4 h-4" />
                Архитектура Unity C# (Скрипты)
              </MinecraftButton>

              <MinecraftButton
                fullWidth
                size="md"
                variant="secondary"
                onClick={handleExportWorldFile}
              >
                <Download className="w-4 h-4" />
                Экспорт сохранения (.json)
              </MinecraftButton>

              <MinecraftButton
                fullWidth
                size="md"
                variant="danger"
                onClick={handleSaveAndExit}
              >
                <Home className="w-4 h-4" />
                Сохранить и выйти в меню
              </MinecraftButton>
            </div>

            <div className="text-xs text-neutral-400 font-mono">
              Мир: <span className="text-neutral-200">{world.name}</span> | Сохранение на ПК
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
