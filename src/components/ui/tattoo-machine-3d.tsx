import { Canvas, useFrame } from '@react-three/fiber/native';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { Component, type ReactNode, Suspense, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import type { OTPState } from '@/components/ui/otp-input';

/**
 * Modelo 3D da máquina de tatuagem (Dark Luxury). O ficheiro `.glb` é carregado
 * pelo Metro através do `require`, resolvido no runtime nativo por `expo-asset`.
 */
const MODEL_SOURCE = require('../../../assets/models/tattoo-machine.glb') as unknown as string;

const CHASSIS_COLOR = '#121212';
const ACCENT_COLOR = '#F97316';
const ERROR_COLOR = '#EF4444';
const SUCCESS_GREEN = '#10B981';

/** Alto-relevo do chassis vs. detalhes/grip: peças com volume >= 50% da maior são chassis. */
const CHASSIS_VOLUME_RATIO = 0.5;
/** Tamanho-alvo (em unidades de cena) do maior eixo da máquina, para enquadrar a câmara. */
const TARGET_SIZE = 2;

export interface TattooMachine3DProps {
  /** Estado do fluxo de OTP que dirige a animação e a iluminação. */
  status?: OTPState;
  style?: View['props']['style'];
}

interface StyledModel {
  root: THREE.Object3D;
  scale: number;
  center: THREE.Vector3;
  materials: THREE.MeshStandardMaterial[];
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

    return { root, scale: TARGET_SIZE / maxDimension, center, materials: [chassis, detail] };
  }, [scene]);
}

interface MachineProps {
  status: OTPState;
}

function Machine({ status }: MachineProps) {
  const group = useRef<THREE.Group>(null);
  const { root, scale, center, materials } = useStyledModel();

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;
    const time = state.clock.elapsedTime;

    if (status === 'buzzing') {
      node.position.x = Math.sin(time * 50) * 0.05;
      node.position.y = Math.sin(time * 50) * 0.05;
      node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, 0, 0.2);
    } else if (status === 'error') {
      node.position.x = Math.sin(time * 80) * 0.12;
      node.position.y = Math.cos(time * 90) * 0.09;
      node.rotation.z = Math.sin(time * 70) * 0.08;
    } else if (status === 'success') {
      node.position.x = THREE.MathUtils.lerp(node.position.x, 0, 0.12);
      node.position.y = THREE.MathUtils.lerp(node.position.y, 0, 0.12);
      node.rotation.y += delta * 1.8;
      node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, 0, 0.12);
    } else {
      node.position.x = THREE.MathUtils.lerp(node.position.x, 0, 0.12);
      node.position.y = THREE.MathUtils.lerp(node.position.y, 0, 0.12);
      node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, 0, 0.12);
    }
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

function Scene({ status }: MachineProps) {
  return (
    <>
      <Lighting status={status} />
      <Suspense fallback={null}>
        <Machine status={status} />
      </Suspense>
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

export function TattooMachine3D({ status = 'idle', style }: TattooMachine3DProps) {
  return (
    <View style={[styles.stage, style]}>
      <MachineErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 35 }}
          gl={{ antialias: true }}>
          <Scene status={status} />
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
