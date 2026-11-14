/**
 * Guest Folio & Outlet Room Charge Engine
 * Purpose:
 * - Room folio line item aggregation and tax routing
 * - F&B POS Room Charge validation (Strict Room Number + Guest Surname match)
 * - Multi-tender settlement & balance verification
 */

import { GuestFolio, FolioItem, FolioPayment, PaymentMethod } from '@/types';
import { calculateLodgingTaxes, calculateNonLodgingTaxes, splitTenderPreservePennies, AllocatedTender } from './tax-billing';

export interface RoomOccupantRecord {
  roomId: string;
  roomNumber: string;
  guestId: string;
  firstName: string;
  lastName: string;
  bookingId: string;
  status: 'checked_in' | 'confirmed' | 'checked_out';
}

/**
 * Validates whether an F&B / Spa / Outlet charge can be posted to a room folio.
 * Mandate: Guest must be 'checked_in' and the surname must match case-insensitively.
 */
export function verifyRoomChargeEligibility(params: {
  roomNumber: string;
  guestSurname: string;
  inHouseGuests: RoomOccupantRecord[];
}): {
  isEligible: boolean;
  occupant?: RoomOccupantRecord;
  rejectionReason?: 'room_not_found' | 'guest_not_in_house' | 'surname_mismatch';
} {
  const { roomNumber, guestSurname, inHouseGuests } = params;

  const roomMatches = inHouseGuests.filter(
    (g) => g.roomNumber.trim().toUpperCase() === roomNumber.trim().toUpperCase()
  );

  if (roomMatches.length === 0) {
    return { isEligible: false, rejectionReason: 'room_not_found' };
  }

  const activeInHouse = roomMatches.find((g) => g.status === 'checked_in');
  if (!activeInHouse) {
    return { isEligible: false, rejectionReason: 'guest_not_in_house' };
  }

  const normalizedInput = guestSurname.trim().toLowerCase();
  const normalizedSurname = activeInHouse.lastName.trim().toLowerCase();

  if (normalizedInput !== normalizedSurname) {
    return { isEligible: false, rejectionReason: 'surname_mismatch' };
  }

  return { isEligible: true, occupant: activeInHouse };
}

/**
 * Posts an item to an active guest folio and recalculates statutory taxes and total balances.
 */
export function postFolioItem(params: {
  folio: GuestFolio;
  category: 'lodging' | 'fnb' | 'spa' | 'excursion' | 'cabana' | 'incidentals';
  description: string;
  preTaxCents: number;
  postedBy: string;
  currency?: 'USD' | 'BSD';
}): GuestFolio {
  const { folio, category, description, preTaxCents, postedBy, currency = 'USD' } = params;

  if (folio.status === 'closed') {
    throw new Error('Cannot post charges to a closed folio');
  }

  const taxes = category === 'lodging'
    ? calculateLodgingTaxes(preTaxCents)
    : calculateNonLodgingTaxes(preTaxCents, category);

  const newItem: FolioItem = {
    id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    folio_id: folio.id,
    category,
    description,
    pre_tax_amount_cents: preTaxCents,
    vat_amount_cents: taxes.vatCents,
    service_charge_cents: taxes.serviceChargeCents,
    hotel_levy_cents: taxes.hotelLevyCents,
    total_amount_cents: taxes.totalCents,
    currency,
    posted_by: postedBy,
    created_at: new Date().toISOString(),
  };

  const updatedItems = [...folio.items, newItem];
  const total_pre_tax_cents = updatedItems.reduce((sum, i) => sum + i.pre_tax_amount_cents, 0);
  const total_vat_cents = updatedItems.reduce((sum, i) => sum + i.vat_amount_cents, 0);
  const total_service_charge_cents = updatedItems.reduce((sum, i) => sum + i.service_charge_cents, 0);
  const total_hotel_levy_cents = updatedItems.reduce((sum, i) => sum + i.hotel_levy_cents, 0);
  const grand_total_cents = updatedItems.reduce((sum, i) => sum + i.total_amount_cents, 0);
  const balance_due_cents = grand_total_cents - folio.total_paid_cents;

  return {
    ...folio,
    items: updatedItems,
    total_pre_tax_cents,
    total_vat_cents,
    total_service_charge_cents,
    total_hotel_levy_cents,
    grand_total_cents,
    balance_due_cents,
  };
}

/**
 * Applies multi-tender payments to a folio using the Odd-Penny Preservation algorithm.
 */
export function settleFolioMultiTender(params: {
  folio: GuestFolio;
  tenders: {
    tenderId: string;
    method: PaymentMethod;
    fixedCents?: number;
    percentage?: number;
    referenceNumber?: string;
  }[];
}): {
  updatedFolio: GuestFolio;
  allocatedPayments: FolioPayment[];
  isFullySettled: boolean;
} {
  const { folio, tenders } = params;

  if (folio.balance_due_cents <= 0) {
    throw new Error('Folio has no outstanding balance to settle');
  }

  const splitResult = splitTenderPreservePennies(
    folio.balance_due_cents,
    tenders.map((t) => ({
      tenderId: t.tenderId,
      method: t.method as any,
      fixedCents: t.fixedCents,
      percentage: t.percentage,
    }))
  );

  const allocatedPayments: FolioPayment[] = splitResult.allocatedTenders.map((t, idx) => ({
    id: `pay-${Date.now()}-${idx}`,
    folio_id: folio.id,
    payment_method: t.method as PaymentMethod,
    amount_cents: t.allocatedCents,
    currency: t.currency,
    exchange_rate: 1.0,
    reference_number: tenders[idx]?.referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
    processed_at: new Date().toISOString(),
  }));

  const updatedPayments = [...folio.payments, ...allocatedPayments];
  const total_paid_cents = updatedPayments.reduce((sum, p) => sum + p.amount_cents, 0);
  const balance_due_cents = folio.grand_total_cents - total_paid_cents;
  const isFullySettled = balance_due_cents === 0;

  const updatedFolio: GuestFolio = {
    ...folio,
    payments: updatedPayments,
    total_paid_cents,
    balance_due_cents,
    status: isFullySettled ? 'settled' : folio.status,
  };

  return {
    updatedFolio,
    allocatedPayments,
    isFullySettled,
  };
}
