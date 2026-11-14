'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  BookmarkCheck,
  Receipt,
  Sparkles,
  UtensilsCrossed,
  Compass,
  BarChart3,
  ShieldCheck,
  Palmtree,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Executive Cockpit', icon: LayoutDashboard },
  { href: '/matrix', label: 'Room Matrix (Gantt)', icon: CalendarDays },
  { href: '/bookings', label: 'Booking & Yield Engine', icon: BookmarkCheck },
  { href: '/folios', label: 'Folios & Multi-Tender', icon: Receipt },
  { href: '/housekeeping', label: 'Housekeeping & OOO', icon: Sparkles },
  { href: '/pos', label: 'Outlets & F&B POS', icon: UtensilsCrossed },
  { href: '/concierge', label: 'VIP CRM & Yachts', icon: Compass },
  { href: '/reports', label: 'RevPAR & Flash Audit', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1A2E35] text-[#F8FAF8] flex flex-col min-h-screen border-r border-[#2C4852] shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#2C4852]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#006B7D] flex items-center justify-center text-white shadow-md">
            <Palmtree className="w-6 h-6 text-[#C5A059]" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg tracking-wide text-white">THE GRAND BAHAMIAN</h1>
            <p className="text-xs text-[#A4B1B8] tracking-widest uppercase font-semibold">Resort & Reserve</p>
          </div>
        </div>
        <div className="mt-3 px-2 py-1 rounded bg-[#0F1C21] text-[10px] text-[#C5A059] flex items-center justify-between border border-[#C5A059]/30">
          <span>Cable Beach • Bahamas</span>
          <span className="font-mono">VAT 10% ACTIVE</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#006B7D] text-white shadow-sm font-semibold'
                  : 'text-[#A4B1B8] hover:bg-[#2C4852]/60 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#C5A059]' : 'text-[#7D8C94]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Compliance Footer */}
      <div className="p-4 border-t border-[#2C4852] bg-[#0F1C21]/60">
        <div className="flex items-center gap-2 text-xs text-[#A4B1B8]">
          <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
          <div>
            <p className="font-semibold text-white">Bahamas Tax Regulated</p>
            <p className="text-[10px] text-[#7D8C94]">TIN: 100293848-VAT-BS</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
