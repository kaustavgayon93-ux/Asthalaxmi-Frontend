'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  ChevronDown,
  ShieldCheck,
  LogOut,
  Sliders,
} from 'lucide-react';

const routeTitles = {
  '/': 'Forest Monitoring Dashboard',
  '/map': 'GIS Spatial Map View',
  '/satellite': 'Satellite Earth Observation & STAC Catalog',
  '/drone-surveys': 'Drone (UAV) Survey & High-Res Tree Vision',
  '/resources': 'Govt Portals & Standards Catalog',
  '/divisions': 'Forest Divisions',
  '/compartments': 'Compartment Boundaries & Density',
  '/plantations': 'Plantations & Sapling Survival',
  '/sample-plots': 'Sample Plots Management',
  '/tree-measurements': 'Tree Biomass & Field Measurements',
  '/alerts': 'Real-Time Deforestation & Degradation Alerts',
  '/field-inspections': 'Field Verification & Inspections',
  '/carbon-mrv': 'Carbon MRV Accounting & Certification',
  '/audit-log': 'System Security & Audit Trail',
  '/settings': 'System Configuration & Settings',
};

export default function Header({ onMenuClick, isDarkMode, onToggleTheme }) {
  const pathname = usePathname();
  const pageTitle = routeTitles[pathname] || 'Forest Monitoring';

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(4);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile hamburger & Dynamic page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
          title="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {pageTitle}
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>State Forest Monitoring Grid &bull; Live Telemetry</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Global search..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 dark:text-white"
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setUnreadNotifications(0)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full bg-forest-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/30">
              PS
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">
                Dr. P. Sarma
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-none">
                ASSAC Scientist
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Dr. Pranab Sarma</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">pranab.sarma@assac.gov.in</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-forest-600 dark:text-forest-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>ASSAC Nodal Officer</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Sliders className="w-3.5 h-3.5" /> Preferences
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
