/**
 * Bahamas Room Collision & Dynamic Caribbean Yield Engine
 * Purpose:
 * - High-speed date-range overlap detection (<5ms execution)
 * - 15-minute checkout cart locking with TTL auto-expiration
 * - Out-of-Order (OOO) & Maintenance hold collision avoidance
 * - Dynamic seasonal yield pricing (High, Shoulder, Low/Hurricane seasons)
 * - Minimum Length-of-Stay (LOS) enforcement
 */

export interface BookingInterval {
  id: string;
  roomId: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  status: 'pending_hold' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  holdExpiresAt?: string | null; // ISO 8601 string
}

export interface MaintenanceBlock {
  id: string;
  roomId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  causesOOO: boolean;
}

export type CaribbeanSeason = 'high_season' | 'shoulder_season' | 'low_season';

export interface SeasonalRateMultiplier {
  season: CaribbeanSeason;
  multiplier: number;
  minNights: number;
}

export const SEASONAL_MULTIPLIERS: Record<CaribbeanSeason, SeasonalRateMultiplier> = {
  high_season: {
    season: 'high_season',
    multiplier: 1.45,
    minNights: 3, // 3-night minimum during peak winter holiday
  },
  shoulder_season: {
    season: 'shoulder_season',
    multiplier: 1.15,
    minNights: 2,
  },
  low_season: {
    season: 'low_season',
    multiplier: 0.85,
    minNights: 1,
  },
};

/**
 * Determines Caribbean season from a date string (YYYY-MM-DD).
 * - High Season: Dec 15 to Apr 30
 * - Shoulder Season: May 1 to Jun 30, Nov 1 to Dec 14
 * - Low Season: Jul 1 to Oct 31 (Tropical/Hurricane season)
 */
export function getCaribbeanSeason(dateStr: string): CaribbeanSeason {
  const date = new Date(dateStr);
  const month = date.getUTCMonth() + 1; // 1-12
  const day = date.getUTCDate();

  // High Season: Dec 15 - Apr 30
  if (month === 12 && day >= 15) return 'high_season';
  if (month >= 1 && month <= 4) return 'high_season';

  // Low Season: Jul 1 - Oct 31
  if (month >= 7 && month <= 10) return 'low_season';

  // Shoulder Season: May 1 - Jun 30, Nov 1 - Dec 14
  return 'shoulder_season';
}

/**
 * Check whether two date intervals [startA, endA) and [startB, endB) overlap.
 * Hotel standard: Arrival on departure day of another guest does NOT collide (e.g. Check-out at 11am, Check-in at 3pm).
 * Overlap condition: startA < endB && startB < endA
 */
export function doIntervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  if (sA >= eA || sB >= eB) {
    throw new Error('Check-out date must be strictly after check-in date');
  }

  return sA < eB && sB < eA;
}

/**
 * Validates whether an existing pending hold is currently active.
 * Holds expire strictly after 15 minutes.
 */
export function isHoldActive(holdExpiresAt: string | null | undefined, nowIso: string = new Date().toISOString()): boolean {
  if (!holdExpiresAt) return false;
  return new Date(holdExpiresAt).getTime() > new Date(nowIso).getTime();
}

/**
 * Collision Detector:
 * Checks whether a proposed stay interval [checkIn, checkOut) for a given room collides with:
 * 1. Confirmed or checked-in bookings
 * 2. Active 15-minute pending cart holds
 * 3. Urgent maintenance OOO blocks
 */
export function checkRoomCollision(params: {
  roomId: string;
  proposedCheckIn: string;
  proposedCheckOut: string;
  existingBookings: BookingInterval[];
  maintenanceBlocks?: MaintenanceBlock[];
  excludeBookingId?: string;
  nowIso?: string;
}): {
  hasCollision: boolean;
  reason?: 'confirmed_booking' | 'active_cart_hold' | 'maintenance_ooo';
  conflictingRecordId?: string;
} {
  const {
    roomId,
    proposedCheckIn,
    proposedCheckOut,
    existingBookings,
    maintenanceBlocks = [],
    excludeBookingId,
    nowIso = new Date().toISOString(),
  } = params;

  // 1. Check Maintenance Blocks first
  for (const block of maintenanceBlocks) {
    if (block.roomId === roomId && block.causesOOO) {
      if (doIntervalsOverlap(proposedCheckIn, proposedCheckOut, block.startDate, block.endDate)) {
        return {
          hasCollision: true,
          reason: 'maintenance_ooo',
          conflictingRecordId: block.id,
        };
      }
    }
  }

  // 2. Check Bookings
  for (const b of existingBookings) {
    if (b.roomId !== roomId) continue;
    if (excludeBookingId && b.id === excludeBookingId) continue;
    if (b.status === 'cancelled' || b.status === 'no_show') continue;

    // For pending holds, check if still within 15-minute window
    if (b.status === 'pending_hold') {
      if (!isHoldActive(b.holdExpiresAt, nowIso)) {
        continue; // Expired cart hold does not block room
      }
    }

    if (doIntervalsOverlap(proposedCheckIn, proposedCheckOut, b.checkInDate, b.checkOutDate)) {
      return {
        hasCollision: true,
        reason: b.status === 'pending_hold' ? 'active_cart_hold' : 'confirmed_booking',
        conflictingRecordId: b.id,
      };
    }
  }

  return { hasCollision: false };
}

/**
 * Caribbean Dynamic Yield Rate Calculation:
 * Multiplies base rate by season multiplier and validates LOS (Length of Stay) constraint.
 */
export function calculateDynamicYieldRate(params: {
  baseRateCents: number;
  checkInDate: string;
  checkOutDate: string;
}): {
  nights: number;
  season: CaribbeanSeason;
  adjustedRatePerNightCents: number;
  totalLodgingCents: number;
  minNightsRequired: number;
  isLosSatisfied: boolean;
} {
  const { baseRateCents, checkInDate, checkOutDate } = params;
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const season = getCaribbeanSeason(checkInDate);
  const seasonRule = SEASONAL_MULTIPLIERS[season];
  const adjustedRatePerNightCents = Math.round(baseRateCents * seasonRule.multiplier);
  const totalLodgingCents = adjustedRatePerNightCents * nights;
  const isLosSatisfied = nights >= seasonRule.minNights;

  return {
    nights,
    season,
    adjustedRatePerNightCents,
    totalLodgingCents,
    minNightsRequired: seasonRule.minNights,
    isLosSatisfied,
  };
}

/**
 * Creates a 15-minute checkout cart lock expiration timestamp.
 */
export function generateCartHoldExpiry(holdDurationMinutes = 15, baseTime = new Date()): string {
  const expiry = new Date(baseTime.getTime() + holdDurationMinutes * 60 * 1000);
  return expiry.toISOString();
}
