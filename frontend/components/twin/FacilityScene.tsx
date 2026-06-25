'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Edges } from '@react-three/drei';
import { useRef, useState } from 'react';
import type { Mesh } from 'three';
import type { Asset, AssetCategory, Floor } from '@/lib/types';
import { FOOTPRINT, floorY } from '@/lib/data/facility';
import { assetStatusMeta } from '@/lib/utils';
import { categoryMarker, type MarkerShape } from './markers';

interface FacilitySceneProps {
  floors: Floor[];
  assets: Asset[];
  selectedFloorId: string | null;
  visibleCategories: Set<AssetCategory>;
  selectedAssetId: string | null;
  onSelectAsset: (id: string | null) => void;
  onSelectFloor: (id: string) => void;
}

function MarkerGeometry({ shape }: { shape: MarkerShape }) {
  switch (shape) {
    case 'cone':
      return <coneGeometry args={[0.3, 0.6, 18]} />;
    case 'octahedron':
      return <octahedronGeometry args={[0.36]} />;
    case 'cylinder':
      return <cylinderGeometry args={[0.28, 0.28, 0.6, 18]} />;
    case 'sphere':
      return <sphereGeometry args={[0.32, 18, 18]} />;
    case 'torus':
      return <torusGeometry args={[0.28, 0.11, 12, 24]} />;
    case 'box':
    default:
      return <boxGeometry args={[0.5, 0.5, 0.5]} />;
  }
}

function AssetMarker({
  asset,
  selected,
  onSelect,
}: {
  asset: Asset;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const hex = assetStatusMeta[asset.status].hex;
  const marker = categoryMarker[asset.category];
  const active = selected || hovered;
  const pulse = asset.status === 'critical' || asset.status === 'offline';

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const target = active ? 1.4 : 1;
    const s = ref.current.scale;
    const next = s.x + (target - s.x) * 0.15;
    s.set(next, next, next);
    // group already holds the base position; oscillate locally around 0
    ref.current.position.y = pulse ? Math.sin(t * 3 + asset.position.x) * 0.06 : 0;
    ref.current.rotation.y += 0.005;
  });

  return (
    <group position={[asset.position.x, asset.position.y, asset.position.z]}>
      <mesh
        ref={ref}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <MarkerGeometry shape={marker.shape} />
        <meshStandardMaterial
          color={hex}
          emissive={hex}
          emissiveIntensity={active ? 1.1 : 0.45}
          metalness={0.35}
          roughness={0.35}
          transparent
          opacity={0.96}
        />
      </mesh>

      {/* Critical/offline ground ring */}
      {pulse && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshBasicMaterial color={hex} transparent opacity={0.5} />
        </mesh>
      )}

      {active && (
        <Html
          center
          distanceFactor={18}
          position={[0, 0.95, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="whitespace-nowrap rounded-lg border border-white/15 bg-ink-950/90 px-2.5 py-1.5 text-[11px] shadow-glass backdrop-blur-md">
            <div className="font-mono text-slate-400">{asset.tag}</div>
            <div className="font-medium text-white">{asset.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
              <span style={{ color: hex }}>
                {assetStatusMeta[asset.status].label} · {asset.healthPct}%
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function FloorSlab({
  floor,
  active,
  dimmed,
  onSelect,
}: {
  floor: Floor;
  active: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const y = floorY(floor.level);
  return (
    <group position={[0, y, 0]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        receiveShadow
      >
        <boxGeometry args={[FOOTPRINT.w, 0.18, FOOTPRINT.d]} />
        <meshStandardMaterial
          color={active ? '#0e2436' : '#0a1322'}
          emissive={active ? '#06AEDB' : '#0a1322'}
          emissiveIntensity={active ? 0.22 : 0.04}
          metalness={0.4}
          roughness={0.6}
          transparent
          opacity={dimmed ? 0.18 : active ? 0.92 : 0.6}
        />
        <Edges
          threshold={15}
          color={active ? '#1FC8F5' : '#1A2438'}
        />
      </mesh>
      {/* Floor label */}
      <Html
        position={[-FOOTPRINT.w / 2 - 0.6, 0.4, FOOTPRINT.d / 2]}
        center
        distanceFactor={24}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium backdrop-blur-md ${
            active ? 'bg-command-500/20 text-command-100' : 'bg-ink-950/70 text-slate-500'
          }`}
        >
          {floor.name}
        </div>
      </Html>
    </group>
  );
}

function CameraRig({ targetY }: { targetY: number }) {
  const controls = useThree((s) => s.controls) as unknown as
    | { target: { y: number }; update?: () => void }
    | undefined;
  useFrame(() => {
    if (controls?.target) {
      controls.target.y += (targetY - controls.target.y) * 0.06;
      controls.update?.();
    }
  });
  return null;
}

export default function FacilityScene({
  floors,
  assets,
  selectedFloorId,
  visibleCategories,
  selectedAssetId,
  onSelectAsset,
  onSelectFloor,
}: FacilitySceneProps) {
  const visibleAssets = assets.filter((a) => {
    if (!visibleCategories.has(a.category)) return false;
    if (selectedFloorId && a.floorId !== selectedFloorId) return false;
    return true;
  });

  const focusFloor = floors.find((f) => f.id === selectedFloorId);
  const targetY = focusFloor ? floorY(focusFloor.level) : floorY(1) + 1;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [20, 17, 24], fov: 42 }}
      onPointerMissed={() => onSelectAsset(null)}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#05070e']} />
      <fog attach="fog" args={['#05070e', 35, 70]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[15, 25, 10]} intensity={1.1} castShadow />
      <pointLight position={[-12, 10, -8]} intensity={140} color="#06AEDB" />
      <pointLight position={[12, 6, 12]} intensity={90} color="#8B5CF6" />

      <gridHelper args={[80, 40, '#13213a', '#0c1626']} position={[0, -0.5, 0]} />

      {floors.map((floor) => (
        <FloorSlab
          key={floor.id}
          floor={floor}
          active={selectedFloorId ? floor.id === selectedFloorId : false}
          dimmed={!!selectedFloorId && floor.id !== selectedFloorId}
          onSelect={() => onSelectFloor(floor.id)}
        />
      ))}

      {visibleAssets.map((asset) => (
        <AssetMarker
          key={asset.id}
          asset={asset}
          selected={asset.id === selectedAssetId}
          onSelect={() => onSelectAsset(asset.id)}
        />
      ))}

      <CameraRig targetY={targetY} />
      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={10}
        maxDistance={55}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, floorY(1) + 1, 0]}
      />
    </Canvas>
  );
}
