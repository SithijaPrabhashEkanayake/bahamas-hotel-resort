import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLodgingTaxes,
  calculateNonLodgingTaxes,
  splitTenderPreservePennies,
  convertUSDtoBSD,
  convertBSDtoUSD,
  BAHAMAS_VAT_RATE,
  RESORT_SERVICE_CHARGE_RATE,
  HOTEL_GUEST_LEVY_RATE,
} from '../../src/lib/engines/tax-billing';

describe('Bahamas Statutory Tax & Multi-Tender Billing Engine', () => {
  test('Lodging Tax: correctly computes 10% VAT, 10% Service Charge, and 10% Hotel Levy', () => {
    // $1,000.00 lodging (100,000 cents)
    const result = calculateLodgingTaxes(100000);

    assert.equal(result.preTaxCents, 100000);
    assert.equal(result.serviceChargeCents, 10000); // 10%
    assert.equal(result.hotelLevyCents, 10000);     // 10%
    assert.equal(result.vatCents, 10000);           // 10%
    assert.equal(result.totalCents, 130000);        // $1,300.00
    assert.equal(result.effectiveTaxRatePct, 30.00);
  });

  test('Non-Lodging Tax: computes 10% Service Charge and 10% VAT, exempts Hotel Levy', () => {
    // $250.00 F&B charge (25,000 cents)
    const result = calculateNonLodgingTaxes(25000, 'fnb');

    assert.equal(result.preTaxCents, 25000);
    assert.equal(result.serviceChargeCents, 2500); // 10%
    assert.equal(result.vatCents, 2500);           // 10%
    assert.equal(result.hotelLevyCents, 0);        // Exempt
    assert.equal(result.totalCents, 30000);        // $300.00
    assert.equal(result.effectiveTaxRatePct, 20.00);
  });

  test('Odd-Penny Preservation: splits 10,000 cents ($100.00) 3-ways with zero penny loss', () => {
    const split = splitTenderPreservePennies(10000, [
      { tenderId: 't1', method: 'credit_card', percentage: 33.3333 },
      { tenderId: 't2', method: 'cash_usd', percentage: 33.3333 },
      { tenderId: 't3', method: 'cash_bsd', percentage: 33.3334 },
    ]);

    assert.equal(split.totalAllocatedCents, 10000);
    assert.equal(split.varianceCents, 0);

    // Sum must equal exactly 10,000 cents
    const sum = split.allocatedTenders.reduce((acc, t) => acc + t.allocatedCents, 0);
    assert.equal(sum, 10000);

    // Allocation should be 3334, 3333, 3333 or similar
    const amounts = split.allocatedTenders.map(t => t.allocatedCents);
    assert.ok(amounts.includes(3334));
    assert.ok(amounts.includes(3333));
  });

  test('Odd-Penny Preservation: splits with fixed cash amount and remaining percentage', () => {
    // Total due $1,250.50 (125,050 cents)
    // Guest pays $500.00 cash BSD, remaining 50/50 across two credit cards
    const split = splitTenderPreservePennies(125050, [
      { tenderId: 't1', method: 'cash_bsd', fixedCents: 50000 },
      { tenderId: 't2', method: 'credit_card', percentage: 50 },
      { tenderId: 't3', method: 'credit_card', percentage: 50 },
    ]);

    assert.equal(split.totalAllocatedCents, 125050);
    assert.equal(split.varianceCents, 0);
    assert.equal(split.allocatedTenders[0].allocatedCents, 50000);
    assert.equal(split.allocatedTenders[0].currency, 'BSD');

    // Remaining 75,050 cents split 50/50: 37,525 each
    assert.equal(split.allocatedTenders[1].allocatedCents, 37525);
    assert.equal(split.allocatedTenders[2].allocatedCents, 37525);
  });

  test('Dual Currency 1:1 Parity: converts USD to BSD without loss', () => {
    assert.equal(convertUSDtoBSD(50000), 50000);
    assert.equal(convertBSDtoUSD(50000), 50000);
  });
});
