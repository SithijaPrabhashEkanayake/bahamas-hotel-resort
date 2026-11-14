'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  BedDouble,
  DollarSign,
  Users,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
} from 'lucide-react';
import { RevPARReport } from '@/types';

export default function DashboardPage() {
  const [report, setReport] = useState<RevPARReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/reports/revpar')
      .then((res) => res.json())
      .then((json) => {
        setReport(json.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch KPI report', err);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-[#1A2E35] to-[#006B7D] text-white shadow-card">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C5A059] mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Executive Management Cockpit</span>
          </div>
          <h2 className="font-serif text-2xl font-bold">The Grand Bahamian Resort & Reserve</h2>
          <p className="text-sm text-[#A4B1B8] mt-1">
            Real-time operations, RevPAR metrics, and statutory Bahamian tax management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/matrix"
            className="px-4 py-2.5 rounded-lg bg-[#C5A059] hover:bg-[#DBC188] text-[#1A2E35] font-semibold text-sm transition-all shadow-md flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Open Room Matrix</span>
          </Link>
          <Link
            href="/bookings"
            className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/20 flex items-center gap-2"
          >
            <span>New Reservation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between text-[#5C6B73] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Occupancy (OCC%)</span>
            <div className="w-8 h-8 rounded-full bg-[#E0F2F5] flex items-center justify-center text-[#006B7D]">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#1A2E35]">
              {loading ? '...' : `${report?.occupancy_rate_pct.toFixed(1)}%`}
            </span>
            <span className="text-xs text-[#006B7D] font-medium">
              {report?.occupied_rooms} / {report?.available_rooms} Rooms
            </span>
          </div>
          <p className="text-xs text-[#5C6B73] mt-2">
            Excludes {report?.out_of_order_rooms || 0} Out-of-Order rooms
          </p>
        </div>

        <div className="luxury-card p-6">
          <div className="flex items-center justify-between text-[#5C6B73] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Daily Rate (ADR)</span>
            <div className="w-8 h-8 rounded-full bg-[#F9F4EA] flex items-center justify-center text-[#C5A059]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#1A2E35]">
              {loading ? '...' : formatCurrency(report?.average_daily_rate_cents || 0)}
            </span>
            <span className="text-xs text-[#5C6B73]">/ night</span>
          </div>
          <p className="text-xs text-[#5C6B73] mt-2">Dynamic Caribbean yield applied</p>
        </div>

        <div className="luxury-card p-6">
          <div className="flex items-center justify-between text-[#5C6B73] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">RevPAR</span>
            <div className="w-8 h-8 rounded-full bg-[#E0F2F5] flex items-center justify-center text-[#006B7D]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#1A2E35]">
              {loading ? '...' : formatCurrency(report?.revenue_per_available_room_cents || 0)}
            </span>
            <span className="text-xs text-[#5C6B73]">/ avail room</span>
          </div>
          <p className="text-xs text-[#5C6B73] mt-2">Room Rev / Available Inventory</p>
        </div>

        <div className="luxury-card p-6">
          <div className="flex items-center justify-between text-[#5C6B73] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Resort RevPAR (TRevPAR)</span>
            <div className="w-8 h-8 rounded-full bg-[#F7DBD3] flex items-center justify-center text-[#E07A5F]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#1A2E35]">
              {loading ? '...' : formatCurrency(report?.trevpar_cents || 0)}
            </span>
            <span className="text-xs text-[#5C6B73]">all revenue</span>
          </div>
          <p className="text-xs text-[#5C6B73] mt-2">Includes F&B, Spa & Excursions</p>
        </div>
      </div>

      {/* Main Grid: Live Arrivals & Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: VIP In-House Highlights */}
        <div className="lg:col-span-2 luxury-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE5E1] pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A2E35]">VIP Sovereign Guests In-House</h3>
              <p className="text-xs text-[#5C6B73]">Active high-profile guest profiles with personalized itineraries</p>
            </div>
            <Link href="/concierge" className="text-xs font-semibold text-[#006B7D] hover:underline flex items-center gap-1">
              <span>View All CRM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1A2E35] text-[#C5A059] flex items-center justify-center font-serif font-bold text-sm">
                  SW
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1A2E35]">Sir Arthur Wellington</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F9F4EA] text-[#C5A059] border border-[#C5A059]/40 uppercase">
                      Platinum Sovereign
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6B73]">Villa V-201 • Oceanfront Presidential • Check-out Nov 18</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#006B7D]">Yacht Excursion Active</span>
                <p className="text-[11px] text-[#5C6B73]">Butler Assigned</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#006B7D] text-white flex items-center justify-center font-serif font-bold text-sm">
                  JV
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1A2E35]">Jonathan & Clarissa Vanderbilt</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E0F2F5] text-[#006B7D] border border-[#006B7D]/40 uppercase">
                      Emerald VIP
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6B73]">Bungalow OW-102 • Overwater Pier • Check-out Nov 17</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#C5A059]">Sunset Pier Dinner</span>
                <p className="text-[11px] text-[#5C6B73]">Table 1 Reserved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Operational Quick Status */}
        <div className="luxury-card p-6 space-y-4">
          <div className="border-b border-[#DCE5E1] pb-4">
            <h3 className="font-serif text-lg font-bold text-[#1A2E35]">Compliance & Status</h3>
            <p className="text-xs text-[#5C6B73]">Commonwealth of The Bahamas Regulatory Snapshot</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1]">
              <span className="text-[#5C6B73]">Statutory VAT (10%)</span>
              <span className="font-mono font-bold text-[#006B7D]">ACTIVE & CERTIFIED</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1]">
              <span className="text-[#5C6B73]">Resort Service Charge (10%)</span>
              <span className="font-mono font-bold text-[#006B7D]">POOLING ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1]">
              <span className="text-[#5C6B73]">Hotel Guest Levy (10%)</span>
              <span className="font-mono font-bold text-[#006B7D]">LODGING ASSESSED</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1]">
              <span className="text-[#5C6B73]">Currency Parity</span>
              <span className="font-mono font-bold text-[#C5A059]">USD 1.00 = BSD 1.00</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/reports"
              className="w-full py-2.5 rounded-lg bg-[#1A2E35] hover:bg-[#2C4852] text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              <span>Generate Daily Flash Audit Report</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
