import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_FOLIOS, INITIAL_BOOKINGS, INITIAL_GUESTS, INITIAL_ROOMS } from '@/lib/data/mock-resort-data';
import { settleFolioMultiTender } from '@/lib/engines/folio-billing';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const folio = INITIAL_FOLIOS.find((f) => f.id === params.id || f.folio_number === params.id);
  if (!folio) {
    return NextResponse.json({ error: 'Folio not found' }, { status: 404 });
  }

  const booking = INITIAL_BOOKINGS.find((b) => b.id === folio.booking_id);
  const guest = booking ? INITIAL_GUESTS.find((g) => g.id === booking.guest_id) : undefined;
  const room = booking ? INITIAL_ROOMS.find((r) => r.id === booking.room_id) : undefined;

  return NextResponse.json({
    data: {
      ...folio,
      booking: booking ? { ...booking, guest, room } : undefined,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const folio = INITIAL_FOLIOS.find((f) => f.id === params.id || f.folio_number === params.id);
    if (!folio) {
      return NextResponse.json({ error: 'Folio not found' }, { status: 404 });
    }

    const body = await req.json();
    const { tenders } = body;

    if (!tenders || !Array.isArray(tenders) || tenders.length === 0) {
      return NextResponse.json({ error: 'At least one payment tender is required' }, { status: 400 });
    }

    const result = settleFolioMultiTender({
      folio,
      tenders,
    });

    const index = INITIAL_FOLIOS.findIndex((f) => f.id === folio.id);
    if (index !== -1) {
      INITIAL_FOLIOS[index] = result.updatedFolio;
    }

    return NextResponse.json({
      data: {
        success: true,
        folio: result.updatedFolio,
        allocated_payments: result.allocatedPayments,
        is_fully_settled: result.isFullySettled,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
