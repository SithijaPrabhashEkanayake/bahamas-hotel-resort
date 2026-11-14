/**
 * Bahamas Luxury Hotel & Resort PMS
 * Master Mock In-Memory Repository
 * Cable Beach & Paradise Island Seed Dataset
 */

import {
  RoomCategory,
  Room,
  GuestProfile,
  Booking,
  GuestFolio,
  HousekeepingTask,
  MaintenanceTicket,
  POSOrder,
} from '@/types';

export const INITIAL_ROOM_CATEGORIES: RoomCategory[] = [
  {
    id: 'cat-villa',
    name: 'Oceanfront Presidential Villa',
    code: 'OFV',
    tier: 'oceanfront_villa',
    base_rate_cents: 220000, // $2,200.00 / night
    max_occupancy: 6,
    amenities: ['Private Infinity Pool', 'Butler Service', 'Private Beach Access', 'Ocean Terrace', 'Outdoor Shower'],
    square_meters: 280,
    description: 'Ultra-exclusive private villa directly fronting the turquoise waters of Cable Beach with dedicated butler.',
  },
  {
    id: 'cat-bungalow',
    name: 'Exuma Overwater Bungalow',
    code: 'OWB',
    tier: 'overwater_bungalow',
    base_rate_cents: 165000, // $1,650.00 / night
    max_occupancy: 2,
    amenities: ['Glass Floor Panel', 'Private Sun Deck', 'Direct Lagoon Access', 'Soaking Tub', 'Catamaran Net'],
    square_meters: 140,
    description: 'Stilted Polynesian-Bahamian luxury bungalow hovering above a vibrant coral reef lagoon.',
  },
  {
    id: 'cat-royal-suite',
    name: 'Royal Palm Executive Suite',
    code: 'RPS',
    tier: 'royal_palm_suite',
    base_rate_cents: 110000, // $1,100.00 / night
    max_occupancy: 4,
    amenities: ['Wrap-around Balcony', 'Living & Dining Salon', 'Espresso Bar', 'Marble Bath'],
    square_meters: 115,
    description: 'Palatial multi-room suite overlooking the Caribbean sunset and lush royal palm gardens.',
  },
  {
    id: 'cat-beachfront-cottage',
    name: 'Pink Sand Beachfront Cottage',
    code: 'BFC',
    tier: 'beachfront_cottage',
    base_rate_cents: 85000, // $850.00 / night
    max_occupancy: 3,
    amenities: ['Private Hammock Garden', 'Coral Stone Fireplace', 'Teak Patio Loungers'],
    square_meters: 85,
    description: 'Charming colonial Bahamian cottage steps from the powdery coral sands.',
  },
  {
    id: 'cat-deluxe',
    name: 'Gardenview Deluxe Verandah',
    code: 'GDV',
    tier: 'gardenview_deluxe',
    base_rate_cents: 55000, // $550.00 / night
    max_occupancy: 2,
    amenities: ['Tropical Garden Verandah', 'King Teak Bed', 'Rainfall Shower'],
    square_meters: 60,
    description: 'Serene guest sanctuary nestled among bougainvillea, hibiscuses, and whispering palms.',
  },
];

export const INITIAL_ROOMS: Room[] = [
  // Overwater Pier Wing
  { id: 'rm-101', room_number: 'OW-101', floor: 1, wing: 'Overwater Pier', category_id: 'cat-bungalow', status: 'occupied_clean', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-102', room_number: 'OW-102', floor: 1, wing: 'Overwater Pier', category_id: 'cat-bungalow', status: 'vip_in_house', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-103', room_number: 'OW-103', floor: 1, wing: 'Overwater Pier', category_id: 'cat-bungalow', status: 'vacant_clean', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-104', room_number: 'OW-104', floor: 1, wing: 'Overwater Pier', category_id: 'cat-bungalow', status: 'occupied_dirty', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-105', room_number: 'OW-105', floor: 1, wing: 'Overwater Pier', category_id: 'cat-bungalow', status: 'out_of_order', notes: 'Air Conditioning compressor unit replacement in progress', created_at: '2026-11-01T00:00:00Z' },

  // East Oceanfront Wing
  { id: 'rm-201', room_number: 'V-201', floor: 1, wing: 'East Oceanfront', category_id: 'cat-villa', status: 'vip_in_house', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-202', room_number: 'V-202', floor: 1, wing: 'East Oceanfront', category_id: 'cat-villa', status: 'vacant_clean', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-203', room_number: 'V-203', floor: 1, wing: 'East Oceanfront', category_id: 'cat-villa', status: 'occupied_clean', created_at: '2026-11-01T00:00:00Z' },

  // Royal Cays Wing
  { id: 'rm-301', room_number: 'RC-301', floor: 3, wing: 'Royal Cays', category_id: 'cat-royal-suite', status: 'occupied_clean', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-302', room_number: 'RC-302', floor: 3, wing: 'Royal Cays', category_id: 'cat-royal-suite', status: 'vacant_dirty', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-303', room_number: 'RC-303', floor: 3, wing: 'Royal Cays', category_id: 'cat-royal-suite', status: 'vacant_clean', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-304', room_number: 'RC-304', floor: 4, wing: 'Royal Cays', category_id: 'cat-royal-suite', status: 'occupied_clean', created_at: '2026-11-01T00:00:00Z' },

  // West Lagoon Wing
  { id: 'rm-401', room_number: 'BC-401', floor: 1, wing: 'West Lagoon', category_id: 'cat-beachfront-cottage', status: 'occupied_clean', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-402', room_number: 'BC-402', floor: 1, wing: 'West Lagoon', category_id: 'cat-beachfront-cottage', status: 'vacant_clean', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-403', room_number: 'BC-403', floor: 1, wing: 'West Lagoon', category_id: 'cat-beachfront-cottage', status: 'occupied_dirty', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-501', room_number: 'GD-501', floor: 1, wing: 'West Lagoon', category_id: 'cat-deluxe', status: 'occupied_clean', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-502', room_number: 'GD-502', floor: 1, wing: 'West Lagoon', category_id: 'cat-deluxe', status: 'vacant_clean', created_at: '2026-11-01T00:00:00Z' },
  { id: 'rm-503', room_number: 'GD-503', floor: 2, wing: 'West Lagoon', category_id: 'cat-deluxe', status: 'vacant_dirty', created_at: '2026-11-01T00:00:00Z' },
];

export const INITIAL_GUESTS: GuestProfile[] = [
  {
    id: 'gst-1',
    first_name: 'Sir Arthur',
    last_name: 'Wellington',
    email: 'a.wellington@sovereign-holdings.co.uk',
    phone: '+44 20 7946 0991',
    passport_number: 'GB98231452',
    nationality: 'British',
    vip_tier: 'platinum_sovereign',
    preferences: {
      dietary: ['Gluten-Free', 'Kobe Beef'],
      pillow_type: 'Hungarian Goose Down',
      champagne_welcome: true,
      yacht_charter_interest: true,
    },
    total_stays: 12,
    lifetime_spend_cents: 18450000, // $184,500.00
  },
  {
    id: 'gst-2',
    first_name: 'Jonathan & Clarissa',
    last_name: 'Vanderbilt',
    email: 'jonathan.v@vanderbilt-capital.com',
    phone: '+1 212 555 0194',
    passport_number: 'US54902187',
    nationality: 'American',
    vip_tier: 'emerald',
    preferences: {
      champagne_welcome: true,
      yacht_charter_interest: true,
    },
    total_stays: 6,
    lifetime_spend_cents: 8900000,
  },
  {
    id: 'gst-3',
    first_name: 'Lady Genevieve',
    last_name: 'Montclaire',
    email: 'genevieve@montclaire-perfumes.fr',
    phone: '+33 1 42 68 55 00',
    passport_number: 'FR84910283',
    nationality: 'French',
    vip_tier: 'pearl',
    preferences: {
      pillow_type: 'Hypoallergenic Silk',
      dietary: ['Pescatarian'],
    },
    total_stays: 3,
    lifetime_spend_cents: 4200000,
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-1001',
    booking_reference: 'BAH-2026-8941',
    guest_id: 'gst-1',
    room_id: 'rm-201',
    check_in_date: '2026-11-12',
    check_out_date: '2026-11-18',
    nights: 6,
    adults: 2,
    children: 0,
    status: 'checked_in',
    rate_per_night_cents: 220000,
    total_lodging_cents: 1320000, // $13,200.00
    created_at: '2026-10-15T12:00:00Z',
  },
  {
    id: 'bk-1002',
    booking_reference: 'BAH-2026-8942',
    guest_id: 'gst-2',
    room_id: 'rm-102',
    check_in_date: '2026-11-13',
    check_out_date: '2026-11-17',
    nights: 4,
    adults: 2,
    children: 0,
    status: 'checked_in',
    rate_per_night_cents: 165000,
    total_lodging_cents: 660000,
    created_at: '2026-10-20T14:30:00Z',
  },
  {
    id: 'bk-1003',
    booking_reference: 'BAH-2026-8943',
    guest_id: 'gst-3',
    room_id: 'rm-301',
    check_in_date: '2026-11-14',
    check_out_date: '2026-11-19',
    nights: 5,
    adults: 1,
    children: 0,
    status: 'checked_in',
    rate_per_night_cents: 110000,
    total_lodging_cents: 550000,
    created_at: '2026-10-25T09:15:00Z',
  },
  {
    id: 'bk-1004',
    booking_reference: 'BAH-2026-8944',
    guest_id: 'gst-2',
    room_id: 'rm-103',
    check_in_date: '2026-11-20',
    check_out_date: '2026-11-25',
    nights: 5,
    adults: 2,
    children: 0,
    status: 'confirmed',
    rate_per_night_cents: 165000,
    total_lodging_cents: 825000,
    created_at: '2026-11-01T16:00:00Z',
  },
];

export const INITIAL_FOLIOS: GuestFolio[] = [
  {
    id: 'fol-8941',
    folio_number: 'FOL-8941',
    booking_id: 'bk-1001',
    type: 'room_master',
    status: 'active',
    total_pre_tax_cents: 1485000,
    total_vat_cents: 148500,
    total_service_charge_cents: 148500,
    total_hotel_levy_cents: 132000, // Only lodging
    grand_total_cents: 1914000,     // $19,140.00
    total_paid_cents: 500000,       // $5,000 deposit
    balance_due_cents: 1414000,
    items: [
      {
        id: 'itm-1',
        folio_id: 'fol-8941',
        category: 'lodging',
        description: 'Oceanfront Presidential Villa (6 Nights @ $2,200.00)',
        pre_tax_amount_cents: 1320000,
        vat_amount_cents: 132000,
        service_charge_cents: 132000,
        hotel_levy_cents: 132000,
        total_amount_cents: 1716000,
        currency: 'USD',
        posted_by: 'front_desk',
        created_at: '2026-11-12T15:00:00Z',
      },
      {
        id: 'itm-2',
        folio_id: 'fol-8941',
        category: 'fnb',
        description: 'Sunset Pier Dining: Bahamian Rock Lobster & Champagne',
        pre_tax_amount_cents: 85000,
        vat_amount_cents: 8500,
        service_charge_cents: 8500,
        hotel_levy_cents: 0,
        total_amount_cents: 102000,
        currency: 'USD',
        posted_by: 'pos_sunset_pier',
        created_at: '2026-11-13T20:30:00Z',
      },
      {
        id: 'itm-3',
        folio_id: 'fol-8941',
        category: 'excursion',
        description: 'Private 55ft Yacht Charter to Exuma Swimming Pigs',
        pre_tax_amount_cents: 80000,
        vat_amount_cents: 8000,
        service_charge_cents: 8000,
        hotel_levy_cents: 0,
        total_amount_cents: 96000,
        currency: 'USD',
        posted_by: 'concierge',
        created_at: '2026-11-14T09:00:00Z',
      },
    ],
    payments: [
      {
        id: 'pay-1',
        folio_id: 'fol-8941',
        payment_method: 'credit_card',
        amount_cents: 500000,
        currency: 'USD',
        exchange_rate: 1.0,
        reference_number: 'AUTH-VISA-98124',
        processed_at: '2026-11-12T15:05:00Z',
      },
    ],
    created_at: '2026-11-12T15:00:00Z',
  },
];

export const INITIAL_HOUSEKEEPING_TASKS: HousekeepingTask[] = [
  {
    id: 'hk-1',
    room_id: 'rm-104',
    room_number: 'OW-104',
    room_tier: 'overwater_bungalow',
    task_type: 'stayover_refresh',
    priority: 'medium',
    status: 'in_progress',
    assigned_attendant: 'Alicia Knowles',
    estimated_minutes: 45,
    started_at: '2026-11-14T11:30:00Z',
  },
  {
    id: 'hk-2',
    room_id: 'rm-302',
    room_number: 'RC-302',
    room_tier: 'royal_palm_suite',
    task_type: 'departure_clean',
    priority: 'high',
    status: 'dirty',
    assigned_attendant: 'Tanya Rolle',
    estimated_minutes: 60,
  },
  {
    id: 'hk-3',
    room_id: 'rm-403',
    room_number: 'BC-403',
    room_tier: 'beachfront_cottage',
    task_type: 'stayover_refresh',
    priority: 'medium',
    status: 'dirty',
    assigned_attendant: 'Devon Bethel',
    estimated_minutes: 40,
  },
  {
    id: 'hk-4',
    room_id: 'rm-201',
    room_number: 'V-201',
    room_tier: 'oceanfront_villa',
    task_type: 'turndown_service',
    priority: 'urgent_vip',
    status: 'clean',
    assigned_attendant: 'Alicia Knowles',
    estimated_minutes: 30,
    inspection_notes: 'VIP Sir Arthur Wellington. Fresh hibiscus placed on pillows.',
    completed_at: '2026-11-14T12:45:00Z',
  },
];

export const INITIAL_MAINTENANCE_TICKETS: MaintenanceTicket[] = [
  {
    id: 'maint-1',
    room_id: 'rm-105',
    room_number: 'OW-105',
    issue_title: 'Central AC Compressor Seizure',
    description: 'Bungalow ambient temperature 82°F. Master compressor locked. Replacement unit being ferried from Nassau depot.',
    severity: 'p1_urgent',
    status: 'in_progress',
    reported_by: 'Executive Housekeeper',
    assigned_to: 'Chief Engineer Darrell Moss',
    causes_ooo: true,
    created_at: '2026-11-13T08:00:00Z',
  },
  {
    id: 'maint-2',
    room_id: 'rm-402',
    room_number: 'BC-402',
    issue_title: 'Verandah Teak Latch Loose',
    description: 'Sliding patio door teak handle requires tightening and re-oiling.',
    severity: 'p3_preventative',
    status: 'open',
    reported_by: 'Room Attendant',
    assigned_to: 'Carpenter Jason Pratt',
    causes_ooo: false,
    created_at: '2026-11-14T10:15:00Z',
  },
];
