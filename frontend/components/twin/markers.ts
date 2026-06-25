import type { AssetCategory } from '@/lib/types';
import {
  Video,
  DoorClosed,
  Flame,
  Wind,
  BatteryCharging,
  Zap,
  Radio,
  Network,
  type LucideIcon,
} from 'lucide-react';

export type MarkerShape = 'cone' | 'box' | 'octahedron' | 'cylinder' | 'sphere' | 'torus';

export const categoryMarker: Record<
  AssetCategory,
  { shape: MarkerShape; icon: LucideIcon; label: string }
> = {
  Camera: { shape: 'cone', icon: Video, label: 'Cameras' },
  AccessControl: { shape: 'box', icon: DoorClosed, label: 'Access Control' },
  FireSystem: { shape: 'octahedron', icon: Flame, label: 'Fire & Life Safety' },
  HVAC: { shape: 'cylinder', icon: Wind, label: 'HVAC' },
  UPS: { shape: 'box', icon: BatteryCharging, label: 'UPS / Power' },
  Electrical: { shape: 'box', icon: Zap, label: 'Electrical' },
  Sensor: { shape: 'sphere', icon: Radio, label: 'IoT Sensors' },
  Network: { shape: 'torus', icon: Network, label: 'Network' },
};

export const twinCategories = Object.keys(categoryMarker) as AssetCategory[];
