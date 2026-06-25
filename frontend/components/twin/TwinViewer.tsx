'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Layers, Building2, Eye, EyeOff, Loader2, MapPin, Boxes } from 'lucide-react';
import type { AssetCategory } from '@/lib/types';
import { floors } from '@/lib/data/facility';
import { assets } from '@/lib/data/assets';
import { GlassCard, HealthBar, StatusBadge } from '@/components/ui';
import { assetStatusMeta, healthColor, formatDate, cn } from '@/lib/utils';
import { categoryMarker, twinCategories } from './markers';

const FacilityScene = dynamic(() => import('./FacilityScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-command-400" />
      <span className="text-sm">Initializing digital twin…</span>
    </div>
  ),
});

const statusLegend: { key: keyof typeof assetStatusMeta; label: string }[] = [
  { key: 'operational', label: 'Operational' },
  { key: 'warning', label: 'Warning' },
  { key: 'critical', label: 'Critical' },
  { key: 'offline', label: 'Offline' },
];

export function TwinViewer() {
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<Set<AssetCategory>>(
    new Set(twinCategories),
  );

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? null;
  const selectedFloor = floors.find((f) => f.id === selectedFloorId) ?? null;

  const floorCounts = useMemo(
    () =>
      Object.fromEntries(
        floors.map((f) => [f.id, assets.filter((a) => a.floorId === f.id).length]),
      ),
    [],
  );
  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        twinCategories.map((c) => [c, assets.filter((a) => a.category === c).length]),
      ) as Record<AssetCategory, number>,
    [],
  );

  function toggleCategory(c: AssetCategory) {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Left controls */}
      <div className="col-span-12 space-y-4 lg:col-span-3">
        <GlassCard padded>
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-command-300" />
            <h3 className="text-sm font-semibold text-slate-100">Floors</h3>
          </div>
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedFloorId(null)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                selectedFloorId === null
                  ? 'bg-command-500/15 text-white'
                  : 'text-slate-400 hover:bg-white/[0.04]',
              )}
            >
              <span className="font-medium">All Floors</span>
              <span className="data-num text-xs text-slate-500">{assets.length}</span>
            </button>
            {floors
              .slice()
              .reverse()
              .map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFloorId(f.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                    selectedFloorId === f.id
                      ? 'bg-command-500/15 text-white'
                      : 'text-slate-400 hover:bg-white/[0.04]',
                  )}
                >
                  <span className="font-medium">{f.name}</span>
                  <span className="data-num text-xs text-slate-500">{floorCounts[f.id]}</span>
                </button>
              ))}
          </div>
        </GlassCard>

        <GlassCard padded>
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-command-300" />
            <h3 className="text-sm font-semibold text-slate-100">Asset Layers</h3>
          </div>
          <div className="space-y-1">
            {twinCategories.map((c) => {
              const meta = categoryMarker[c];
              const Icon = meta.icon;
              const on = visibleCategories.has(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                    on ? 'text-slate-200 hover:bg-white/[0.04]' : 'text-slate-600 hover:bg-white/[0.02]',
                  )}
                >
                  <Icon className={cn('h-4 w-4', on ? 'text-command-300' : 'text-slate-600')} />
                  <span className="flex-1 text-left">{meta.label}</span>
                  <span className="data-num text-xs text-slate-500">{categoryCounts[c]}</span>
                  {on ? <Eye className="h-3.5 w-3.5 text-slate-500" /> : <EyeOff className="h-3.5 w-3.5 text-slate-700" />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 border-t border-white/5 pt-3">
            <div className="section-label mb-2">Status legend</div>
            <div className="grid grid-cols-2 gap-1.5">
              {statusLegend.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: assetStatusMeta[s.key].hex }} />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Center scene */}
      <div className="col-span-12 lg:col-span-6">
        <GlassCard className="relative h-[640px] overflow-hidden p-0" padded={false}>
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <span className="chip border-white/10 bg-ink-950/70 text-slate-300 backdrop-blur-md">
              <Boxes className="h-3 w-3 text-command-300" />
              {selectedFloor ? selectedFloor.name : 'Full Facility'}
            </span>
            <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
            </span>
          </div>
          <div className="absolute bottom-4 left-4 z-10 hidden text-[11px] text-slate-500 sm:block">
            Drag to rotate | Scroll to zoom | Click a marker for detail
          </div>
          <div className="h-full w-full">
            <FacilityScene
              floors={floors}
              assets={assets}
              selectedFloorId={selectedFloorId}
              visibleCategories={visibleCategories}
              selectedAssetId={selectedAssetId}
              onSelectAsset={setSelectedAssetId}
              onSelectFloor={(id) => setSelectedFloorId(id)}
            />
          </div>
        </GlassCard>
      </div>

      {/* Right detail */}
      <div className="col-span-12 lg:col-span-3">
        <GlassCard padded className="lg:sticky lg:top-20">
          {selectedAsset ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="data-num text-xs text-slate-500">{selectedAsset.tag}</span>
                  <StatusBadge status={selectedAsset.status} />
                </div>
                <h3 className="mt-1 text-base font-semibold text-white">{selectedAsset.name}</h3>
                <p className="text-xs text-slate-500">
                  {categoryMarker[selectedAsset.category].label}
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Asset health</span>
                  <span className="data-num font-semibold" style={{ color: healthColor(selectedAsset.healthPct) }}>
                    {selectedAsset.healthPct}%
                  </span>
                </div>
                <HealthBar value={selectedAsset.healthPct} color={healthColor(selectedAsset.healthPct)} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Manufacturer" value={selectedAsset.manufacturer} />
                <Field label="Model" value={selectedAsset.model} />
                <Field label="Installed" value={formatDate(selectedAsset.installDate)} />
                <Field label="Last service" value={formatDate(selectedAsset.lastServiceDate)} />
                <Field
                  label="Predicted failure"
                  value={
                    selectedAsset.predictedFailureDays === null
                      ? 'None forecast'
                      : selectedAsset.predictedFailureDays <= 0
                        ? 'Offline / now'
                        : `~${selectedAsset.predictedFailureDays} days`
                  }
                />
                <Field label="MTBF" value={`${selectedAsset.mtbfDays} d`} />
              </div>

              {selectedAsset.recommendation && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
                  <div className="section-label mb-1 text-amber-200/80">AI Recommendation</div>
                  <p className="text-xs leading-relaxed text-amber-100/90">{selectedAsset.recommendation}</p>
                </div>
              )}

              <div>
                <div className="section-label mb-2">Live telemetry</div>
                <div className="space-y-1.5">
                  {Object.entries(selectedAsset.telemetry).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-xs">
                      <span className="capitalize text-slate-500">
                        {k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      </span>
                      <span className="data-num font-medium text-slate-200">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-slate-500">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">No asset selected</p>
                <p className="mt-1 text-xs text-slate-500">
                  Click any marker in the 3D model to inspect its live status, health and telemetry.
                </p>
              </div>
              <div className="mt-2 w-full border-t border-white/5 pt-3 text-left">
                <div className="section-label mb-2">Facility snapshot</div>
                <div className="space-y-1.5 text-xs">
                  <Row label="Total assets" value={assets.length} />
                  <Row label="Operational" value={assets.filter((a) => a.status === 'operational').length} color="#10B981" />
                  <Row label="Warning" value={assets.filter((a) => a.status === 'warning').length} color="#F4C152" />
                  <Row label="Critical" value={assets.filter((a) => a.status === 'critical').length} color="#EF4444" />
                  <Row label="Offline" value={assets.filter((a) => a.status === 'offline').length} color="#64748B" />
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 font-medium text-slate-200">{value}</div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-400">
        {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
        {label}
      </span>
      <span className="data-num font-semibold text-slate-200">{value}</span>
    </div>
  );
}
