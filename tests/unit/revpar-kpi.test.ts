import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHospitalityKPIs,
  generateDailyFlashReport,
} from '../../src/lib/engines/revpar-kpi';

describe('Executive Hospitality KPI & RevPAR Analytics Engine', () => {
  test('Calculates accurate OCC%, ADR, RevPAR, and TRevPAR', () => {
    // 50 Total Rooms, 2 Out-of-Order (OOO), 40 Occupied Rooms
    // Available Rooms = 50 - 2 = 48
    // OCC% = (40 / 48) * 100 = 83.33%
    // Room Revenue = $40,000.00 (4,000,000 cents)
    // ADR = $40,000 / 40 = $1,000.00 (100,000 cents)
    // RevPAR = $40,000 / 48 = $833.33 -> 83,333 cents
    // Ancillary Revenue: F&B $12,000, Spa $5,000, Excursions $8,000, Cabana $2,000
    // Total Resort Revenue = $67,000.00 (6,700,000 cents)
    // TRevPAR = $67,000 / 48 = $1,395.83 -> 139,583 cents

    const result = calculateHospitalityKPIs(
      {
        totalRooms: 50,
        outOfOrderRooms: 2,
        occupiedRooms: 40,
      },
      {
        roomRevenueCents: 4000000,
        fnbRevenueCents: 1200000,
        spaRevenueCents: 500000,
        excursionRevenueCents: 800000,
        cabanaRevenueCents: 200000,
      }
    );

    assert.equal(result.occupancy.availableRooms, 48);
    assert.equal(result.occupancy.occupancyRatePct, 83.33);
    assert.equal(result.adrCents, 100000);
    assert.equal(result.revparCents, 83333);
    assert.equal(result.revenue.totalResortRevenueCents, 6700000);
    assert.equal(result.trevparCents, 139583);
  });

  test('Gracefully handles edge case: 0 occupied rooms (Zero Division Protection)', () => {
    const result = calculateHospitalityKPIs(
      {
        totalRooms: 50,
        outOfOrderRooms: 0,
        occupiedRooms: 0,
      },
      {
        roomRevenueCents: 0,
      }
    );

    assert.equal(result.occupancy.occupancyRatePct, 0);
    assert.equal(result.adrCents, 0);
    assert.equal(result.revparCents, 0);
    assert.equal(result.trevparCents, 0);
  });

  test('Generates complete Daily Flash Report structure', () => {
    const flashReport = generateDailyFlashReport(
      '2026-11-14',
      {
        totalRooms: 30,
        outOfOrderRooms: 1,
        occupiedRooms: 25,
      },
      {
        roomRevenueCents: 2500000,
        fnbRevenueCents: 800000,
        spaRevenueCents: 300000,
        excursionRevenueCents: 400000,
        cabanaRevenueCents: 150000,
      }
    );

    assert.equal(flashReport.date, '2026-11-14');
    assert.equal(flashReport.total_rooms, 30);
    assert.equal(flashReport.available_rooms, 29);
    assert.equal(flashReport.occupied_rooms, 25);
    assert.equal(flashReport.departmental_breakdown.lodging_cents, 2500000);
    assert.equal(flashReport.departmental_breakdown.fnb_cents, 800000);
    assert.ok(flashReport.revenue_per_available_room_cents > 0);
  });
});
