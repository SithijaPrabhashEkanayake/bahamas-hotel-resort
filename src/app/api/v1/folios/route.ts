import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_FOLIOS, INITIAL_BOOKINGS, INITIAL_GUESTS, INITIAL_ROOMS } from '@/lib/data/mock-resort-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let results = [...INITIAL_FOLIOS];
  if (status) {
    results = results.filter((f) => f.status === status);
  }

  const enriched = results.map((f) => {
    const booking = INITIAL_BOOKINGS.find((b) => b.id === f.booking_id);
    const guest = booking ? INITIAL_GUESTS.find((g) => g.id === booking.guest_id) : undefined;
    const room = booking ? INITIAL_ROOMS.find((r) => r.id === booking.room_id) : undefined;

    return {
      ...f,
      booking: booking
        ? {
            ...booking,
            guest,
            room,
          }
        : undefined,
    };
  });

  return NextResponse.json({ data: enriched });
}
