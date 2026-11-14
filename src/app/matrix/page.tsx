'use client';

import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Filter,
  Eye,
  Wrench,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Palmtree,
  CheckCircle,
} from 'lucide-react';

interface MatrixRoom {
  id: string;
  room_number: string;
  floor: number;
  wing: string;
  status: string;
  notes?: string;
  category?: {
    name: string;
    tier: string;
    base_rate_cents: number;
    amenities: string[];
  };
  active_booking?: {
    booking_reference: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
  } | null;
}

export default function RoomMatrixPage() {
  const [rooms, setRooms] = useState<MatrixRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWing, setSelectedWing] = useState('All');
  const [selectedRoom, setSelectedRoom] = useState<MatrixRoom | null>(null);

  useEffect(() => {
    fetch('/api/v1/matrix')
      .then((res) => res.json())
      .then((json) => {
        setRooms(json.data.rooms);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load matrix', err);
        setLoading(false);
      });
  }, []);

  const wings = ['All', 'Overwater Pier', 'East Oceanfront', 'Royal Cays', 'West Lagoon'];

  const filteredRooms = selectedWing === 'All'
    ? rooms
    : rooms.filter((r) => r.wing === selectedWing);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'vip_in_house':
        return { label: 'VIP In-House', bg: 'bg-[#F9F4EA] text-[#C5A059] border-[#C5A059]' };
      case 'occupied_clean':
        return { label: 'Occupied Clean', bg: 'bg-[#E0F2F5] text-[#006B7D] border-[#006B7D]' };
      case 'occupied_dirty':
        return { label: 'Occupied Dirty', bg: 'bg-[#F7DBD3] text-[#E07A5F] border-[#E07A5F]' };
      case 'vacant_clean':
        return { label: 'Vacant Clean', bg: 'bg-[#EAF5EC] text-[#2D6A4F] border-[#2D6A4F]' };
      case 'vacant_dirty':
        return { label: 'Vacant Dirty', bg: 'bg-[#F4EDE0] text-[#848C56] border-[#848C56]' };
      case 'out_of_order':
        return { label: 'Out of Order', bg: 'bg-red-50 text-red-700 border-red-500' };
      default:
        return { label: status, bg: 'bg-gray-100 text-gray-700 border-gray-400' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#006B7D]">
            <CalendarDays className="w-4 h-4" />
            <span>Interactive Front Desk Room Matrix</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A2E35]">Resort Tape Chart & Room Canvas</h2>
          <p className="text-xs text-[#5C6B73]">
            Live operational canvas tracking room states, in-house guests, and turnover triage.
          </p>
        </div>

        {/* Wing Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {wings.map((wing) => (
            <button
              key={wing}
              onClick={() => setSelectedWing(wing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                selectedWing === wing
                  ? 'bg-[#1A2E35] text-white border-[#1A2E35] shadow-sm'
                  : 'bg-white text-[#5C6B73] border-[#DCE5E1] hover:bg-[#F0F4F2]'
              }`}
            >
              {wing}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-lg bg-white border border-[#DCE5E1] text-xs">
        <span className="font-semibold text-[#1A2E35]">Status Legend:</span>
        <span className="px-2 py-0.5 rounded border text-[11px] font-bold bg-[#F9F4EA] text-[#C5A059] border-[#C5A059]">
          VIP In-House
        </span>
        <span className="px-2 py-0.5 rounded border text-[11px] font-bold bg-[#E0F2F5] text-[#006B7D] border-[#006B7D]">
          Occupied Clean
        </span>
        <span className="px-2 py-0.5 rounded border text-[11px] font-bold bg-[#F7DBD3] text-[#E07A5F] border-[#E07A5F]">
          Occupied Dirty
        </span>
        <span className="px-2 py-0.5 rounded border text-[11px] font-bold bg-[#EAF5EC] text-[#2D6A4F] border-[#2D6A4F]">
          Vacant Clean
        </span>
        <span className="px-2 py-0.5 rounded border text-[11px] font-bold bg-[#F4EDE0] text-[#848C56] border-[#848C56]">
          Vacant Dirty
        </span>
        <span className="px-2 py-0.5 rounded border text-[11px] font-bold bg-red-50 text-red-700 border-red-500">
          Out of Order (OOO)
        </span>
      </div>

      {/* 2D Room Grid Canvas */}
      {loading ? (
        <div className="p-12 text-center text-[#5C6B73]">Loading Resort Room Matrix...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredRooms.map((room) => {
            const badge = getStatusBadge(room.status);
            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className="luxury-card p-4 cursor-pointer hover:border-[#006B7D] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif font-bold text-lg text-[#1A2E35]">{room.room_number}</span>
                    <span className="text-[10px] uppercase font-bold text-[#5C6B73]">{room.wing}</span>
                  </div>
                  <p className="text-xs font-medium text-[#1A2E35] line-clamp-1">{room.category?.name}</p>
                  <p className="text-[11px] text-[#5C6B73] mt-0.5">Floor {room.floor}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#DCE5E1] flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${badge.bg}`}>
                    {badge.label}
                  </span>
                  {room.active_booking && (
                    <span className="text-[10px] font-mono text-[#006B7D] font-semibold">In-House</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Room Details Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#DCE5E1]">
            <div className="flex items-start justify-between border-b border-[#DCE5E1] pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-[#006B7D]">{selectedRoom.wing}</span>
                <h3 className="font-serif text-xl font-bold text-[#1A2E35]">
                  Room {selectedRoom.room_number} — {selectedRoom.category?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1]">
                <span className="text-[#5C6B73]">Current Status:</span>
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getStatusBadge(selectedRoom.status).bg}`}>
                  {getStatusBadge(selectedRoom.status).label}
                </span>
              </div>

              {selectedRoom.notes && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  <strong className="block font-semibold mb-0.5">Engineering Maintenance Note:</strong>
                  {selectedRoom.notes}
                </div>
              )}

              {selectedRoom.active_booking ? (
                <div className="p-3.5 rounded-lg bg-[#E0F2F5]/60 border border-[#006B7D]/20 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#006B7D]">Active Reservation</span>
                    <span className="font-mono text-[#1A2E35] font-semibold">
                      {selectedRoom.active_booking.booking_reference}
                    </span>
                  </div>
                  <div className="text-[#5C6B73]">
                    Stay: <strong>{selectedRoom.active_booking.check_in_date}</strong> to{' '}
                    <strong>{selectedRoom.active_booking.check_out_date}</strong>
                  </div>
                  <div className="text-[#5C6B73]">
                    Occupancy: <strong>{selectedRoom.active_booking.adults} Adults</strong>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-[#5C6B73] text-center">
                  No active booking for today. Available for reservation.
                </div>
              )}

              {/* Amenities */}
              <div>
                <span className="text-xs font-semibold text-[#5C6B73] block mb-1">Key Villa Amenities:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRoom.category?.amenities.map((amenity, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[#F0F4F2] text-[#1A2E35] text-[11px] font-medium">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCE5E1] flex justify-end gap-2">
              <button
                onClick={() => setSelectedRoom(null)}
                className="px-4 py-2 rounded-lg bg-[#1A2E35] text-white text-xs font-semibold hover:bg-[#2C4852]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
