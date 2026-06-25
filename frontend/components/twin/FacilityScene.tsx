'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Edges } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { Vector3, type Group } from 'three';
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

// ---- layout constants -------------------------------------------------------
const PLATE_H = 0.3;
const PLATE_TOP = PLATE_H / 2; // 0.15 above floor centre
const WALL_H = 1.5;
const WALL_T = 0.14;
const WY = PLATE_TOP + WALL_H / 2; // wall centre (floor-local)
const FB = -(0.6 - PLATE_TOP); // floor top in a device group's local space (-0.45)
const W = FOOTPRINT.w;
const D = FOOTPRINT.d;
const quad = [
  { x: -W / 4, z: -D / 4 },
  { x: W / 4, z: -D / 4 },
  { x: -W / 4, z: D / 4 },
  { x: W / 4, z: D / 4 },
];

// ============================================================ Device 3D models
function DeviceModel({ category, hex }: { category: AssetCategory; hex: string }) {
  const body = (
    <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={0.4} metalness={0.4} roughness={0.45} />
  );
  switch (category) {
    case 'Camera':
      return (
        <group>
          <mesh position={[0, FB + 0.55, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
            <meshStandardMaterial color="#3a4a63" />
          </mesh>
          <group position={[0, FB + 1.1, 0.04]} rotation={[0.5, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.26, 0.2, 0.3]} />
              {body}
            </mesh>
            <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.09, 0.16, 16]} />
              <meshStandardMaterial color="#0a0f18" metalness={0.7} roughness={0.2} />
            </mesh>
          </group>
        </group>
      );
    case 'AccessControl':
      return (
        <group>
          <mesh position={[0, FB + 0.7, 0]}>
            <boxGeometry args={[0.12, 1.4, 0.7]} />
            {body}
          </mesh>
          <mesh position={[0.11, FB + 0.85, 0.42]}>
            <boxGeometry args={[0.05, 0.18, 0.1]} />
            <meshStandardMaterial color="#0a0f18" emissive={hex} emissiveIntensity={1} />
          </mesh>
        </group>
      );
    case 'FireSystem':
      return (
        <group position={[0, FB + 1.45, 0]}>
          <mesh>
            <sphereGeometry args={[0.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {body}
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.04, 18]} />
            <meshStandardMaterial color="#cdd6e3" />
          </mesh>
        </group>
      );
    case 'HVAC':
      return (
        <group position={[0, FB, 0]}>
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[0.8, 0.64, 0.6]} />
            {body}
          </mesh>
          <mesh position={[0, 0.66, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.04, 10, 22]} />
            <meshStandardMaterial color="#0a0f18" />
          </mesh>
          {[0.14, 0, -0.14].map((dy, i) => (
            <mesh key={i} position={[0, 0.32 + dy, 0.31]}>
              <boxGeometry args={[0.62, 0.04, 0.02]} />
              <meshStandardMaterial color="#0a0f18" />
            </mesh>
          ))}
        </group>
      );
    case 'UPS':
    case 'Electrical':
      return (
        <group position={[0, FB, 0]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.55, 1.4, 0.5]} />
            {body}
          </mesh>
          <mesh position={[0, 1.05, 0.26]}>
            <boxGeometry args={[0.32, 0.06, 0.02]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={1.4} />
          </mesh>
          <mesh position={[0, 0.78, 0.26]}>
            <boxGeometry args={[0.32, 0.02, 0.02]} />
            <meshStandardMaterial color="#0a0f18" />
          </mesh>
        </group>
      );
    case 'Network':
      return (
        <group position={[0, FB, 0]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.5, 1.4, 0.55]} />
            {body}
          </mesh>
          {[0.45, 0.25, 0.05, -0.15, -0.35].map((dy, i) => (
            <mesh key={i} position={[0, 0.7 + dy, 0.28]}>
              <boxGeometry args={[0.4, 0.05, 0.02]} />
              <meshStandardMaterial color="#0a0f18" emissive={hex} emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      );
    case 'Sensor':
    default:
      return (
        <group position={[0, FB + 1.42, 0]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.14, 0.08, 18]} />
            {body}
          </mesh>
        </group>
      );
  }
}

function DeviceProp({
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

  useFrame((state) => {
    if (!ref.current) return;
    const target = active ? 1.12 : 1;
    const s = ref.current.scale;
    const n = s.x + (target - s.x) * 0.15;
    s.set(n, n, n);
    ref.current.position.y =
      asset.position.y + (pulse ? Math.sin(state.clock.getElapsedTime() * 2.5 + asset.position.x) * 0.04 : 0);
  });

  return (
    <group ref={ref} position={[asset.position.x, asset.position.y, asset.position.z]}>
      {/* visuals */}
      <DeviceModel category={asset.category} hex={hex} />

      {/* base locator ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FB + 0.02, 0]}>
        <ringGeometry args={[pulse ? 0.45 : 0.34, pulse ? 0.6 : 0.44, 28]} />
        <meshBasicMaterial color={hex} transparent opacity={active ? 0.9 : pulse ? 0.55 : 0.3} />
      </mesh>

      {/* invisible hit target for easy clicking */}
      <mesh
        position={[0, FB + 0.9, 0]}
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
        <boxGeometry args={[1, 2, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* labels */}
      {(labeled || active) && (
        <Html center distanceFactor={12} position={[0, 1.5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="flex select-none flex-col items-center gap-1">
            <div
              className="flex items-center gap-1 rounded-full border px-1.5 py-0.5 backdrop-blur-md"
              style={{ borderColor: `${hex}66`, background: 'rgba(7,11,20,0.85)' }}
            >
              <Icon className="h-3 w-3" style={{ color: hex }} />
              <span className="font-mono text-[10px] leading-none text-slate-200">{asset.tag}</span>
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
      )}
    </group>
  );
}

// =============================================================== Building floor
function Walls({ dimmed }: { dimmed: boolean }) {
  const op = dimmed ? 0.12 : 0.55;
  const mat = (
    <meshStandardMaterial color="#1b2c45" transparent opacity={op} metalness={0.2} roughness={0.8} />
  );
  const gap = 1.1;
  const vSeg = D / 2 - gap; // partition along z at x=0
  const hSeg = W / 2 - gap; // partition along x at z=0
  return (
    <group>
      {/* perimeter */}
      <mesh position={[0, WY, -D / 2]}><boxGeometry args={[W, WALL_H, WALL_T]} />{mat}</mesh>
      <mesh position={[0, WY, D / 2]}><boxGeometry args={[W, WALL_H, WALL_T]} />{mat}</mesh>
      <mesh position={[-W / 2, WY, 0]}><boxGeometry args={[WALL_T, WALL_H, D]} />{mat}</mesh>
      <mesh position={[W / 2, WY, 0]}><boxGeometry args={[WALL_T, WALL_H, D]} />{mat}</mesh>
      {/* interior partitions with central doorways */}
      <mesh position={[0, WY, gap + vSeg / 2]}><boxGeometry args={[WALL_T, WALL_H, vSeg]} />{mat}</mesh>
      <mesh position={[0, WY, -(gap + vSeg / 2)]}><boxGeometry args={[WALL_T, WALL_H, vSeg]} />{mat}</mesh>
      <mesh position={[gap + hSeg / 2, WY, 0]}><boxGeometry args={[hSeg, WALL_H, WALL_T]} />{mat}</mesh>
      <mesh position={[-(gap + hSeg / 2), WY, 0]}><boxGeometry args={[hSeg, WALL_H, WALL_T]} />{mat}</mesh>
    </group>
  );
}

function FloorBuilding({
  floor,
  active,
  dimmed,
  focused,
  onSelect,
}: {
  floor: Floor;
  active: boolean;
  dimmed: boolean;
  focused: boolean;
  onSelect: () => void;
}) {
  const y = floorY(floor.level);
  const opacity = dimmed ? 0.2 : 1;

  return (
    <group position={[0, y, 0]}>
      {/* floor plate */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
        receiveShadow
      >
        <boxGeometry args={[W, PLATE_H, D]} />
        <meshStandardMaterial
          color={active ? '#103252' : '#0c1a2e'}
          emissive={active ? '#06AEDB' : '#000000'}
          emissiveIntensity={active ? 0.14 : 0}
          metalness={0.2}
          roughness={0.85}
          transparent
          opacity={opacity}
        />
        <Edges threshold={15} color={active ? '#3ad2f5' : '#22344f'} />
      </mesh>

      {/* room floor tints */}
      {!dimmed &&
        floor.zones.map((z, i) => (
          <mesh key={z.id} position={[quad[i].x, PLATE_TOP + 0.01, quad[i].z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[W / 2 - 0.5, D / 2 - 0.5]} />
            <meshBasicMaterial color={z.critical ? '#3a1420' : '#0e2236'} transparent opacity={0.5} />
          </mesh>
        ))}

      {!dimmed && <Walls dimmed={dimmed} />}

      {/* zone labels when focused */}
      {focused &&
        floor.zones.map((z, i) => (
          <Html
            key={z.id}
            center
            distanceFactor={16}
            position={[quad[i].x, PLATE_TOP + WALL_H + 0.25, quad[i].z]}
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex select-none items-center gap-1 whitespace-nowrap rounded-md border border-white/10 bg-ink-950/85 px-1.5 py-0.5 text-[9px] text-slate-300 backdrop-blur-md">
              {z.critical && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
              {z.name}
            </div>
          </Html>
        ))}

      {/* floor tab */}
      <Html position={[-W / 2 - 0.4, 0.2, D / 2 + 0.2]} distanceFactor={20} style={{ pointerEvents: 'none' }}>
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

function GlassFacade() {
  const w = W + 0.7;
  const d = D + 0.7;
  const bottom = floorY(-1) - PLATE_TOP;
  const top = floorY(4) + PLATE_TOP + WALL_H + 0.4;
  const h = top - bottom;
  const cy = (top + bottom) / 2;
  return (
    <mesh position={[0, cy, 0]} raycast={() => null}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color="#1FC8F5" transparent opacity={0.05} metalness={0.1} roughness={0.1} depthWrite={false} side={2} />
      <Edges threshold={15} color="#1c3a55" />
    </mesh>
  );
}

function CornerColumns({ topY }: { topY: number }) {
  const hw = W / 2;
  const hd = D / 2;
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
          <boxGeometry args={[0.22, topY + 1, 0.22]} />
          <meshStandardMaterial color="#243a57" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </>
  );
}

// ================================================================ camera rig
function CinematicRig({ focusLevel }: { focusLevel: number | null }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as
    | { target: Vector3; update?: () => void }
    | undefined;
  const animating = useRef(true);
  const desiredPos = useRef(new Vector3(26, 24, 32));
  const desiredTgt = useRef(new Vector3(0, floorY(2), 0));

  useEffect(() => {
    if (focusLevel === null) {
      desiredPos.current.set(26, 24, 32);
      desiredTgt.current.set(0, floorY(2), 0);
    } else {
      const y = floorY(focusLevel);
      desiredPos.current.set(13, y + 6, 17);
      desiredTgt.current.set(0, y + 0.4, 0);
    }
    animating.current = true;
  }, [focusLevel]);

  useFrame(() => {
    if (!animating.current || !controls?.target) return;
    camera.position.lerp(desiredPos.current, 0.08);
    controls.target.lerp(desiredTgt.current, 0.08);
    controls.update?.();
    if (camera.position.distanceTo(desiredPos.current) < 0.4) animating.current = false;
  });
  return null;
}

// ===================================================================== Scene
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

  const focusFloor = floors.find((f) => f.id === selectedFloorId) ?? null;
  const topY = floorY(4) + 1;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [26, 24, 32], fov: 38 }}
      onPointerMissed={() => onSelectAsset(null)}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#060a12']} />
      <fog attach="fog" args={['#060a12', 60, 120]} />

      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#9fc7ff', '#0a1322', 0.55]} />
      <directionalLight position={[20, 32, 16]} intensity={1.25} castShadow />
      <pointLight position={[-16, 16, -12]} intensity={130} color="#1FC8F5" />
      <pointLight position={[16, 10, 16]} intensity={80} color="#8B5CF6" />

      <gridHelper args={[100, 50, '#16263f', '#0c1626']} position={[0, floorY(-1) - PLATE_TOP - 0.4, 0]} />

      <CornerColumns topY={topY} />
      {!selectedFloorId && <GlassFacade />}

      {floors.map((floor) => (
        <FloorBuilding
          key={floor.id}
          floor={floor}
          active={selectedFloorId ? floor.id === selectedFloorId : false}
          dimmed={!!selectedFloorId && floor.id !== selectedFloorId}
          focused={selectedFloorId === floor.id}
          onSelect={() => onSelectFloor(floor.id)}
        />
      ))}

      {visibleAssets.map((asset) => (
        <DeviceProp
          key={asset.id}
          asset={asset}
          selected={asset.id === selectedAssetId}
          labeled={!!selectedFloorId}
          onSelect={() => onSelectAsset(asset.id)}
        />
      ))}

      <CinematicRig focusLevel={focusFloor ? focusFloor.level : null} />
      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={6}
        maxDistance={95}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, floorY(2), 0]}
      />
    </Canvas>
  );
}
