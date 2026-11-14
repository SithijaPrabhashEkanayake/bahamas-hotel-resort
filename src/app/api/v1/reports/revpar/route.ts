import { NextResponse } from 'next/server';
import { INITIAL_ROOMS, INITIAL_FOLIOS } from '@/lib/data/mock-resort-data';
import { generateDailyFlashReport } from '@/lib/engines/revpar-kpi';

export async function GET() {
  const totalRooms = INITIAL_ROOMS.length;
  const outOfOrderRooms = INITIAL_ROOMS.filter((r) => r.status === 'out_of_order').length;
  const occupiedRooms = INITIAL_ROOMS.filter(
    (r) => r.status === 'occupied_clean' || r.status === 'occupied_dirty' || r.status === 'vip_in_house'
  ).length;

  // Aggregate departmental revenues from active folios
  let roomRevenueCents = 0;
  let fnbRevenueCents = 0;
  let spaRevenueCents = 0;
  let excursionRevenueCents = 0;
  let cabanaRevenueCents = 0;

  for (const folio of INITIAL_FOLIOS) {
    for (const item of folio.items) {
      if (item.category === 'lodging') roomRevenueCents += item.pre_tax_amount_cents;
      else if (item.category === 'fnb') fnbRevenueCents += item.pre_tax_amount_cents;
      else if (item.category === 'spa') spaRevenueCents += item.pre_tax_amount_cents;
      else if (item.category === 'excursion') excursionRevenueCents += item.pre_tax_amount_cents;
      else if (item.category === 'cabana') cabanaRevenueCents += item.pre_tax_amount_cents;
    }
  }

  // If initial mock data has lower revenue, supplement with realistic daily baseline
  if (roomRevenueCents === 0) roomRevenueCents = 2450000;
  if (fnbRevenueCents === 0) fnbRevenueCents = 680000;
  if (spaRevenueCents === 0) spaRevenueCents = 320000;
  if (excursionRevenueCents === 0) excursionRevenueCents = 450000;
  if (cabanaRevenueCents === 0) cabanaRevenueCents = 180000;

  const todayStr = new Date().toISOString().split('T')[0];

  const report = generateDailyFlashReport(
    todayStr,
    {
      totalRooms,
      outOfOrderRooms,
      occupiedRooms,
    },
    {
      roomRevenueCents,
      fnbRevenueCents,
      spaRevenueCents,
      excursionRevenueCents,
      cabanaRevenueCents,
    }
  );

  return NextResponse.json({ data: report });
}
