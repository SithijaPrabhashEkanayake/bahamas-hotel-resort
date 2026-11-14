import { NextRequest, NextResponse } from 'next/server';
import {
  INITIAL_BOOKINGS,
  INITIAL_ROOMS,
  INITIAL_GUESTS,
  INITIAL_ROOM_CATEGORIES,
  INITIAL_MAINTENANCE_TICKETS,
} from '@/lib/data/mock-resort-data';
import {
  checkRoomCollision,
  calculateDynamicYieldRate,
  generateCartHoldExpiry,
} from '@/lib/engines/room-collision';
import { calculateLodgingTaxes } from '@/lib/engines/tax-billing';
import { Booking } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status');

  let results = [...INITIAL_BOOKINGS];
  if (statusFilter) {
    results = results.filter((b) => b.status === statusFilter);
  }

  const enriched = results.map((b) => {
    const guest = INITIAL_GUESTS.find((g) => g.id === b.guest_id);
    const room = INITIAL_ROOMS.find((r) => r.id === b.room_id);
    const category = room ? INITIAL_ROOM_CATEGORIES.find((c) => c.id === room.category_id) : undefined;

    return {
      ...b,
      guest,
      room: room ? { ...room, category } : undefined,
    };
  });

  return NextResponse.json({ data: enriched });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomId,
      guestId,
      checkInDate,
      checkOutDate,
      adults = 2,
      children = 0,
      isHoldOnly = false,
    } = body;

    if (!roomId || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'Missing required booking parameters: roomId, checkInDate, checkOutDate' },
        { status: 400 }
      );
    }

    const room = INITIAL_ROOMS.find((r) => r.id === roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const category = INITIAL_ROOM_CATEGORIES.find((c) => c.id === room.category_id);
    const baseRateCents = category ? category.base_rate_cents : 100000;

    // Check Collision
    const collisionCheck = checkRoomCollision({
      roomId,
      proposedCheckIn: checkInDate,
      proposedCheckOut: checkOutDate,
      existingBookings: INITIAL_BOOKINGS.map((b) => ({
        id: b.id,
        roomId: b.room_id,
        checkInDate: b.check_in_date,
        checkOutDate: b.check_out_date,
        status: b.status,
        holdExpiresAt: b.hold_expires_at,
      })),
      maintenanceBlocks: INITIAL_MAINTENANCE_TICKETS.map((m) => ({
        id: m.id,
        roomId: m.room_id,
        startDate: m.created_at.split('T')[0],
        endDate: '2026-12-31',
        causesOOO: m.causes_ooo,
      })),
    });

    if (collisionCheck.hasCollision) {
      return NextResponse.json(
        {
          error: 'Room collision detected',
          reason: collisionCheck.reason,
          conflictingRecordId: collisionCheck.conflictingRecordId,
        },
        { status: 409 }
      );
    }

    // Dynamic Yield & Taxes
    const yieldRate = calculateDynamicYieldRate({
      baseRateCents,
      checkInDate,
      checkOutDate,
    });

    const taxes = calculateLodgingTaxes(yieldRate.totalLodgingCents);

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      booking_reference: `BAH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      guest_id: guestId || 'gst-1',
      room_id: roomId,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      nights: yieldRate.nights,
      adults: Number(adults),
      children: Number(children),
      status: isHoldOnly ? 'pending_hold' : 'confirmed',
      rate_per_night_cents: yieldRate.adjustedRatePerNightCents,
      total_lodging_cents: yieldRate.totalLodgingCents,
      hold_expires_at: isHoldOnly ? generateCartHoldExpiry(15) : null,
      created_at: new Date().toISOString(),
    };

    INITIAL_BOOKINGS.push(newBooking);

    return NextResponse.json(
      {
        data: {
          booking: newBooking,
          pricing: {
            season: yieldRate.season,
            rate_per_night_cents: yieldRate.adjustedRatePerNightCents,
            total_pre_tax_cents: taxes.preTaxCents,
            vat_cents: taxes.vatCents,
            service_charge_cents: taxes.serviceChargeCents,
            hotel_levy_cents: taxes.hotelLevyCents,
            grand_total_cents: taxes.totalCents,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
