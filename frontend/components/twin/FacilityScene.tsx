'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Edges } from '@react-three/drei';
import { useRef, useState } from 'react';
import type { Group } from 'three';
import type { Asset, AssetCategory, Floor, Zone } from '@/lib/types';
import { FOOTPRINT, floorY } from '@/lib/data/facility';
import { assetStatusMeta } from '@/lib/utils';
import { categoryMarker } from './markers';

interface FacilitySceneProps {
  floors: Floor[];
  assets: Asset[];
  selectedFloorId: string | null;
  visibleCategories: Set<AssetCategory>;
  selectedAssetId: string | null;
  onSelectAsset: (id: string | null) => void;
  onSelectFloor: (id: string) => void;
}

const PLATE_H = 0.35;
// Quadrant centres for the 4 zones (matches the asset layout in data/assets.ts)
const quad = [
  { x: -FOOTPRINT.w / 4, z: -FOOTPRINT.d / 4 },
  { x: FOOTPRINT.w / 4, z: -FOOTPRINT.d / 4 },
  { x: -FOOTPRINT.w / 4, z: FOOTPRINT.d / 4 },
  { x: FOOTPRINT.w / 4, z: FOOTPRINT.d / 4 },
];

// ---------------------------------------------------------------- Asset marker
function AssetMarker({
  asset,
  selected,
  labeled,
  onSelect,
}: {
  asset: Asset;
  selected: boolean;
  labeled: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const hex = assetStatusMeta[asset.status].hex;
  const statusLabel = assetStatusMeta[asset.status].label;
  const Icon = categoryMarker[asset.category].icon;
  const active = selected || hovered;
  const pulse = asset.status === 'critical' || asset.status === 'offline';

  // Floor-top surface in this group's local space (group origin = the head).
  // Assets sit 0.6 above the floor centre; plate top is PLATE_H/2 above centre.
  const floorTop = -(0.6 - PLATE_H / 2); // ≈ -0.425
  const stemLen = Math.abs(floorTop) - 0.05;

  useFrame((state) => {
    if (!ref.current) return;
    const target = active ? 1.25 : 1;
    const s = ref.current.scale;
    const n = s.x + (target - s.x) * 0.15;
    s.set(n, n, n);
    if (pulse) {
      const t = state.clock.getElapsedTime();
      ref.current.position.y = asset.position.y + Math.sin(t * 2.5 + asset.position.x) * 0.05;
    }
  });

  return (
    <group ref={ref} position={[asset.position.x, asset.position.y, asset.position.z]}>
      {/* stem connecting marker to the floor */}
      <mesh position={[0, (floorTop - 0.05) / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, stemLen, 8]} />
        <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={0.4} transparent opacity={0.75} />
      </mesh>

      {/* base disc on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorTop + 0.01, 0]}>
        <circleGeometry args={[pulse ? 0.5 : 0.32, 28]} />
        <meshBasicMaterial color={hex} transparent opacity={pulse ? 0.4 : 0.22} />
      </mesh>

      {/* marker head */}
      <mesh
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
        <sphereGeometry args={[0.3, 20, 20]} />
        <meshStandardMaterial
          color={hex}
          emissive={hex}
          emissiveIntensity={active ? 0.9 : 0.4}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* always-on icon chip + (optional) tag + hover detail */}
      <Html center distanceFactor={12} position={[0, 0.55, 0]} style={{ pointerEvents: 'none' }}>
        <div className="flex select-none flex-col items-center gap-1">
          <div
            className="flex items-center gap-1 rounded-full border px-1.5 py-0.5 backdrop-blur-md"
            style={{ borderColor: `${hex}66`, background: 'rgba(7,11,20,0.85)' }}
          >
            <Icon className="h-3 w-3" style={{ color: hex }} />
            {(labeled || active) && (
              <span className="font-mono text-[10px] leading-none text-slate-200">{asset.tag}</span>
            )}
          </div>
          {active && (
            <div className="whitespace-nowrap rounded-lg border border-white/15 bg-ink-950/95 px-2 py-1 text-[10px] shadow-glass">
              <div className="font-medium text-white">{asset.name}</div>
              <div className="mt-0.5 flex items-center gap-1" style={{ color: hex }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
                {statusLabel} | {asset.healthPct}%
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ----------------------------------------------------------------- Floor plate
function ZoneRoom({ zone, cx, cz }: { zone: Zone; cx: number; cz: number }) {
  const w = FOOTPRINT.w / 2 - 1.4;
  const d = FOOTPRINT.d / 2 - 1.0;
  const tint = zone.critical ? '#EF4444' : '#2BD4F0';
  return (
    <mesh position={[cx, PLATE_H / 2 + 0.04, cz]}>
      <boxGeometry args={[w, 0.06, d]} />
      <meshStandardMaterial color="#0b1a2c" transparent opacity={0.35} />
      <Edges threshold={15} color={tint} />
    </mesh>
  );
}

function FloorPlate({
  floor,
  active,
  dimmed,
  showZoneLabels,
  onSelect,
}: {
  floor: Floor;
  active: boolean;
  dimmed: boolean;
  showZoneLabels: boolean;
  onSelect: () => void;
}) {
  const y = floorY(floor.level);
  const opacity = dimmed ? 0.25 : active ? 0.97 : 0.9;

  return (
    <group position={[0, y, 0]}>
      {/* solid floor plate */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
        receiveShadow
      >
        <boxGeometry args={[FOOTPRINT.w, PLATE_H, FOOTPRINT.d]} />
        <meshStandardMaterial
          color={active ? '#10314f' : '#0c1a2e'}
          emissive={active ? '#06AEDB' : '#000000'}
          emissiveIntensity={active ? 0.16 : 0}
          metalness={0.2}
          roughness={0.85}
          transparent
          opacity={opacity}
        />
        <Edges threshold={15} color={active ? '#3ad2f5' : '#24405f'} />
      </mesh>

      {/* rooms / zones */}
      {!dimmed &&
        floor.zones.map((z, i) => (
          <ZoneRoom key={z.id} zone={z} cx={quad[i].x} cz={quad[i].z} />
        ))}

      {/* zone name labels (only when this floor is the focus) */}
      {showZoneLabels &&
        floor.zones.map((z, i) => (
          <Html
            key={z.id}
            center
            distanceFactor={16}
            position={[quad[i].x, PLATE_H / 2 + 0.2, quad[i].z]}
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex select-none items-center gap-1 whitespace-nowrap rounded-md border border-white/10 bg-ink-950/80 px-1.5 py-0.5 text-[9px] text-slate-300 backdrop-blur-md">
              {z.critical && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
              {z.name}
            </div>
          </Html>
        ))}

      {/* floor name tab on the side */}
      <Html
        position={[-FOOTPRINT.w / 2 - 0.4, 0.2, FOOTPRINT.d / 2 + 0.2]}
        distanceFactor={20}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`flex select-none items-center gap-2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium backdrop-blur-md ${
            active
              ? 'border border-command-500/40 bg-command-500/20 text-command-100'
              : 'border border-white/10 bg-ink-950/80 text-slate-300'
          }`}
        >
          <span className="font-mono text-[10px] opacity-70">
            {floor.level < 0 ? `B${Math.abs(floor.level)}` : `L${floor.level + 1}`}
          </span>
          {floor.name.replace(/^.*?\|\s*/, '')}
        </div>
      </Html>
    </group>
  );
}

function CornerColumns({ topY }: { topY: number }) {
  const hw = FOOTPRINT.w / 2;
  const hd = FOOTPRINT.d / 2;
  const corners = [
    [-hw, -hd],
    [hw, -hd],
    [-hw, hd],
    [hw, hd],
  ];
  return (
    <>
      {corners.map(([x, z], i) => (
        <mesh key={i} position={[x, topY / 2 - 0.5, z]}>
          <boxGeometry args={[0.18, topY + 1, 0.18]} />
          <meshStandardMaterial color="#1a2c44" transparent opacity={0.5} />
        </mesh>
      ))}
    </>
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
  const topY = floorY(4) + 1;
  const targetY = focusFloor ? floorY(focusFloor.level) : floorY(2);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [25, 22, 30], fov: 40 }}
      onPointerMissed={() => onSelectAsset(null)}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#060a12']} />
      <fog attach="fog" args={['#060a12', 55, 110]} />

      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#9fc7ff', '#0a1322', 0.5]} />
      <directionalLight position={[18, 30, 14]} intensity={1.2} castShadow />
      <pointLight position={[-14, 14, -10]} intensity={120} color="#1FC8F5" />
      <pointLight position={[14, 8, 14]} intensity={70} color="#8B5CF6" />

      <gridHelper args={[90, 45, '#16263f', '#0c1626']} position={[0, -0.6, 0]} />

      <CornerColumns topY={topY} />

      {floors.map((floor) => (
        <FloorPlate
          key={floor.id}
          floor={floor}
          active={selectedFloorId ? floor.id === selectedFloorId : false}
          dimmed={!!selectedFloorId && floor.id !== selectedFloorId}
          showZoneLabels={selectedFloorId === floor.id}
          onSelect={() => onSelectFloor(floor.id)}
        />
      ))}

      {visibleAssets.map((asset) => (
        <AssetMarker
          key={asset.id}
          asset={asset}
          selected={asset.id === selectedAssetId}
          labeled={!!selectedFloorId}
          onSelect={() => onSelectAsset(asset.id)}
        />
      ))}

      <CameraRig targetY={targetY} />
      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={12}
        maxDistance={85}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, floorY(2), 0]}
      />
    </Canvas>
  );
}
