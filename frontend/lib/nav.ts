import {
  LayoutDashboard,
  Boxes,
  Bot,
  Gauge,
  Wrench,
  Siren,
  LineChart,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  description: string;
  module: number;
}

export const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Command Center',
    short: 'Command',
    icon: LayoutDashboard,
    description: 'Executive situational overview',
    module: 1,
  },
  {
    href: '/digital-twin',
    label: 'Digital Twin',
    short: 'Twin',
    icon: Boxes,
    description: 'Interactive 3D facility model',
    module: 2,
  },
  {
    href: '/copilot',
    label: 'AI Copilot',
    short: 'Copilot',
    icon: Bot,
    description: 'Conversational facility intelligence',
    module: 3,
  },
  {
    href: '/risk-engine',
    label: 'Risk Engine',
    short: 'Risk',
    icon: Gauge,
    description: 'Explainable AI risk scoring',
    module: 4,
  },
  {
    href: '/predictive-maintenance',
    label: 'Predictive Maintenance',
    short: 'Maintenance',
    icon: Wrench,
    description: 'Failure prediction & work orders',
    module: 5,
  },
  {
    href: '/emergency',
    label: 'Emergency Center',
    short: 'Emergency',
    icon: Siren,
    description: 'Crisis simulation & response',
    module: 6,
  },
  {
    href: '/dashboard',
    label: 'Executive Dashboard',
    short: 'Trends',
    icon: LineChart,
    description: 'Trends & analytics',
    module: 7,
  },
];
