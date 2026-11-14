'use client';

import React, { useState } from 'react';
import {
  Compass,
  Crown,
  Anchor,
  UserCheck,
  Sparkles,
  Calendar,
  Heart,
  CheckCircle2,
  Ship,
} from 'lucide-react';
import { INITIAL_GUESTS } from '@/lib/data/mock-resort-data';
import { GuestProfile } from '@/types';

export default function ConciergePage() {
  const [guests, setGuests] = useState<GuestProfile[]>(INITIAL_GUESTS);
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(INITIAL_GUESTS[0]);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const luxuryExcursions = [
    {
      id: 'exc-1',
      title: 'Private 55ft Sunseeker Yacht Charter',
      duration: 'Full Day (8 Hours)',
      rateCents: 450000, // $4,500.00
      description: 'Private captain and steward sailing through the turquoise Exuma Cays with snorkeling at sunken plane wrecks.',
    },
    {
      id: 'exc-2',
      title: 'Exuma Swimming Pigs & Sandbar Seaplane',
      duration: 'Half Day (4 Hours)',
      rateCents: 180000, // $1,800.00
      description: 'Exclusive amphibious seaplane landing directly on uninhabited sandbars with private swimming pigs encounter.',
    },
    {
      id: 'exc-3',
      title: 'Harbour Island Pink Sands & Dune Buggy Tour',
      duration: 'Full Day',
      rateCents: 220000, // $2,200.00
      description: 'Fast catamaran ferry to Dunmore Town, pink sand beach cabana, and vintage pastel dune buggy.',
    },
  ];

  const handleBookExcursion = (title: string) => {
    if (!selectedGuest) return;
    setBookingSuccess(`Booked "${title}" for ${selectedGuest.first_name} ${selectedGuest.last_name}! Charges routed to room folio.`);
    setTimeout(() => setBookingSuccess(null), 3000);
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#006B7D]">
            <Compass className="w-4 h-4" />
            <span>Guest CRM 360 & Private Island Experiences</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A2E35]">VIP Concierge & Yacht Port</h2>
          <p className="text-xs text-[#5C6B73]">
            Sovereign guest dossiers, stay histories, personalized preferences, and private yacht charters.
          </p>
        </div>
      </div>

      {bookingSuccess && (
        <div className="p-4 rounded-lg bg-[#EAF5EC] border border-[#2D6A4F]/30 text-xs text-[#2D6A4F] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {/* Grid: Guest Dossier & Excursion Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: VIP Guest Directory */}
        <div className="space-y-4">
          <h3 className="font-serif text-base font-bold text-[#1A2E35]">VIP Sovereign Registry</h3>
          <div className="space-y-3">
            {guests.map((g) => {
              const isSelected = selectedGuest?.id === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGuest(g)}
                  className={`luxury-card p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-[#006B7D] ring-2 ring-[#006B7D]/20 bg-[#F8FAF8]' : 'hover:border-[#DCE5E1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-[#1A2E35]">
                      {g.first_name} {g.last_name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        g.vip_tier === 'platinum_sovereign'
                          ? 'bg-[#F9F4EA] text-[#C5A059] border border-[#C5A059]'
                          : g.vip_tier === 'emerald'
                          ? 'bg-[#E0F2F5] text-[#006B7D] border border-[#006B7D]'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {g.vip_tier.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-[#5C6B73] flex justify-between">
                    <span>{g.nationality} • {g.total_stays} Stays</span>
                    <span className="font-mono font-bold text-[#1A2E35]">
                      {formatCurrency(g.lifetime_spend_cents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center & Right Cols: Selected Guest 360 Dossier & Yacht Booking */}
        {selectedGuest && (
          <div className="lg:col-span-2 space-y-6">
            {/* Dossier Card */}
            <div className="luxury-card p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-[#DCE5E1] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#C5A059]" />
                    <h3 className="font-serif text-xl font-bold text-[#1A2E35]">
                      {selectedGuest.first_name} {selectedGuest.last_name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#5C6B73] mt-1">
                    Passport: <strong>{selectedGuest.passport_number}</strong> • Contact: <strong>{selectedGuest.email}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#5C6B73]">Lifetime Resort Spend</span>
                  <p className="font-mono text-xl font-bold text-[#006B7D]">
                    {formatCurrency(selectedGuest.lifetime_spend_cents)}
                  </p>
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1] space-y-2">
                  <span className="font-semibold text-[#1A2E35] flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-[#E07A5F]" />
                    <span>Personalized Stay Preferences</span>
                  </span>
                  <ul className="space-y-1 text-[#5C6B73] text-[11px]">
                    <li>• Pillow: <strong>{selectedGuest.preferences.pillow_type || 'Standard Down'}</strong></li>
                    <li>• Dietary: <strong>{selectedGuest.preferences.dietary?.join(', ') || 'No restrictions'}</strong></li>
                    <li>• Champagne Welcome: <strong>{selectedGuest.preferences.champagne_welcome ? 'Yes (Dom Pérignon)' : 'No'}</strong></li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1] space-y-2">
                  <span className="font-semibold text-[#1A2E35] flex items-center gap-1.5">
                    <Anchor className="w-3.5 h-3.5 text-[#006B7D]" />
                    <span>VIP Concierge Host Assignment</span>
                  </span>
                  <p className="text-[11px] text-[#5C6B73]">
                    Chief Concierge Host <strong>Marcus Deveaux</strong> assigned for stay duration. Direct line: +1 (242) 555-EXUMA.
                  </p>
                </div>
              </div>
            </div>

            {/* Excursion Booking Shelf */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-[#006B7D]" />
                <h3 className="font-serif text-lg font-bold text-[#1A2E35]">
                  Private Yacht Charters & Island Excursions
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {luxuryExcursions.map((exc) => (
                  <div key={exc.id} className="luxury-card p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#006B7D]">{exc.duration}</span>
                      <h4 className="font-serif font-bold text-sm text-[#1A2E35] mt-1">{exc.title}</h4>
                      <p className="text-[11px] text-[#5C6B73] mt-1.5">{exc.description}</p>
                    </div>

                    <div className="pt-3 border-t border-[#DCE5E1] flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-[#1A2E35]">
                        {formatCurrency(exc.rateCents)}
                      </span>
                      <button
                        onClick={() => handleBookExcursion(exc.title)}
                        className="px-2.5 py-1 rounded bg-[#006B7D] hover:bg-[#004B57] text-white text-[11px] font-semibold transition-all shadow-sm"
                      >
                        Book Charter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
