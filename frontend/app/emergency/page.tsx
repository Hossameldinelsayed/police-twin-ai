import { Siren } from 'lucide-react';
import { PageHeader, LiveBadge } from '@/components/ui';
import { EmergencySimulator } from '@/components/emergency/EmergencySimulator';

export default function EmergencyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 06 · Emergency Simulation Center"
        title="Emergency Response Simulation"
        subtitle="Run pre-modeled crisis drills across fire, power, security and equipment failure — visualize impacted zones, orchestrated automated + human response, and AI-estimated recovery."
        icon={<Siren className="h-5 w-5" />}
        actions={<LiveBadge label="DRILL READY" />}
      />
      <EmergencySimulator />
    </div>
  );
}
