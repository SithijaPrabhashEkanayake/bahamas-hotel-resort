import { NextRequest, NextResponse } from 'next/server';
import {
  INITIAL_ROOMS,
  INITIAL_GUESTS,
  INITIAL_BOOKINGS,
  INITIAL_FOLIOS,
} from '@/lib/data/mock-resort-data';
import { verifyRoomChargeEligibility, postFolioItem, RoomOccupantRecord } from '@/lib/engines/folio-billing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomNumber,
      guestSurname,
      outletName = 'Sunset Pier Restaurant',
      category = 'fnb',
      description,
      amountCents,
      serverName = 'Staff Cashier',
    } = body;

    if (!roomNumber || !guestSurname || !amountCents || !description) {
      return NextResponse.json(
        { error: 'Missing required charge parameters: roomNumber, guestSurname, amountCents, description' },
        { status: 400 }
      );
    }

    // Build current in-house guest roster
    const inHouseGuests: RoomOccupantRecord[] = [];
    for (const b of INITIAL_BOOKINGS) {
      const room = INITIAL_ROOMS.find((r) => r.id === b.room_id);
      const guest = INITIAL_GUESTS.find((g) => g.id === b.guest_id);
      if (room && guest) {
        inHouseGuests.push({
          roomId: room.id,
          roomNumber: room.room_number,
          guestId: guest.id,
          firstName: guest.first_name,
          lastName: guest.last_name,
          bookingId: b.id,
          status: b.status as any,
        });
      }
    }

    // Strict Verification: Room Number + Surname
    const verification = verifyRoomChargeEligibility({
      roomNumber,
      guestSurname,
      inHouseGuests,
    });

    if (!verification.isEligible) {
      return NextResponse.json(
        {
          error: 'Room charge verification failed',
          reason: verification.rejectionReason,
          message:
            verification.rejectionReason === 'surname_mismatch'
              ? 'Guest surname does not match registered occupant for this room.'
              : verification.rejectionReason === 'guest_not_in_house'
              ? 'Room is not currently occupied by a checked-in guest.'
              : 'Room number not found in resort registry.',
        },
        { status: 403 }
      );
    }

    const occupant = verification.occupant!;
    // Locate or create folio for this booking
    let folio = INITIAL_FOLIOS.find((f) => f.booking_id === occupant.bookingId);
    if (!folio) {
      folio = {
        id: `fol-${Date.now()}`,
        folio_number: `FOL-${Math.floor(1000 + Math.random() * 9000)}`,
        booking_id: occupant.bookingId,
        type: 'room_master',
        status: 'active',
        total_pre_tax_cents: 0,
        total_vat_cents: 0,
        total_service_charge_cents: 0,
        total_hotel_levy_cents: 0,
        grand_total_cents: 0,
        total_paid_cents: 0,
        balance_due_cents: 0,
        items: [],
        payments: [],
        created_at: new Date().toISOString(),
      };
      INITIAL_FOLIOS.push(folio);
    }

    // Post charge
    const updatedFolio = postFolioItem({
      folio,
      category,
      description: `${outletName}: ${description}`,
      preTaxCents: Number(amountCents),
      postedBy: serverName,
    });

    // Replace in repository
    const index = INITIAL_FOLIOS.findIndex((f) => f.id === folio!.id);
    if (index !== -1) {
      INITIAL_FOLIOS[index] = updatedFolio;
    }

    return NextResponse.json(
      {
        data: {
          success: true,
          receipt_number: `REC-${Date.now().toString().slice(-6)}`,
          room_number: occupant.roomNumber,
          guest_name: `${occupant.firstName} ${occupant.lastName}`,
          outlet_name: outletName,
          posted_item: updatedFolio.items[updatedFolio.items.length - 1],
          folio_balance_due_cents: updatedFolio.balance_due_cents,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
