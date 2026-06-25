import { Boxes, Camera, DoorClosed, Flame, Wind } from 'lucide-react';
import { PageHeader, LiveBadge } from '@/components/ui';
import { TwinViewer } from '@/components/twin/TwinViewer';
import { assetCounts } from '@/lib/data/assets';
import { building } from '@/lib/data/facility';

export default function DigitalTwinPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 02 · Interactive Digital Twin"
        title="3D Facility Model"
        subtitle={`Live spatial model of ${building.name} — ${building.floors} floors, ${assetCounts.total} connected assets. Rotate, zoom and select any device.`}
        icon={<Boxes className="h-5 w-5" />}
        actions={<LiveBadge />}
      />

      {/* Quick category stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon={<Camera className="h-4 w-4" />} label="Cameras" value={assetCounts.byCategory.Camera} />
        <Stat icon={<DoorClosed className="h-4 w-4" />} label="Access Points" value={assetCounts.byCategory.AccessControl} />
        <Stat icon={<Flame className="h-4 w-4" />} label="Fire Devices" value={assetCounts.byCategory.FireSystem} />
        <Stat icon={<Wind className="h-4 w-4" />} label="HVAC Units" value={assetCounts.byCategory.HVAC} />
      </div>

      <TwinViewer />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-command-500/25 bg-command-500/10 text-command-300">
        {icon}
      </div>
      <div>
        <div className="data-num text-xl font-semibold text-white">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}
