import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  doIntervalsOverlap,
  isHoldActive,
  checkRoomCollision,
  getCaribbeanSeason,
  calculateDynamicYieldRate,
  generateCartHoldExpiry,
} from '../../src/lib/engines/room-collision';

describe('Room Collision & Dynamic Caribbean Yield Engine', () => {
  test('Interval Overlap: accurately identifies overlapping and non-overlapping dates', () => {
    // Guest A stays 2026-12-20 to 2026-12-25
    // Guest B arrives on checkout day: 2026-12-25 to 2026-12-30 (Standard hotel turnover -> NO collision)
    assert.equal(doIntervalsOverlap('2026-12-20', '2026-12-25', '2026-12-25', '2026-12-30'), false);

    // Guest C attempts stay: 2026-12-22 to 2026-12-27 (Overlaps with Guest A)
    assert.equal(doIntervalsOverlap('2026-12-20', '2026-12-25', '2026-12-22', '2026-12-27'), true);

    // Guest D completely encloses Guest A: 2026-12-19 to 2026-12-26
    assert.equal(doIntervalsOverlap('2026-12-20', '2026-12-25', '2026-12-19', '2026-12-26'), true);
  });

  test('15-Minute Hold Lock: detects active cart hold and releases expired cart hold', () => {
    const now = new Date('2026-12-20T14:00:00Z');
    const activeHold = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 min left
    const expiredHold = new Date(now.getTime() - 5 * 60 * 1000).toISOString(); // Expired 5 min ago

    assert.equal(isHoldActive(activeHold, now.toISOString()), true);
    assert.equal(isHoldActive(expiredHold, now.toISOString()), false);

    // Collision check against active hold
    const collisionActive = checkRoomCollision({
      roomId: 'room-101',
      proposedCheckIn: '2026-12-20',
      proposedCheckOut: '2026-12-25',
      existingBookings: [
        {
          id: 'hold-1',
          roomId: 'room-101',
          checkInDate: '2026-12-20',
          checkOutDate: '2026-12-25',
          status: 'pending_hold',
          holdExpiresAt: activeHold,
        },
      ],
      nowIso: now.toISOString(),
    });

    assert.equal(collisionActive.hasCollision, true);
    assert.equal(collisionActive.reason, 'active_cart_hold');

    // Collision check against expired hold -> Should be allowed (no collision)
    const collisionExpired = checkRoomCollision({
      roomId: 'room-101',
      proposedCheckIn: '2026-12-20',
      proposedCheckOut: '2026-12-25',
      existingBookings: [
        {
          id: 'hold-2',
          roomId: 'room-101',
          checkInDate: '2026-12-20',
          checkOutDate: '2026-12-25',
          status: 'pending_hold',
          holdExpiresAt: expiredHold,
        },
      ],
      nowIso: now.toISOString(),
    });

    assert.equal(collisionExpired.hasCollision, false);
  });

  test('Maintenance OOO Collision: blocks booking when room is out-of-order', () => {
    const collision = checkRoomCollision({
      roomId: 'villa-501',
      proposedCheckIn: '2026-12-22',
      proposedCheckOut: '2026-12-26',
      existingBookings: [],
      maintenanceBlocks: [
        {
          id: 'ticket-99',
          roomId: 'villa-501',
          startDate: '2026-12-20',
          endDate: '2026-12-24',
          causesOOO: true,
        },
      ],
    });

    assert.equal(collision.hasCollision, true);
    assert.equal(collision.reason, 'maintenance_ooo');
  });

  test('Caribbean Dynamic Yield: applies correct multipliers and enforces LOS rules', () => {
    // High Season: Dec 20 (Christmas peak)
    assert.equal(getCaribbeanSeason('2026-12-20'), 'high_season');
    const highYield = calculateDynamicYieldRate({
      baseRateCents: 100000, // $1,000/night base
      checkInDate: '2026-12-20',
      checkOutDate: '2026-12-24', // 4 nights
    });

    assert.equal(highYield.season, 'high_season');
    assert.equal(highYield.adjustedRatePerNightCents, 145000); // 1.45x = $1,450
    assert.equal(highYield.nights, 4);
    assert.equal(highYield.totalLodgingCents, 580000); // $5,800
    assert.equal(highYield.isLosSatisfied, true); // 4 >= 3 min nights

    // Low / Hurricane Season: Aug 15
    assert.equal(getCaribbeanSeason('2026-08-15'), 'low_season');
    const lowYield = calculateDynamicYieldRate({
      baseRateCents: 100000,
      checkInDate: '2026-08-15',
      checkOutDate: '2026-08-17', // 2 nights
    });

    assert.equal(lowYield.season, 'low_season');
    assert.equal(lowYield.adjustedRatePerNightCents, 85000); // 0.85x = $850
    assert.equal(lowYield.isLosSatisfied, true);
  });
});
