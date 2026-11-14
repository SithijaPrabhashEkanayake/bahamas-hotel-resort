'use client';

import React, { useEffect, useState } from 'react';
import {
  BookmarkCheck,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';

interface BookingRecord {
  id: string;
  booking_reference: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  adults: number;
  status: string;
  rate_per_night_cents: number;
  total_lodging_cents: number;
  hold_expires_at?: string | null;
  guest?: {
    first_name: string;
    last_name: string;
    vip_tier: string;
    nationality: string;
  };
  room?: {
    room_number: string;
    wing: string;
    category?: {
      name: string;
    };
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [roomId, setRoomId] = useState('rm-202');
  const [checkInDate, setCheckInDate] = useState('2026-12-01');
  const [checkOutDate, setCheckOutDate] = useState('2026-12-05');
  const [adults, setAdults] = useState(2);
  const [isHoldOnly, setIsHoldOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBookings = () => {
    fetch('/api/v1/bookings')
      .then((res) => res.json())
      .then((json) => {
        setBookings(json.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load bookings', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          checkInDate,
          checkOutDate,
          adults,
          isHoldOnly,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setFormError(json.error || 'Failed to create booking');
        setSubmitting(false);
        return;
      }

      setFormSuccess(`Reservation ${json.data.booking.booking_reference} confirmed successfully!`);
      setSubmitting(false);
      fetchBookings();
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Network error');
      setSubmitting(false);
    }
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
            <BookmarkCheck className="w-4 h-4" />
            <span>Dynamic Caribbean Yield & Reservations</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A2E35]">Resort Reservation Registry</h2>
          <p className="text-xs text-[#5C6B73]">
            15-minute checkout cart locking, collision prevention, and statutory tax tracking.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#006B7D] hover:bg-[#004B57] text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Bookings Table */}
      <div className="luxury-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F0F4F2] text-[#5C6B73] font-semibold border-b border-[#DCE5E1] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Guest</th>
                <th className="py-3 px-4">Room & Wing</th>
                <th className="py-3 px-4">Stay Dates</th>
                <th className="py-3 px-4">Nightly Rate</th>
                <th className="py-3 px-4">Net Lodging</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E1]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5C6B73]">
                    Loading reservations...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5C6B73]">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F8FAF8] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#006B7D]">
                      {b.booking_reference}
                    </td>
                    <td className="py-3 px-4">
                      {b.guest ? (
                        <div>
                          <span className="font-semibold text-[#1A2E35]">
                            {b.guest.first_name} {b.guest.last_name}
                          </span>
                          <span className="block text-[10px] text-[#5C6B73] uppercase">
                            {b.guest.vip_tier.replace('_', ' ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#5C6B73] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#1A2E35]">
                        {b.room?.room_number || 'Room pending'}
                      </span>
                      <span className="block text-[10px] text-[#5C6B73]">{b.room?.wing}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#1A2E35]">
                        {b.check_in_date} → {b.check_out_date}
                      </span>
                      <span className="block text-[10px] text-[#5C6B73]">
                        {b.nights} Nights • {b.adults} Adults
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {formatCurrency(b.rate_per_night_cents)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1A2E35]">
                      {formatCurrency(b.total_lodging_cents)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === 'checked_in'
                            ? 'bg-[#E0F2F5] text-[#006B7D] border border-[#006B7D]/30'
                            : b.status === 'confirmed'
                            ? 'bg-[#EAF5EC] text-[#2D6A4F] border border-[#2D6A4F]/30'
                            : b.status === 'pending_hold'
                            ? 'bg-amber-50 text-amber-700 border border-amber-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#DCE5E1]">
            <div className="flex items-start justify-between border-b border-[#DCE5E1] pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-[#006B7D]">Dynamic Yield Booking</span>
                <h3 className="font-serif text-xl font-bold text-[#1A2E35]">Create Resort Reservation</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#1A2E35] mb-1">Select Room & Villa:</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#DCE5E1] bg-white text-[#1A2E35]"
                >
                  <option value="rm-202">V-202: Oceanfront Presidential Villa ($2,200/nt base)</option>
                  <option value="rm-103">OW-103: Overwater Lagoon Bungalow ($1,650/nt base)</option>
                  <option value="rm-303">RC-303: Royal Palm Executive Suite ($1,100/nt base)</option>
                  <option value="rm-402">BC-402: Pink Sand Beachfront Cottage ($850/nt base)</option>
                  <option value="rm-502">GD-502: Gardenview Deluxe Verandah ($550/nt base)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A2E35] mb-1">Check-In Date:</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#DCE5E1]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2E35] mb-1">Check-Out Date:</label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#DCE5E1]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A2E35] mb-1">Adults:</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-[#DCE5E1]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="holdOnly"
                    checked={isHoldOnly}
                    onChange={(e) => setIsHoldOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-[#006B7D]"
                  />
                  <label htmlFor="holdOnly" className="font-semibold text-[#1A2E35] flex items-center gap-1 cursor-pointer">
                    <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>15m Cart Lock Only</span>
                  </label>
                </div>
              </div>

              {/* Tax Compliance Breakdown Box */}
              <div className="p-3.5 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1] space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-[#5C6B73]">
                  <span>Mandatory Resort Service Charge:</span>
                  <span className="font-mono font-semibold">10.0%</span>
                </div>
                <div className="flex items-center justify-between text-[#5C6B73]">
                  <span>Bahamas National Hotel Levy:</span>
                  <span className="font-mono font-semibold">10.0%</span>
                </div>
                <div className="flex items-center justify-between text-[#5C6B73]">
                  <span>Bahamas Value Added Tax (VAT):</span>
                  <span className="font-mono font-semibold">10.0%</span>
                </div>
                <div className="pt-1 border-t border-[#DCE5E1] flex items-center justify-between font-bold text-[#006B7D]">
                  <span>Effective Statutory Tax Assessment:</span>
                  <span className="font-mono">30.0% on Net Lodging</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#DCE5E1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#DCE5E1] text-[#5C6B73] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#006B7D] hover:bg-[#004B57] text-white font-semibold transition-all shadow-sm"
                >
                  {submitting ? 'Checking Collision...' : isHoldOnly ? 'Lock 15m Hold' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
