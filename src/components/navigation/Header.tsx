'use client';

import React from 'react';
import { Sun, DollarSign, Bell, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-[#DCE5E1] px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5C6B73]">Current Property</span>
          <p className="font-serif font-bold text-sm text-[#1A2E35]">The Grand Bahamian (Cable Beach)</p>
        </div>
        <div className="h-8 w-px bg-[#DCE5E1]" />
        <div className="flex items-center gap-2 text-xs text-[#5C6B73]">
          <Sun className="w-4 h-4 text-[#E07A5F]" />
          <span>Nassau: <strong>82°F (28°C)</strong> • Sunny Seas</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Currency Dual Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2F5] text-[#006B7D] text-xs font-medium border border-[#006B7D]/20">
          <DollarSign className="w-3.5 h-3.5" />
          <span>USD 1.00 = BSD 1.00 (At Parity)</span>
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-full hover:bg-[#F0F4F2] text-[#5C6B73] relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E07A5F]" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#DCE5E1]">
          <div className="w-8 h-8 rounded-full bg-[#1A2E35] text-white flex items-center justify-center font-serif text-xs font-bold">
            GM
          </div>
          <div className="text-left text-xs">
            <p className="font-semibold text-[#1A2E35]">Julian Sterling</p>
            <p className="text-[10px] text-[#5C6B73]">Duty Manager / GM</p>
          </div>
        </div>
      </div>
    </header>
  );
}
