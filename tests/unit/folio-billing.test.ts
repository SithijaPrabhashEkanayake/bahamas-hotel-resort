import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyRoomChargeEligibility,
  postFolioItem,
  settleFolioMultiTender,
  RoomOccupantRecord,
} from '../../src/lib/engines/folio-billing';
import { GuestFolio } from '../../src/types';

describe('Guest Folio & Outlet Room Charge Engine', () => {
  const mockInHouseGuests: RoomOccupantRecord[] = [
    {
      roomId: 'room-301',
      roomNumber: '301',
      guestId: 'guest-101',
      firstName: 'Jonathan',
      lastName: 'Vanderbilt',
      bookingId: 'bk-5001',
      status: 'checked_in',
    },
    {
      roomId: 'room-302',
      roomNumber: '302',
      guestId: 'guest-102',
      firstName: 'Sophia',
      lastName: 'Sterling',
      bookingId: 'bk-5002',
      status: 'confirmed', // Not checked in yet
    },
  ];

  test('Room Charge Verification: approves matching in-house guest surname', () => {
    const check = verifyRoomChargeEligibility({
      roomNumber: '301',
      guestSurname: 'vanderbilt', // Case-insensitive
      inHouseGuests: mockInHouseGuests,
    });

    assert.equal(check.isEligible, true);
    assert.equal(check.occupant?.guestId, 'guest-101');
  });

  test('Room Charge Verification: rejects when surname does not match', () => {
    const check = verifyRoomChargeEligibility({
      roomNumber: '301',
      guestSurname: 'Smith',
      inHouseGuests: mockInHouseGuests,
    });

    assert.equal(check.isEligible, false);
    assert.equal(check.rejectionReason, 'surname_mismatch');
  });

  test('Room Charge Verification: rejects when guest is not in-house (e.g. only confirmed)', () => {
    const check = verifyRoomChargeEligibility({
      roomNumber: '302',
      guestSurname: 'Sterling',
      inHouseGuests: mockInHouseGuests,
    });

    assert.equal(check.isEligible, false);
    assert.equal(check.rejectionReason, 'guest_not_in_house');
  });

  test('Posting charges to folio recalculates taxes and balance due', () => {
    const initialFolio: GuestFolio = {
      id: 'fol-100',
      folio_number: 'FOL-2026-001',
      booking_id: 'bk-5001',
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

    // 1. Post Lodging charge: $1,000.00 (100,000 cents) -> 10% VAT ($100), 10% Service ($100), 10% Levy ($100) = $1,300.00
    const withLodging = postFolioItem({
      folio: initialFolio,
      category: 'lodging',
      description: 'Oceanfront Villa Night 1',
      preTaxCents: 100000,
      postedBy: 'system',
    });

    assert.equal(withLodging.items.length, 1);
    assert.equal(withLodging.grand_total_cents, 130000);
    assert.equal(withLodging.balance_due_cents, 130000);
    assert.equal(withLodging.total_hotel_levy_cents, 10000);

    // 2. Post F&B charge: $200.00 (20,000 cents) -> 10% VAT ($20), 10% Service ($20), No Levy = $240.00
    const withDining = postFolioItem({
      folio: withLodging,
      category: 'fnb',
      description: 'Sunset Pier Dinner for Two',
      preTaxCents: 20000,
      postedBy: 'pos_terminal_1',
    });

    assert.equal(withDining.items.length, 2);
    assert.equal(withDining.grand_total_cents, 154000); // $1,300 + $240 = $1,540.00
    assert.equal(withDining.balance_due_cents, 154000);
    assert.equal(withDining.total_vat_cents, 12000); // $100 + $20
    assert.equal(withDining.total_service_charge_cents, 12000); // $100 + $20
    assert.equal(withDining.total_hotel_levy_cents, 10000); // $100
  });

  test('Multi-tender folio settlement preserves exact cents and transitions status', () => {
    const folioWithBalance: GuestFolio = {
      id: 'fol-200',
      folio_number: 'FOL-2026-002',
      booking_id: 'bk-5001',
      type: 'room_master',
      status: 'active',
      total_pre_tax_cents: 100000,
      total_vat_cents: 10000,
      total_service_charge_cents: 10000,
      total_hotel_levy_cents: 10000,
      grand_total_cents: 130000, // $1,300.00 due
      total_paid_cents: 0,
      balance_due_cents: 130000,
      items: [],
      payments: [],
      created_at: new Date().toISOString(),
    };

    // Split settlement: $300 cash USD, remainder 50/50 credit card and wire
    const settlement = settleFolioMultiTender({
      folio: folioWithBalance,
      tenders: [
        { tenderId: 't1', method: 'cash_usd', fixedCents: 30000 },
        { tenderId: 't2', method: 'credit_card', percentage: 50 },
        { tenderId: 't3', method: 'wire_transfer', percentage: 50 },
      ],
    });

    assert.equal(settlement.isFullySettled, true);
    assert.equal(settlement.updatedFolio.balance_due_cents, 0);
    assert.equal(settlement.updatedFolio.total_paid_cents, 130000);
    assert.equal(settlement.updatedFolio.status, 'settled');
    assert.equal(settlement.allocatedPayments.length, 3);
    assert.equal(settlement.allocatedPayments[0].amount_cents, 30000);
    assert.equal(settlement.allocatedPayments[1].amount_cents, 50000);
    assert.equal(settlement.allocatedPayments[2].amount_cents, 50000);
  });
});
