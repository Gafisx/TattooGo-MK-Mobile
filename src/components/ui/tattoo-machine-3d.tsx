import { Canvas, useFrame } from '@react-three/fiber/native';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { Component, type ReactNode, Suspense, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import type { OTPState } from '@/components/ui/otp-input';
import {
  getTattooStencilPoints,
  isTattooDigit,
  TATTOO_PATH_OFFSET_Y,
  useTattooPath,
} from '@/hooks/use-tattoo-path';

/**
 * Modelo 3D da máquina de tatuagem (Dark Luxury). O ficheiro `.glb` é carregado
 * pelo Metro através do `require`, resolvido no runtime nativo por `expo-asset`.
 */
const MODEL_SOURCE = require('../../../assets/models/tattoo-machine.glb') as unknown as string;

const CHASSIS_COLOR = '#121212';
const ACCENT_COLOR = '#F97316';
const ERROR_COLOR = '#EF4444';
const SUCCESS_GREEN = '#10B981';
/** Azul de decalque: projeção base (stencil) que a agulha percorre. */
const STENCIL_BLUE = '#3B82F6';

/** Alto-relevo do chassis vs. detalhes/grip: peças com volume >= 50% da maior são chassis. */
const CHASSIS_VOLUME_RATIO = 0.5;
/** Tamanho-alvo (em unidades de cena) do maior eixo da máquina, para enquadrar a câmara. */
const TARGET_SIZE = 1.2;

/** Profundidade do grupo da máquina (por trás do plano de decalque). */
const MACHINE_Z = -0.15;
/** Plano onde o decalque e a tinta (partículas) vivem, à frente da máquina. */
const DRAW_Z = 0.12;

/** Degrau do `useFrame` que impede saltos bruscos quando a app regressa do background. */
const MAX_STEP = 1 / 20;

const PARTICLE_COUNT = 140;
const PARTICLE_SIZE = 0.06;

const INK_RGB: [number, number, number] = [0.169, 0.169, 0.169];
const ORANGE_RGB: [number, number, number] = [0.976, 0.451, 0.086];
const RED_RGB: [number, number, number] = [0.937, 0.267, 0.267];

export interface TattooMachine3DProps {
  /** Estado do fluxo de OTP que dirige a animação e a iluminação. */
  status?: OTPState;
  /** Último dígito digitado; é o traçado que a máquina desenha. */
  currentDigit?: string;
  /** Chave de desenho (ex.: comprimento do código) para re-traçar dígitos repetidos. */
  drawKey?: string | number;
  style?: View['props']['style'];
}

interface StyledModel {
  root: THREE.Object3D;
  scale: number;
  center: THREE.Vector3;
  materials: THREE.MeshStandardMaterial[];
  /** Posição da ponta da agulha no referencial do grupo da máquina. */
  tip: THREE.Vector3;
  /** Distância (positiva) do centro da máquina até à ponta. */
  tipHeight: number;
}

function useStyledModel(): StyledModel {
  const { scene } = useGLTF(MODEL_SOURCE);

  return useMemo(() => {
    const root = scene.clone(true);
    const chassis = new THREE.MeshStandardMaterial({
      color: CHASSIS_COLOR,
      roughness: 0.8,
      metalness: 0.15,
    });
    const detail = new THREE.MeshStandardMaterial({
      color: ACCENT_COLOR,
      roughness: 0.35,
      metalness: 0.5,
    });

    const meshes: { mesh: THREE.Mesh; volume: number }[] = [];
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      const geometry = mesh.geometry as THREE.BufferGeometry;
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      const volume = box
        ? Math.abs(
            (box.max.x - box.min.x) * (box.max.y - box.min.y) * (box.max.z - box.min.z),
          )
        : 0;
      meshes.push({ mesh, volume });
    });

    const maxVolume = meshes.reduce((max, entry) => Math.max(max, entry.volume), 0);
    meshes.forEach(({ mesh, volume }) => {
      const isChassis = maxVolume === 0 || volume >= maxVolume * CHASSIS_VOLUME_RATIO;
      mesh.material = isChassis ? chassis : detail;
    });

    const bounds = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const scale = TARGET_SIZE / maxDimension;

    const halfHeight = (size.y * scale) / 2;
    const tip = new THREE.Vector3(0, -halfHeight, 0);

    return {
      root,
      scale,
      center,
      materials: [chassis, detail],
      tip,
      tipHeight: halfHeight,
    };
  }, [scene]);
}

interface VectorRef {
  current: THREE.Vector3;
}

interface BoolRef {
  current: boolean;
}

interface MachineProps {
  status: OTPState;
  currentDigit?: string;
  drawKey?: string | number;
  tipWorld: VectorRef;
  drawingRef: BoolRef;
}

function Machine({ status, currentDigit, drawKey, tipWorld, drawingRef }: MachineProps) {
  const group = useRef<THREE.Group>(null);
  const { root, scale, center, materials, tip, tipHeight } = useStyledModel();
  const path = useTattooPath(currentDigit, status !== 'error', drawKey);

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;
    const time = state.clock.elapsedTime;
    const step = Math.min(delta, MAX_STEP);
    const trail = path.current;

    drawingRef.current = trail.drawing && status !== 'error';

    // Segue suavemente (lerp/damp) o ponto do traçado, alinhando a ponta da
    // agulha ao decalque em vez do centro da máquina.
    node.position.x = THREE.MathUtils.damp(node.position.x, trail.point.x, 6, step);
    node.position.y = THREE.MathUtils.damp(
      node.position.y,
      trail.point.y + tipHeight,
      6,
      step,
    );
    node.position.z = THREE.MathUtils.damp(node.position.z, MACHINE_Z, 6, step);

    if (status === 'buzzing') {
      node.position.x += Math.sin(time * 50) * 0.03;
      node.position.y += Math.sin(time * 50) * 0.03;
      node.rotation.z = THREE.MathUtils.damp(node.rotation.z, 0, 8, step);
    } else if (status === 'error') {
      // Falha: percurso interrompido abruptamente e tremor forte.
      node.position.x += Math.sin(time * 95) * 0.06;
      node.position.y += Math.cos(time * 110) * 0.05;
      node.rotation.z = Math.sin(time * 80) * 0.07;
    } else if (status === 'success') {
      node.rotation.y += step * 1.8;
      node.rotation.z = THREE.MathUtils.damp(node.rotation.z, 0, 8, step);
    } else {
      node.rotation.z = THREE.MathUtils.damp(node.rotation.z, 0, 8, step);
    }

    node.updateWorldMatrix(true, false);
    tipWorld.current.copy(tip).applyMatrix4(node.matrixWorld);
  });

  return (
    <group ref={group}>
      <group
        scale={scale}
        position={[-center.x * scale, -center.y * scale, -center.z * scale]}>
        <primitive object={root} />
      </group>
    </group>
  );
}

/** Guia azul de decalque (stencil) do dígito atual, à frente da máquina. */
function StencilTrace({ digit }: { digit?: string }) {
  const line = useMemo(() => {
    if (!isTattooDigit(digit)) return null;
    const points = getTattooStencilPoints(digit);
    if (points.length === 0) return null;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: STENCIL_BLUE,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const object = new THREE.Line(geometry, material);
    object.position.z = DRAW_Z;
    object.renderOrder = 2;
    return object;
  }, [digit]);

  useEffect(
    () => () => {
      if (!line) return;
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );

  if (!line) return null;
  return <primitive object={line} />;
}

interface NeedleParticlesProps {
  status: OTPState;
  tipWorld: VectorRef;
  drawingRef: BoolRef;
}

interface ParticleBuffers {
  positions: Float32Array;
  colors: Float32Array;
  velocities: Float32Array;
  life: Float32Array;
  maxLife: Float32Array;
}

/**
 * Emissor de partículas fixado à ponta da agulha. Usa um único `<points>` com
 * buffers dinâmicos e cálculo por tempo (sem física pesada), para manter 120 FPS
 * sem re-renderizações do React.
 */
function NeedleParticles({ status, tipWorld, drawingRef }: NeedleParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const buffersRef = useRef<ParticleBuffers | null>(null);
  const spawnAcc = useRef(0);
  const cursor = useRef(0);

  useEffect(() => {
    const buffers: ParticleBuffers = {
      positions: new Float32Array(PARTICLE_COUNT * 3),
      colors: new Float32Array(PARTICLE_COUNT * 4),
      velocities: new Float32Array(PARTICLE_COUNT * 3),
      life: new Float32Array(PARTICLE_COUNT),
      maxLife: new Float32Array(PARTICLE_COUNT),
    };
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(buffers.positions, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    const color = new THREE.BufferAttribute(buffers.colors, 4).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', position);
    geometry.setAttribute('color', color);
    buffersRef.current = buffers;
    const points = pointsRef.current;
    if (points) points.geometry = geometry;

    return () => {
      geometry.dispose();
      buffersRef.current = null;
    };
  }, []);

  useFrame((state, delta) => {
    const buffers = buffersRef.current;
    if (!buffers) return;
    const { positions, colors, velocities, life, maxLife } = buffers;
    const dt = Math.min(delta, MAX_STEP);
    const isError = status === 'error';
    const drawing = drawingRef.current && !isError;
    const emitting = drawing || isError;

    if (emitting) {
      spawnAcc.current += dt * (isError ? 240 : 150);
      while (spawnAcc.current >= 1) {
        spawnAcc.current -= 1;
        const i = cursor.current;
        cursor.current = (i + 1) % PARTICLE_COUNT;
        const i3 = i * 3;
        const i4 = i * 4;
        const tip = tipWorld.current;

        positions[i3] = tip.x + (Math.random() - 0.5) * 0.05;
        positions[i3 + 1] = tip.y + (Math.random() - 0.5) * 0.05;
        positions[i3 + 2] = DRAW_Z + (Math.random() - 0.5) * 0.03;

        const angle = Math.random() * Math.PI * 2;
        if (isError) {
          // Erro: o emissor "espirra" vermelho forte em todas as direções.
          const speed = 0.6 + Math.random() * 1.1;
          velocities[i3] = Math.cos(angle) * speed;
          velocities[i3 + 1] = Math.sin(angle) * speed;
          velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
          colors[i4] = RED_RGB[0];
          colors[i4 + 1] = RED_RGB[1];
          colors[i4 + 2] = RED_RGB[2];
        } else {
          // Tinta preta/dark, com flashes laranja de fricção.
          const speed = 0.15 + Math.random() * 0.35;
          velocities[i3] = Math.cos(angle) * speed;
          velocities[i3 + 1] = 0.12 + Math.random() * 0.4;
          velocities[i3 + 2] = Math.sin(angle) * speed * 0.4;
          const flash = Math.random() < 0.28;
          colors[i4] = flash ? ORANGE_RGB[0] : INK_RGB[0];
          colors[i4 + 1] = flash ? ORANGE_RGB[1] : INK_RGB[1];
          colors[i4 + 2] = flash ? ORANGE_RGB[2] : INK_RGB[2];
        }
        colors[i4 + 3] = 0.95;

        const lifespan = isError ? 0.45 + Math.random() * 0.35 : 0.5 + Math.random() * 0.55;
        life[i] = lifespan;
        maxLife[i] = lifespan;
      }
    } else {
      spawnAcc.current = 0;
    }

    const drag = Math.pow(0.12, dt);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      if (life[i] <= 0) continue;
      const i3 = i * 3;
      const i4 = i * 4;
      const remaining = life[i] - dt;
      life[i] = remaining > 0 ? remaining : 0;

      velocities[i3] *= drag;
      velocities[i3 + 1] = velocities[i3 + 1] * drag - 0.6 * dt;
      velocities[i3 + 2] *= drag;

      positions[i3] += velocities[i3] * dt;
      positions[i3 + 1] += velocities[i3 + 1] * dt;
      positions[i3 + 2] += velocities[i3 + 2] * dt;

      colors[i4 + 3] = remaining > 0 ? (remaining / maxLife[i]) * 0.95 : 0;
    }

    const points = pointsRef.current;
    if (points) {
      (points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (points.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    }

    // Flash dinâmico na ponta da agulha (laranja ao desenhar, vermelho no erro).
    const light = lightRef.current;
    if (light) {
      const tip = tipWorld.current;
      light.position.set(tip.x, tip.y, tip.z);
      light.color.set(isError ? ERROR_COLOR : ACCENT_COLOR);
      const base = isError ? 3.4 : drawing ? 2.4 : 0;
      light.intensity =
        base > 0 ? base + Math.sin(state.clock.elapsedTime * 42) * base * 0.25 : 0;
    }
  });

  return (
    <>
      <pointLight ref={lightRef} distance={1.7} decay={2} intensity={0} />
      <points ref={pointsRef} frustumCulled={false}>
        <pointsMaterial
          vertexColors
          transparent
          depthWrite={false}
          size={PARTICLE_SIZE}
          sizeAttenuation
        />
      </points>
    </>
  );
}

interface LightingProps {
  status: OTPState;
}

function Lighting({ status }: LightingProps) {
  const isError = status === 'error';
  const isSuccess = status === 'success';

  return (
    <>
      <ambientLight
        intensity={isError ? 0.85 : 0.5}
        color={isError ? ERROR_COLOR : '#ffffff'}
      />
      {/* Laranja (direita): intensifica no sucesso. */}
      <pointLight
        position={[3, 1.5, 2]}
        color={ACCENT_COLOR}
        intensity={isSuccess ? 3.2 : 1.6}
        decay={0}
      />
      {/* Verde suave (esquerda). */}
      <pointLight position={[-3, 0.5, 1.5]} color={SUCCESS_GREEN} intensity={0.8} decay={0} />
    </>
  );
}

interface SceneProps {
  status: OTPState;
  currentDigit?: string;
  drawKey?: string | number;
}

function Scene({ status, currentDigit, drawKey }: SceneProps) {
  const tipWorld = useRef(new THREE.Vector3(0, TATTOO_PATH_OFFSET_Y, MACHINE_Z));
  const drawingRef = useRef(false);

  return (
    <>
      <Lighting status={status} />
      <StencilTrace digit={currentDigit} />
      <Suspense fallback={null}>
        <Machine
          status={status}
          currentDigit={currentDigit}
          drawKey={drawKey}
          tipWorld={tipWorld}
          drawingRef={drawingRef}
        />
      </Suspense>
      <NeedleParticles status={status} tipWorld={tipWorld} drawingRef={drawingRef} />
      <OrbitControls enableZoom={false} enablePan={false} />
    </>
  );
}

interface BoundaryState {
  failed: boolean;
}

/** Isola falhas de WebGL/carregamento do modelo para não derrubar o ecrã de OTP. */
class MachineErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function TattooMachine3D({
  status = 'idle',
  currentDigit,
  drawKey,
  style,
}: TattooMachine3DProps) {
  return (
    <View style={[styles.stage, style]}>
      <MachineErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 35 }}
          gl={{ antialias: true }}>
          <Scene status={status} currentDigit={currentDigit} drawKey={drawKey} />
        </Canvas>
      </MachineErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    overflow: 'hidden',
    borderRadius: 24,
  },
});

export type { OTPState as TattooMachineStatus };

useGLTF.preload(MODEL_SOURCE);
