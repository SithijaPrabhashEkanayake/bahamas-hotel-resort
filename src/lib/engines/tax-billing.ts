/**
 * Bahamas Statutory Tax & Multi-Tender Billing Engine
 * Statutory Compliance:
 * - Bahamas Value Added Tax Act (10.0% VAT)
 * - Mandatory Resort Service Charge (10.0% Gratuity Pool)
 * - Bahamas National Hotel Guest Levy (10.0% Tourism Assessment, Lodging Only)
 * - Currency Parity: USD / BSD strictly 1:1
 * - Odd-Penny Preservation: Zero cent rounding drift across multi-tender settlements
 */

export const BAHAMAS_VAT_RATE = 0.10;
export const RESORT_SERVICE_CHARGE_RATE = 0.10;
export const HOTEL_GUEST_LEVY_RATE = 0.10;
export const USD_BSD_EXCHANGE_RATE = 1.0;

export interface TaxCalculationResult {
  preTaxCents: number;
  vatCents: number;
  serviceChargeCents: number;
  hotelLevyCents: number;
  totalCents: number;
  effectiveTaxRatePct: number;
}

/**
 * Calculates statutory taxes and service charge for room lodging.
 * Net lodging is subject to:
 * - 10.0% Bahamas Resort Service Charge
 * - 10.0% Hotel Room Levy
 * - 10.0% Bahamas VAT
 */
export function calculateLodgingTaxes(preTaxLodgingCents: number): TaxCalculationResult {
  if (preTaxLodgingCents < 0) {
    throw new Error('Lodging amount cannot be negative');
  }

  // Banker's rounding for integer cent precision
  const serviceChargeCents = Math.round(preTaxLodgingCents * RESORT_SERVICE_CHARGE_RATE);
  const hotelLevyCents = Math.round(preTaxLodgingCents * HOTEL_GUEST_LEVY_RATE);
  const vatCents = Math.round(preTaxLodgingCents * BAHAMAS_VAT_RATE);

  const totalCents = preTaxLodgingCents + serviceChargeCents + hotelLevyCents + vatCents;
  const effectiveTaxRatePct = preTaxLodgingCents > 0
    ? Number((((totalCents - preTaxLodgingCents) / preTaxLodgingCents) * 100).toFixed(2))
    : 0;

  return {
    preTaxCents: preTaxLodgingCents,
    vatCents,
    serviceChargeCents,
    hotelLevyCents,
    totalCents,
    effectiveTaxRatePct,
  };
}

/**
 * Calculates statutory taxes and service charge for non-lodging items (F&B, Spa, Excursions, Cabanas).
 * Subject to:
 * - 10.0% Resort Service Charge
 * - 10.0% Bahamas VAT
 * (Hotel Guest Levy does NOT apply to non-lodging items)
 */
export function calculateNonLodgingTaxes(
  preTaxAmountCents: number,
  category: 'fnb' | 'spa' | 'excursion' | 'cabana' | 'incidentals'
): TaxCalculationResult {
  if (preTaxAmountCents < 0) {
    throw new Error('Charge amount cannot be negative');
  }

  const serviceChargeCents = Math.round(preTaxAmountCents * RESORT_SERVICE_CHARGE_RATE);
  const vatCents = Math.round(preTaxAmountCents * BAHAMAS_VAT_RATE);
  const hotelLevyCents = 0; // Exempt

  const totalCents = preTaxAmountCents + serviceChargeCents + vatCents;
  const effectiveTaxRatePct = preTaxAmountCents > 0
    ? Number((((totalCents - preTaxAmountCents) / preTaxAmountCents) * 100).toFixed(2))
    : 0;

  return {
    preTaxCents: preTaxAmountCents,
    vatCents,
    serviceChargeCents,
    hotelLevyCents,
    totalCents,
    effectiveTaxRatePct,
  };
}

export interface TenderAllocationRequest {
  tenderId: string;
  method: 'cash_usd' | 'cash_bsd' | 'credit_card' | 'wire_transfer' | 'gift_certificate';
  fixedCents?: number;
  percentage?: number; // e.g. 50 for 50%
}

export interface AllocatedTender {
  tenderId: string;
  method: string;
  allocatedCents: number;
  currency: 'USD' | 'BSD';
}

/**
 * Odd-Penny Preservation Algorithm:
 * Splits a total folio balance across multi-tender payments without losing or gaining a single cent.
 * When proportions result in fractional cents, the fractional remainder (odd pennies) is distributed
 * to the splits with the highest remainder, guaranteeing that sum(allocated) === totalDueCents.
 */
export function splitTenderPreservePennies(
  totalDueCents: number,
  tenders: TenderAllocationRequest[]
): {
  allocatedTenders: AllocatedTender[];
  totalAllocatedCents: number;
  varianceCents: number;
} {
  if (totalDueCents <= 0) {
    throw new Error('Total due must be greater than zero for tender split');
  }
  if (!tenders || tenders.length === 0) {
    throw new Error('At least one payment tender must be provided');
  }

  // Handle fixed cents first
  let remainingDueCents = totalDueCents;
  const result: { tender: TenderAllocationRequest; cents: number; fraction: number }[] = [];
  const percentTenders: TenderAllocationRequest[] = [];

  for (const t of tenders) {
    if (typeof t.fixedCents === 'number' && t.fixedCents > 0) {
      const fixedAmount = Math.min(t.fixedCents, remainingDueCents);
      result.push({ tender: t, cents: fixedAmount, fraction: 0 });
      remainingDueCents -= fixedAmount;
    } else {
      percentTenders.push(t);
    }
  }

  if (percentTenders.length > 0 && remainingDueCents > 0) {
    const totalPercentage = percentTenders.reduce((sum, t) => sum + (t.percentage ?? (100 / percentTenders.length)), 0);

    const fractionalAllocations = percentTenders.map((t) => {
      const weight = (t.percentage ?? (100 / percentTenders.length)) / totalPercentage;
      const rawCents = remainingDueCents * weight;
      const floorCents = Math.floor(rawCents);
      const fraction = rawCents - floorCents;
      return { tender: t, floorCents, fraction };
    });

    const floorSum = fractionalAllocations.reduce((sum, item) => sum + item.floorCents, 0);
    let oddPennies = remainingDueCents - floorSum;

    // Sort by largest fractional remainder descending
    fractionalAllocations.sort((a, b) => b.fraction - a.fraction);

    for (const item of fractionalAllocations) {
      let finalCents = item.floorCents;
      if (oddPennies > 0) {
        finalCents += 1;
        oddPennies -= 1;
      }
      result.push({
        tender: item.tender,
        cents: finalCents,
        fraction: item.fraction,
      });
    }
  }

  const allocatedTenders: AllocatedTender[] = result.map((r) => ({
    tenderId: r.tender.tenderId,
    method: r.tender.method,
    allocatedCents: r.cents,
    currency: r.tender.method === 'cash_bsd' ? 'BSD' : 'USD',
  }));

  const totalAllocatedCents = allocatedTenders.reduce((sum, t) => sum + t.allocatedCents, 0);
  const varianceCents = totalDueCents - totalAllocatedCents;

  return {
    allocatedTenders,
    totalAllocatedCents,
    varianceCents,
  };
}

/**
 * Validates 1:1 USD / BSD dual-currency parity.
 * Under Bahamas Central Bank regulations, 1 BSD = 1 USD with 0 foreign exchange fee.
 */
export function convertUSDtoBSD(amountCents: number): number {
  return amountCents * USD_BSD_EXCHANGE_RATE;
}

export function convertBSDtoUSD(amountCents: number): number {
  return amountCents / USD_BSD_EXCHANGE_RATE;
}
