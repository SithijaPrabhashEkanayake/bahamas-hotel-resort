/**
 * Bahamas Luxury Hotel & Resort Management System (bahamas-hotel-resort)
 * TypeScript Domain Types & Interfaces
 */

export type UserRole =
  | 'admin'
  | 'front_desk'
  | 'concierge'
  | 'housekeeping'
  | 'fnb_staff'
  | 'maintenance'
  | 'guest';

export type RoomTier =
  | 'oceanfront_villa'
  | 'overwater_bungalow'
  | 'royal_palm_suite'
  | 'beachfront_cottage'
  | 'gardenview_deluxe';

export type RoomStatus =
  | 'vacant_clean'
  | 'vacant_dirty'
  | 'occupied_clean'
  | 'occupied_dirty'
  | 'out_of_order'
  | 'maintenance_hold'
  | 'vip_in_house';

export type BookingStatus =
  | 'pending_hold'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type FolioType = 'room_master' | 'personal_incidentals' | 'corporate_billing';
export type FolioStatus = 'active' | 'settled' | 'closed';

export type PaymentMethod =
  | 'cash_bsd'
  | 'cash_usd'
  | 'credit_card'
  | 'wire_transfer'
  | 'gift_certificate';

export type HousekeepingTaskType =
  | 'departure_clean'
  | 'stayover_refresh'
  | 'turndown_service'
  | 'deep_disinfection';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent_vip';
export type TaskStatus = 'dirty' | 'in_progress' | 'inspected' | 'clean';

export type MaintenanceSeverity = 'p1_urgent' | 'p2_standard' | 'p3_preventative';
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type VIPTier = 'general' | 'pearl' | 'emerald' | 'platinum_sovereign';
export type OutletType = 'fine_dining' | 'pool_bar' | 'cabana_service' | 'beach_club' | 'in_room_dining';

export interface RoomCategory {
  id: string;
  name: string;
  code: string;
  tier: RoomTier;
  base_rate_cents: number;
  max_occupancy: number;
  amenities: string[];
  square_meters: number;
  description: string;
}

export interface Room {
  id: string;
  room_number: string;
  floor: number;
  wing: 'East Oceanfront' | 'West Lagoon' | 'Royal Cays' | 'Overwater Pier';
  category_id: string;
  category?: RoomCategory;
  status: RoomStatus;
  current_booking_id?: string | null;
  cleaning_assigned_to?: string | null;
  notes?: string;
  created_at: string;
}

export interface GuestProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  passport_number: string;
  nationality: string;
  vip_tier: VIPTier;
  preferences: {
    dietary?: string[];
    pillow_type?: string;
    champagne_welcome?: boolean;
    yacht_charter_interest?: boolean;
  };
  total_stays: number;
  lifetime_spend_cents: number;
}

export interface Booking {
  id: string;
  booking_reference: string;
  guest_id: string;
  guest?: GuestProfile;
  room_id: string;
  room?: Room;
  check_in_date: string; // YYYY-MM-DD
  check_out_date: string; // YYYY-MM-DD
  nights: number;
  adults: number;
  children: number;
  status: BookingStatus;
  rate_per_night_cents: number;
  total_lodging_cents: number;
  hold_expires_at?: string | null; // For pending_hold (15 min lock)
  created_at: string;
}

export interface FolioItem {
  id: string;
  folio_id: string;
  category: 'lodging' | 'fnb' | 'spa' | 'excursion' | 'cabana' | 'incidentals';
  description: string;
  pre_tax_amount_cents: number;
  vat_amount_cents: number;       // 10% Bahamas VAT
  service_charge_cents: number;   // 10% Resort Service Charge
  hotel_levy_cents: number;       // 10% Hotel Room Levy (lodging only)
  total_amount_cents: number;
  currency: 'USD' | 'BSD';
  posted_by: string;
  created_at: string;
}

export interface FolioPayment {
  id: string;
  folio_id: string;
  payment_method: PaymentMethod;
  amount_cents: number;
  currency: 'USD' | 'BSD';
  exchange_rate: number; // 1.0 for USD/BSD parity
  reference_number?: string;
  processed_at: string;
}

export interface GuestFolio {
  id: string;
  folio_number: string;
  booking_id: string;
  booking?: Booking;
  type: FolioType;
  status: FolioStatus;
  total_pre_tax_cents: number;
  total_vat_cents: number;
  total_service_charge_cents: number;
  total_hotel_levy_cents: number;
  grand_total_cents: number;
  total_paid_cents: number;
  balance_due_cents: number;
  items: FolioItem[];
  payments: FolioPayment[];
  created_at: string;
}

export interface HousekeepingTask {
  id: string;
  room_id: string;
  room_number: string;
  room_tier: RoomTier;
  task_type: HousekeepingTaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_attendant: string;
  estimated_minutes: number;
  actual_minutes?: number;
  inspection_notes?: string;
  started_at?: string;
  completed_at?: string;
}

export interface MaintenanceTicket {
  id: string;
  room_id: string;
  room_number: string;
  issue_title: string;
  description: string;
  severity: MaintenanceSeverity;
  status: MaintenanceStatus;
  reported_by: string;
  assigned_to?: string;
  causes_ooo: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface POSOrder {
  id: string;
  order_number: string;
  outlet_id: string;
  outlet_name: string;
  outlet_type: OutletType;
  server_name: string;
  room_number?: string;
  guest_surname?: string;
  folio_id?: string;
  items: {
    item_id: string;
    name: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
  }[];
  pre_tax_total_cents: number;
  vat_cents: number;
  service_charge_cents: number;
  total_cents: number;
  status: 'open' | 'charged_to_room' | 'settled_direct' | 'void';
  created_at: string;
}

export interface RevPARReport {
  date: string;
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  out_of_order_rooms: number;
  occupancy_rate_pct: number;
  room_revenue_cents: number;
  average_daily_rate_cents: number; // ADR
  revenue_per_available_room_cents: number; // RevPAR
  total_resort_revenue_cents: number;
  trevpar_cents: number; // TRevPAR
  departmental_breakdown: {
    lodging_cents: number;
    fnb_cents: number;
    spa_wellness_cents: number;
    concierge_yacht_cents: number;
    cabana_rentals_cents: number;
  };
}
