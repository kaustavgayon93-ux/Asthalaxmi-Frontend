'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Building2,
  Grid3X3,
  TreePine,
  Target,
  Ruler,
  AlertTriangle,
  ClipboardCheck,
  FileBarChart,
  ScrollText,
  Settings,
  Satellite,
  Plane,
  BookOpen,
  Leaf,
  X,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Govt Resources', path: '/resources', icon: BookOpen },
  { name: 'GIS Map', path: '/map', icon: Map },
  { name: 'Satellite & STAC', path: '/satellite', icon: Satellite },
  { name: 'Drone Surveys', path: '/drone-surveys', icon: Plane },
  { name: 'Divisions', path: '/divisions', icon: Building2 },
  { name: 'Compartments', path: '/compartments', icon: Grid3X3 },
  { name: 'Plantations', path: '/plantations', icon: TreePine },
  { name: 'Sample Plots', path: '/sample-plots', icon: Target },
  { name: 'Tree Measurements', path: '/tree-measurements', icon: Ruler },
  { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { name: 'Field Inspections', path: '/field-inspections', icon: ClipboardCheck },
  { name: 'Carbon MRV', path: '/carbon-mrv', icon: FileBarChart },
  { name: 'Audit Log', path: '/audit-log', icon: ScrollText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-forest-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-xl`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-forest-800">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-700/80 text-emerald-300 border border-forest-600 shadow-sm group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white font-sans">Asthalaxmi</h1>
              <p className="text-[10px] text-emerald-300/80 uppercase tracking-widest font-semibold">
                Assam Forest GIS
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-forest-300 hover:text-white hover:bg-forest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-forest-700 text-white font-semibold shadow-md shadow-forest-950/20 border-l-4 border-emerald-400'
                    : 'text-forest-100/80 hover:bg-forest-800/60 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-300' : 'text-forest-300'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info badge */}
        <div className="p-3 border-t border-forest-800/80 text-center bg-forest-950/30">
          <p className="text-[11px] text-forest-300 font-medium">Government of Assam</p>
          <p className="text-[9px] text-forest-400/70">Environment & Forest Department</p>
        </div>
      </aside>
    </>
  );
}
