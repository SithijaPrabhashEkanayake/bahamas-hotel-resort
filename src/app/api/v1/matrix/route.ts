import { NextResponse } from 'next/server';
import { INITIAL_ROOMS, INITIAL_ROOM_CATEGORIES, INITIAL_BOOKINGS } from '@/lib/data/mock-resort-data';

export async function GET() {
  const categoriesMap = new Map(INITIAL_ROOM_CATEGORIES.map((c) => [c.id, c]));

  const enrichedRooms = INITIAL_ROOMS.map((r) => {
    const category = categoriesMap.get(r.category_id);
    const activeBooking = INITIAL_BOOKINGS.find(
      (b) => b.room_id === r.id && (b.status === 'checked_in' || b.status === 'confirmed')
    );

    return {
      ...r,
      category,
      active_booking: activeBooking || null,
    };
  });

  return NextResponse.json({
    data: {
      rooms: enrichedRooms,
      categories: INITIAL_ROOM_CATEGORIES,
      wings: ['Overwater Pier', 'East Oceanfront', 'Royal Cays', 'West Lagoon'],
      total_rooms: enrichedRooms.length,
      counts: {
        occupied_clean: enrichedRooms.filter((r) => r.status === 'occupied_clean').length,
        vip_in_house: enrichedRooms.filter((r) => r.status === 'vip_in_house').length,
        vacant_clean: enrichedRooms.filter((r) => r.status === 'vacant_clean').length,
        vacant_dirty: enrichedRooms.filter((r) => r.status === 'vacant_dirty').length,
        occupied_dirty: enrichedRooms.filter((r) => r.status === 'occupied_dirty').length,
        out_of_order: enrichedRooms.filter((r) => r.status === 'out_of_order').length,
      },
    },
  });
}
