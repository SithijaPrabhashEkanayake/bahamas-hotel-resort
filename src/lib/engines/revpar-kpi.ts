/**
 * Executive Hospitality KPI & RevPAR Analytics Engine
 * Purpose:
 * - Mathematical accuracy for hospitality standard metrics: OCC%, ADR, RevPAR, TRevPAR
 * - Daily Flash Report generation for General Manager & Financial Controller
 * - Zero division protection
 */

import { RevPARReport } from '@/types';

export interface DailyOccupancyMetrics {
  totalRooms: number;
  outOfOrderRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRatePct: number;
}

export interface DailyRevenueMetrics {
  roomRevenueCents: number;
  fnbRevenueCents: number;
  spaRevenueCents: number;
  excursionRevenueCents: number;
  cabanaRevenueCents: number;
  totalResortRevenueCents: number;
}

export interface KPIExecutionResult {
  occupancy: DailyOccupancyMetrics;
  revenue: DailyRevenueMetrics;
  adrCents: number;
  revparCents: number;
  trevparCents: number;
}

/**
 * Calculates core hospitality metrics:
 * Available Rooms = Total Rooms - Out of Order (OOO) Rooms
 * Occupancy Rate = (Occupied Rooms / Available Rooms) * 100
 * ADR (Average Daily Rate) = Room Revenue / Occupied Rooms
 * RevPAR (Revenue Per Available Room) = Room Revenue / Available Rooms
 * TRevPAR (Total Revenue Per Available Room) = Total Resort Revenue / Available Rooms
 */
export function calculateHospitalityKPIs(
  occupancyInput: {
    totalRooms: number;
    outOfOrderRooms: number;
    occupiedRooms: number;
  },
  revenueInput: {
    roomRevenueCents: number;
    fnbRevenueCents?: number;
    spaRevenueCents?: number;
    excursionRevenueCents?: number;
    cabanaRevenueCents?: number;
  }
): KPIExecutionResult {
  const { totalRooms, outOfOrderRooms, occupiedRooms } = occupancyInput;
  const {
    roomRevenueCents,
    fnbRevenueCents = 0,
    spaRevenueCents = 0,
    excursionRevenueCents = 0,
    cabanaRevenueCents = 0,
  } = revenueInput;

  if (totalRooms < 0 || outOfOrderRooms < 0 || occupiedRooms < 0) {
    throw new Error('Room counts cannot be negative');
  }

  const availableRooms = Math.max(0, totalRooms - outOfOrderRooms);

  // OCC%
  const occupancyRatePct = availableRooms > 0
    ? Number(((occupiedRooms / availableRooms) * 100).toFixed(2))
    : 0;

  // ADR: Room Revenue / Occupied Rooms
  const adrCents = occupiedRooms > 0
    ? Math.round(roomRevenueCents / occupiedRooms)
    : 0;

  // RevPAR: Room Revenue / Available Rooms
  const revparCents = availableRooms > 0
    ? Math.round(roomRevenueCents / availableRooms)
    : 0;

  // Total Revenue
  const totalResortRevenueCents =
    roomRevenueCents + fnbRevenueCents + spaRevenueCents + excursionRevenueCents + cabanaRevenueCents;

  // TRevPAR: Total Revenue / Available Rooms
  const trevparCents = availableRooms > 0
    ? Math.round(totalResortRevenueCents / availableRooms)
    : 0;

  return {
    occupancy: {
      totalRooms,
      outOfOrderRooms,
      occupiedRooms,
      availableRooms,
      occupancyRatePct,
    },
    revenue: {
      roomRevenueCents,
      fnbRevenueCents,
      spaRevenueCents,
      excursionRevenueCents,
      cabanaRevenueCents,
      totalResortRevenueCents,
    },
    adrCents,
    revparCents,
    trevparCents,
  };
}

/**
 * Builds an official Executive Daily Flash Report compliant with RevPARReport interface.
 */
export function generateDailyFlashReport(
  date: string,
  occupancyInput: {
    totalRooms: number;
    outOfOrderRooms: number;
    occupiedRooms: number;
  },
  revenueInput: {
    roomRevenueCents: number;
    fnbRevenueCents: number;
    spaRevenueCents: number;
    excursionRevenueCents: number;
    cabanaRevenueCents: number;
  }
): RevPARReport {
  const kpis = calculateHospitalityKPIs(occupancyInput, revenueInput);

  return {
    date,
    total_rooms: kpis.occupancy.totalRooms,
    available_rooms: kpis.occupancy.availableRooms,
    occupied_rooms: kpis.occupancy.occupiedRooms,
    out_of_order_rooms: kpis.occupancy.outOfOrderRooms,
    occupancy_rate_pct: kpis.occupancy.occupancyRatePct,
    room_revenue_cents: kpis.revenue.roomRevenueCents,
    average_daily_rate_cents: kpis.adrCents,
    revenue_per_available_room_cents: kpis.revparCents,
    total_resort_revenue_cents: kpis.revenue.totalResortRevenueCents,
    trevpar_cents: kpis.trevparCents,
    departmental_breakdown: {
      lodging_cents: kpis.revenue.roomRevenueCents,
      fnb_cents: kpis.revenue.fnbRevenueCents,
      spa_wellness_cents: kpis.revenue.spaRevenueCents,
      concierge_yacht_cents: kpis.revenue.excursionRevenueCents,
      cabana_rentals_cents: kpis.revenue.cabanaRevenueCents,
    },
  };
}
