-- ==============================================================================
-- Bahamas Luxury Hotel & Resort Management System (bahamas-hotel-resort)
-- Production PostgreSQL 15+ Relational Schema, RLS Policies, Indexes & Seed Data
-- Database Engine: PostgreSQL 15+ (Supabase)
-- Version: 1.0.0
-- Compliant with:
--   - Supabase Postgres Best Practices (InitPlan subquery caching, FK indexing)
--   - Bahamas Statutory Tax Regime (10% VAT, 10% Service Charge, 10% Hotel Levy)
--   - Dual-Currency USD/BSD 1:1 Parity & Odd-Penny Preservation
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CUSTOM ENUM TYPES
-- ==============================================================================

CREATE TYPE user_role AS ENUM (
    'admin',            -- Managing Director, General Manager, Financial Controller
    'front_desk',       -- Receptionist, Duty Manager, Night Auditor
    'concierge',        -- Chief Concierge, Guest Experience Host
    'housekeeping',     -- Executive Housekeeper, Floor Supervisor, Room Attendant
    'fnb_staff',        -- Restaurant Server, Bar Tender, Outlet Cashier
    'maintenance',      -- Chief Engineer, Facilities Technician
    'guest'             -- Registered Hotel Guest / VIP
);

CREATE TYPE room_tier AS ENUM (
    'oceanfront_villa',
    'overwater_bungalow',
    'royal_palm_suite',
    'beachfront_cottage',
    'gardenview_deluxe'
);

CREATE TYPE room_status AS ENUM (
    'vacant_clean',
    'vacant_dirty',
    'occupied_clean',
    'occupied_dirty',
    'out_of_order',
    'maintenance_hold',
    'vip_in_house'
);

CREATE TYPE booking_status AS ENUM (
    'pending_hold',     -- 15-minute checkout cart locking
    'confirmed',        -- Guaranteed with deposit/card
    'checked_in',       -- Guest physically in-house
    'checked_out',      -- Folio settled, keys returned
    'cancelled',        -- Booking cancelled prior to arrival
    'no_show'           -- Guest failed to check in
);

CREATE TYPE folio_type AS ENUM (
    'room_master',
    'personal_incidentals',
    'corporate_billing'
);

CREATE TYPE folio_status AS ENUM (
    'active',
    'settled',
    'closed'
);

CREATE TYPE payment_method AS ENUM (
    'cash_bsd',
    'cash_usd',
    'credit_card',
    'wire_transfer',
    'gift_certificate'
);

CREATE TYPE housekeeping_task_type AS ENUM (
    'departure_clean',
    'stayover_refresh',
    'turndown_service',
    'deep_disinfection'
);

CREATE TYPE task_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent_vip'
);

CREATE TYPE task_status AS ENUM (
    'dirty',
    'in_progress',
    'inspected',
    'clean'
);

CREATE TYPE maintenance_severity AS ENUM (
    'p1_urgent',        -- Causes immediate OOO (e.g. AC failure, water pipe leak)
    'p2_standard',      -- High priority, room remains usable or scheduled
    'p3_preventative'   -- Scheduled maintenance
);

CREATE TYPE maintenance_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);

CREATE TYPE vip_tier AS ENUM (
    'general',
    'pearl',
    'emerald',
    'platinum_sovereign'
);

CREATE TYPE outlet_type AS ENUM (
    'fine_dining',
    'pool_bar',
    'beach_cabana',
    'in_villa_dining'
);

CREATE TYPE order_status AS ENUM (
    'open',
    'settled',
    'voided'
);

CREATE TYPE excursion_status AS ENUM (
    'requested',
    'confirmed',
    'completed',
    'cancelled'
);

-- ==============================================================================
-- 3. CORE ENTITY TABLES (25 TABLES COVERING ALL 7 MODULES)
-- ==============================================================================

-- Table 1: Organizations (Multi-Tenant Root)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tax_tin VARCHAR(50) NOT NULL DEFAULT 'VAT-10084920-BS', -- Bahamas Tax ID
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 2: Properties (Resort Locations, e.g. Cable Beach, Paradise Island)
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    island VARCHAR(100) NOT NULL DEFAULT 'New Providence',
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Nassau',
    total_rooms INT NOT NULL DEFAULT 0 CHECK (total_rooms >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 3: Users & Staff (Linked to Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    role user_role NOT NULL DEFAULT 'guest',
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 4: Room Categories & Tiers
CREATE TABLE public.room_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    tier room_tier NOT NULL DEFAULT 'gardenview_deluxe',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_occupancy INT NOT NULL DEFAULT 2 CHECK (base_occupancy >= 1),
    max_adults INT NOT NULL DEFAULT 2 CHECK (max_adults >= 1),
    max_children INT NOT NULL DEFAULT 2 CHECK (max_children >= 0),
    has_plunge_pool BOOLEAN NOT NULL DEFAULT false,
    butler_service_tier VARCHAR(50) NOT NULL DEFAULT 'standard', -- 'standard', 'dedicated', 'private_island_sovereign'
    square_feet INT NOT NULL CHECK (square_feet > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 5: Physical Rooms & Accommodations
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.room_categories(id) ON DELETE RESTRICT,
    room_number VARCHAR(50) NOT NULL,
    floor INT NOT NULL DEFAULT 1,
    building VARCHAR(100) NOT NULL DEFAULT 'Main Ocean Pavilion',
    status room_status NOT NULL DEFAULT 'vacant_clean',
    bed_configuration VARCHAR(50) NOT NULL DEFAULT 'King',
    connecting_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    keycard_rfid_uid VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(property_id, room_number)
);

-- Table 6: Rate Plans (Dynamic Caribbean Seasonal Yield Engine)
CREATE TABLE public.rate_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.room_categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    season_type VARCHAR(50) NOT NULL DEFAULT 'high_season', -- 'high_season', 'shoulder_season', 'low_season'
    base_nightly_rate_bsd NUMERIC(10, 2) NOT NULL CHECK (base_nightly_rate_bsd >= 0.00),
    base_nightly_rate_usd NUMERIC(10, 2) NOT NULL CHECK (base_nightly_rate_usd >= 0.00), -- 1:1 Parity
    min_length_of_stay INT NOT NULL DEFAULT 1 CHECK (min_length_of_stay >= 1),
    is_non_refundable BOOLEAN NOT NULL DEFAULT false,
    discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount_pct >= 0.00 AND discount_pct <= 100.00),
    includes_breakfast BOOLEAN NOT NULL DEFAULT false,
    includes_airport_transfer BOOLEAN NOT NULL DEFAULT false,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT rate_date_order CHECK (end_date >= start_date)
);

-- Table 7: Rate Daily Overrides (Specific Date Yield Adjustments)
CREATE TABLE public.rate_daily_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_plan_id UUID NOT NULL REFERENCES public.rate_plans(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    override_rate_bsd NUMERIC(10, 2) NOT NULL CHECK (override_rate_bsd >= 0.00),
    min_length_of_stay INT,
    is_closed_to_arrival BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(rate_plan_id, override_date)
);

-- Table 8: Guests (CRM 360 Registry)
CREATE TABLE public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    passport_number VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'Bahamas',
    vip_tier vip_tier NOT NULL DEFAULT 'general',
    ltv_spend_bsd NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (ltv_spend_bsd >= 0.00),
    total_stays INT NOT NULL DEFAULT 0 CHECK (total_stays >= 0),
    total_nights INT NOT NULL DEFAULT 0 CHECK (total_nights >= 0),
    is_blacklisted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(organization_id, email)
);

-- Table 9: Guest Preferences (Dossier & Clinical Flags)
CREATE TABLE public.guest_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL UNIQUE REFERENCES public.guests(id) ON DELETE CASCADE,
    dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
    allergies TEXT[] NOT NULL DEFAULT '{}',
    medical_flags TEXT[] NOT NULL DEFAULT '{}',
    preferred_champagne VARCHAR(150),
    pillow_type VARCHAR(100) DEFAULT 'Goose Feather Soft',
    newspaper_preference VARCHAR(100),
    family_notes TEXT,
    special_requests TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 10: Bookings & Reservations
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    confirmation_number VARCHAR(50) NOT NULL UNIQUE,
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
    room_id UUID REFERENCES public.rooms(id) ON DELETE RESTRICT,
    room_category_id UUID NOT NULL REFERENCES public.room_categories(id) ON DELETE RESTRICT,
    rate_plan_id UUID NOT NULL REFERENCES public.rate_plans(id) ON DELETE RESTRICT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    adults INT NOT NULL DEFAULT 1 CHECK (adults >= 1),
    children INT NOT NULL DEFAULT 0 CHECK (children >= 0),
    status booking_status NOT NULL DEFAULT 'confirmed',
    hold_expires_at TIMESTAMPTZ, -- 15-minute checkout cart locking
    estimated_arrival_time TIME DEFAULT '15:00:00',
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    digital_signature_url TEXT,
    special_requests TEXT,
    cancellation_reason TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT booking_dates_order CHECK (check_out_date > check_in_date)
);

-- Table 11: Room Moves Log
CREATE TABLE public.room_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    from_room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
    to_room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
    moved_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    moved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    luggage_transfer_completed BOOLEAN NOT NULL DEFAULT false,
    reason TEXT NOT NULL
);

-- Table 12: Folios (Guest Master & Incidental Accounts)
CREATE TABLE public.folios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
    folio_type folio_type NOT NULL DEFAULT 'room_master',
    status folio_status NOT NULL DEFAULT 'active',
    currency VARCHAR(10) NOT NULL DEFAULT 'BSD', -- Pegged 1:1 with USD
    balance_bsd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 13: Folio Transactions (Bahamian Statutory Tax & Fee Architecture)
CREATE TABLE public.folio_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_id UUID NOT NULL REFERENCES public.folios(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'room_charge', 'fnb_charge', 'concierge_charge', 'spa_charge', 'adjustment'
    description VARCHAR(255) NOT NULL,
    subtotal_bsd NUMERIC(10, 2) NOT NULL CHECK (subtotal_bsd >= 0.00),
    vat_rate NUMERIC(4, 3) NOT NULL DEFAULT 0.100, -- 10.0% Bahamas VAT
    vat_amount_bsd NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (vat_amount_bsd >= 0.00),
    resort_service_charge_pct NUMERIC(4, 3) NOT NULL DEFAULT 0.100, -- 10.0% Mandatory Service Charge
    service_charge_amount_bsd NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (service_charge_amount_bsd >= 0.00),
    hotel_levy_pct NUMERIC(4, 3) NOT NULL DEFAULT 0.100, -- 10.0% Bahamas Hotel Licensing Board Room Levy
    hotel_levy_amount_bsd NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (hotel_levy_amount_bsd >= 0.00),
    total_amount_bsd NUMERIC(10, 2) NOT NULL CHECK (total_amount_bsd >= 0.00),
    odd_penny_rounding_bsd NUMERIC(4, 2) NOT NULL DEFAULT 0.00, -- Odd-penny preservation
    posted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    source_reference_id VARCHAR(100), -- E.g. POS Order ID, Tour Booking ID
    posted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 14: Folio Payments (Multi-Tender Settlement)
CREATE TABLE public.folio_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_id UUID NOT NULL REFERENCES public.folios(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL DEFAULT 'credit_card',
    amount_bsd NUMERIC(10, 2) NOT NULL CHECK (amount_bsd > 0.00),
    amount_usd NUMERIC(10, 2) NOT NULL CHECK (amount_usd > 0.00), -- 1:1 Parity
    exchange_rate NUMERIC(6, 4) NOT NULL DEFAULT 1.0000,
    card_last_four VARCHAR(4),
    authorization_code VARCHAR(100),
    is_settled BOOLEAN NOT NULL DEFAULT true,
    processed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 15: Housekeeping Tasks
CREATE TABLE public.housekeeping_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    task_type housekeeping_task_type NOT NULL DEFAULT 'stayover_refresh',
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'dirty',
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    inspected_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 16: Maintenance Tickets & Engineering Work Orders
CREATE TABLE public.maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL, -- Nullable for public areas
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'ac_cooling', 'plumbing', 'electrical', 'carpentry', 'audio_visual'
    severity maintenance_severity NOT NULL DEFAULT 'p2_standard',
    status maintenance_status NOT NULL DEFAULT 'open',
    causes_ooo BOOLEAN NOT NULL DEFAULT false, -- If true and p1_urgent, triggers room Out-of-Order
    photo_urls TEXT[] NOT NULL DEFAULT '{}',
    reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 17: F&B Outlets & Resort Service Points
CREATE TABLE public.fnb_outlets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    outlet_type outlet_type NOT NULL DEFAULT 'fine_dining',
    operating_hours VARCHAR(100) NOT NULL DEFAULT '07:00 - 23:00',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 18: F&B Menu Categories
CREATE TABLE public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID NOT NULL REFERENCES public.fnb_outlets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 19: F&B Menu Items
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_bsd NUMERIC(10, 2) NOT NULL CHECK (price_bsd >= 0.00),
    price_usd NUMERIC(10, 2) NOT NULL CHECK (price_usd >= 0.00), -- 1:1 Parity
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_taxable BOOLEAN NOT NULL DEFAULT true, -- Subject to Bahamas 10% VAT
    recipe_code VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 20: POS Orders (Instant Room Folio Verification)
CREATE TABLE public.pos_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID NOT NULL REFERENCES public.fnb_outlets(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    folio_id UUID REFERENCES public.folios(id) ON DELETE SET NULL, -- Null for walk-in cash
    room_number VARCHAR(50),
    guest_surname_verified BOOLEAN NOT NULL DEFAULT false, -- Mandatory room folio verification
    server_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'open',
    subtotal_bsd NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal_bsd >= 0.00),
    vat_amount_bsd NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (vat_amount_bsd >= 0.00),
    service_charge_amount_bsd NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (service_charge_amount_bsd >= 0.00),
    gratuity_amount_bsd NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (gratuity_amount_bsd >= 0.00),
    grand_total_bsd NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (grand_total_bsd >= 0.00),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 21: POS Order Items
CREATE TABLE public.pos_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_bsd NUMERIC(10, 2) NOT NULL CHECK (unit_price_bsd >= 0.00),
    total_price_bsd NUMERIC(10, 2) NOT NULL CHECK (total_price_bsd >= 0.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 22: Concierge Excursion Vendors
CREATE TABLE public.concierge_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL, -- 'yacht_charter', 'bonefishing', 'island_excursion', 'seaplane'
    contact_name VARCHAR(150),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    commission_pct NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (commission_pct >= 0.00 AND commission_pct <= 100.00),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 23: Concierge Bookings & Experience Dispatch
CREATE TABLE public.concierge_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
    vendor_id UUID NOT NULL REFERENCES public.concierge_vendors(id) ON DELETE RESTRICT,
    experience_name VARCHAR(255) NOT NULL,
    excursion_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_hours NUMERIC(4, 2) NOT NULL DEFAULT 4.00,
    guests_count INT NOT NULL DEFAULT 2 CHECK (guests_count >= 1),
    retail_price_bsd NUMERIC(10, 2) NOT NULL CHECK (retail_price_bsd >= 0.00),
    vendor_cost_bsd NUMERIC(10, 2) NOT NULL CHECK (vendor_cost_bsd >= 0.00),
    commission_amount_bsd NUMERIC(10, 2) NOT NULL CHECK (commission_amount_bsd >= 0.00),
    charged_to_folio_id UUID REFERENCES public.folios(id) ON DELETE SET NULL,
    status excursion_status NOT NULL DEFAULT 'confirmed',
    special_arrangements TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 24: Staff Shifts & Labor Allocation
CREATE TABLE public.staff_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    department VARCHAR(50) NOT NULL, -- 'front_desk', 'concierge', 'housekeeping', 'fnb', 'maintenance', 'management'
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT shift_time_order CHECK (end_time > start_time)
);

-- Table 25: Immutable System & Financial Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'PRICE_OVERRIDE', 'ROOM_MOVE', 'STATUS_CHANGE', 'VOID')),
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 4. PERFORMANCE & INTEGRITY INDEXES (SUPABASE BEST PRACTICES)
-- ==============================================================================

-- 4.1 Bookings Composite Date Range & Conflict Indexes (<5ms lookup)
CREATE INDEX idx_bookings_lookup
    ON public.bookings (property_id, check_in_date, check_out_date, status);

-- Supabase Rule 1.5: Partial Index for Active Room Collisions
CREATE INDEX idx_bookings_room_active_range
    ON public.bookings (room_id, check_in_date, check_out_date)
    WHERE status NOT IN ('cancelled', 'no_show');

-- Category Availability Index for Dynamic Yield Engine
CREATE INDEX idx_bookings_category_active_range
    ON public.bookings (room_category_id, check_in_date, check_out_date)
    WHERE status NOT IN ('cancelled', 'no_show');

-- Supabase Rule 4.2: Foreign Key Indexes on Bookings
CREATE INDEX idx_bookings_guest_id ON public.bookings (guest_id);
CREATE INDEX idx_bookings_rate_plan_id ON public.bookings (rate_plan_id);
CREATE INDEX idx_bookings_room_id ON public.bookings (room_id) WHERE room_id IS NOT NULL;
CREATE INDEX idx_bookings_created_by ON public.bookings (created_by) WHERE created_by IS NOT NULL;

-- 4.2 Rooms & Tape Chart Matrix Indexes
CREATE INDEX idx_rooms_property_status ON public.rooms (property_id, status);
CREATE INDEX idx_rooms_category_id ON public.rooms (category_id);
CREATE INDEX idx_rooms_connecting_room ON public.rooms (connecting_room_id) WHERE connecting_room_id IS NOT NULL;

-- 4.3 Guest CRM Search Indexes (<150ms lookup)
CREATE INDEX idx_guests_search ON public.guests (organization_id, last_name, first_name, phone);
CREATE INDEX idx_guests_email ON public.guests (email);
CREATE INDEX idx_guests_vip_tier ON public.guests (vip_tier);

-- 4.4 Folio & Multi-Tender Financial Indexes
CREATE INDEX idx_folios_booking_id ON public.folios (booking_id);
CREATE INDEX idx_folios_guest_id ON public.folios (guest_id);
CREATE INDEX idx_folio_transactions_folio_id ON public.folio_transactions (folio_id, posted_at DESC);
CREATE INDEX idx_folio_payments_folio_id ON public.folio_payments (folio_id);
CREATE INDEX idx_folio_payments_processed_by ON public.folio_payments (processed_by);

-- 4.5 Housekeeping & Maintenance Queue Indexes
CREATE INDEX idx_housekeeping_queue ON public.housekeeping_tasks (property_id, scheduled_date, status, priority);
CREATE INDEX idx_housekeeping_assigned_to ON public.housekeeping_tasks (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_housekeeping_room_id ON public.housekeeping_tasks (room_id);

CREATE INDEX idx_maintenance_tickets_status ON public.maintenance_tickets (property_id, status, severity);
CREATE INDEX idx_maintenance_tickets_room_id ON public.maintenance_tickets (room_id) WHERE room_id IS NOT NULL;

-- 4.6 POS & F&B Foreign Key Indexes
CREATE INDEX idx_menu_categories_outlet_id ON public.menu_categories (outlet_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_items (category_id);
CREATE INDEX idx_pos_orders_outlet_id ON public.pos_orders (outlet_id);
CREATE INDEX idx_pos_orders_folio_id ON public.pos_orders (folio_id) WHERE folio_id IS NOT NULL;
CREATE INDEX idx_pos_order_items_order_id ON public.pos_order_items (order_id);
CREATE INDEX idx_pos_order_items_menu_item_id ON public.pos_order_items (menu_item_id);

-- 4.7 Concierge Foreign Key Indexes
CREATE INDEX idx_concierge_bookings_booking_id ON public.concierge_bookings (booking_id);
CREATE INDEX idx_concierge_bookings_vendor_id ON public.concierge_bookings (vendor_id);
CREATE INDEX idx_concierge_bookings_date ON public.concierge_bookings (excursion_date, status);

-- 4.8 Staff Shift Indexes
CREATE INDEX idx_staff_shifts_lookup ON public.staff_shifts (property_id, shift_date, department);
CREATE INDEX idx_staff_shifts_user_id ON public.staff_shifts (user_id);

-- ==============================================================================
-- 5. BUSINESS LOGIC FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 5.1 Updated-At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_orgs_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.room_categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_rate_plans_updated_at BEFORE UPDATE ON public.rate_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_folios_updated_at BEFORE UPDATE ON public.folios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_housekeeping_updated_at BEFORE UPDATE ON public.housekeeping_tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_maintenance_updated_at BEFORE UPDATE ON public.maintenance_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_pos_orders_updated_at BEFORE UPDATE ON public.pos_orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.2 Room Collision Detection Engine (<5ms query)
CREATE OR REPLACE FUNCTION public.check_room_booking_collision(
    p_room_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
    has_collision BOOLEAN,
    conflicting_booking_id UUID
) AS $$
DECLARE
    v_conflict UUID;
BEGIN
    SELECT id INTO v_conflict
    FROM public.bookings
    WHERE room_id = p_room_id
      AND status NOT IN ('cancelled', 'no_show')
      AND (p_exclude_booking_id IS NULL OR id <> p_exclude_booking_id)
      AND (check_in_date < p_check_out AND check_out_date > p_check_in)
    LIMIT 1;

    IF v_conflict IS NOT NULL THEN
        RETURN QUERY SELECT true, v_conflict;
    ELSE
        RETURN QUERY SELECT false, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5.3 Maintenance P1 Triage Trigger: Switches room to Out-of-Order (OOO)
CREATE OR REPLACE FUNCTION public.handle_maintenance_room_ooo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.severity = 'p1_urgent' AND NEW.causes_ooo = true AND NEW.room_id IS NOT NULL AND NEW.status = 'open' THEN
        UPDATE public.rooms
        SET status = 'out_of_order'
        WHERE id = NEW.room_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintenance_ooo_trigger
AFTER INSERT OR UPDATE OF severity, status, causes_ooo ON public.maintenance_tickets
FOR EACH ROW
EXECUTE FUNCTION public.handle_maintenance_room_ooo();

-- 5.4 Executive Flash Report Aggregation Function
CREATE OR REPLACE FUNCTION public.get_daily_flash_report(
    p_property_id UUID,
    p_report_date DATE
)
RETURNS TABLE (
    property_name VARCHAR,
    total_rooms INT,
    rooms_available INT,
    rooms_sold INT,
    rooms_ooo INT,
    occupancy_pct NUMERIC,
    room_revenue_bsd NUMERIC,
    adr_bsd NUMERIC,
    revpar_bsd NUMERIC,
    fnb_revenue_bsd NUMERIC,
    total_revenue_bsd NUMERIC
) AS $$
DECLARE
    v_total_rooms INT;
    v_rooms_ooo INT;
    v_rooms_sold INT;
    v_available INT;
    v_room_rev NUMERIC;
    v_fnb_rev NUMERIC;
    v_occ_pct NUMERIC;
    v_adr NUMERIC;
    v_revpar NUMERIC;
    v_prop_name VARCHAR;
BEGIN
    SELECT name, total_rooms INTO v_prop_name, v_total_rooms
    FROM public.properties WHERE id = p_property_id;

    -- Count Out-of-Order rooms
    SELECT COUNT(*) INTO v_rooms_ooo
    FROM public.rooms
    WHERE property_id = p_property_id AND status = 'out_of_order';

    v_available := GREATEST(v_total_rooms - v_rooms_ooo, 1);

    -- Count in-house / sold rooms on report date
    SELECT COUNT(*), COALESCE(SUM(ft.subtotal_bsd), 0.00)
    INTO v_rooms_sold, v_room_rev
    FROM public.bookings b
    JOIN public.folios f ON f.booking_id = b.id
    LEFT JOIN public.folio_transactions ft ON ft.folio_id = f.id AND ft.transaction_type = 'room_charge' AND ft.posted_at::DATE = p_report_date
    WHERE b.property_id = p_property_id
      AND b.status IN ('checked_in', 'checked_out')
      AND (b.check_in_date <= p_report_date AND b.check_out_date > p_report_date);

    -- Calculate F&B revenue for report date
    SELECT COALESCE(SUM(subtotal_bsd), 0.00) INTO v_fnb_rev
    FROM public.pos_orders po
    JOIN public.fnb_outlets o ON o.id = po.outlet_id
    WHERE o.property_id = p_property_id
      AND po.status = 'settled'
      AND po.created_at::DATE = p_report_date;

    v_occ_pct := ROUND((v_rooms_sold::NUMERIC / v_available::NUMERIC) * 100.0, 2);
    v_adr := CASE WHEN v_rooms_sold > 0 THEN ROUND(v_room_rev / v_rooms_sold, 2) ELSE 0.00 END;
    v_revpar := ROUND((v_room_rev / v_available), 2);

    RETURN QUERY SELECT 
        v_prop_name,
        v_total_rooms,
        v_available,
        v_rooms_sold,
        v_rooms_ooo,
        v_occ_pct,
        v_room_rev,
        v_adr,
        v_revpar,
        v_fnb_rev,
        (v_room_rev + v_fnb_rev);
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES (100% INITPLAN OPTIMIZED)
-- ==============================================================================

-- Enable RLS across all 25 tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_daily_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fnb_outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Force RLS on all tables (Supabase Rule 3.2: prevent owner bypass)
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.properties FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.room_categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rooms FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rate_plans FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rate_daily_overrides FORCE ROW LEVEL SECURITY;
ALTER TABLE public.guests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.guest_preferences FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.room_moves FORCE ROW LEVEL SECURITY;
ALTER TABLE public.folios FORCE ROW LEVEL SECURITY;
ALTER TABLE public.folio_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.folio_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping_tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fnb_outlets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pos_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pos_order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_vendors FORCE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- Helper function to fetch requesting user's role (Hardened with search_path = '' and cached subquery)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.users WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- Helper function to fetch requesting user's organization
CREATE OR REPLACE FUNCTION public.get_auth_org()
RETURNS UUID AS $$
    SELECT organization_id FROM public.users WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- 6.1 ORGANIZATIONS & PROPERTIES
CREATE POLICY "Organizations viewable by members"
    ON public.organizations FOR SELECT TO authenticated
    USING (id = (SELECT public.get_auth_org()));

CREATE POLICY "Properties viewable by org staff and guests"
    ON public.properties FOR SELECT TO authenticated
    USING (organization_id = (SELECT public.get_auth_org()));

CREATE POLICY "Properties manageable by admin only"
    ON public.properties FOR ALL TO authenticated
    USING ((SELECT public.get_auth_role()) = 'admin');

-- 6.2 USERS & PROFILES
CREATE POLICY "Users viewable by same organization"
    ON public.users FOR SELECT TO authenticated
    USING (organization_id = (SELECT public.get_auth_org()));

CREATE POLICY "Users can update own record"
    ON public.users FOR UPDATE TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Admin full management of users"
    ON public.users FOR ALL TO authenticated
    USING ((SELECT public.get_auth_role()) = 'admin');

-- 6.3 ROOM CATEGORIES, ROOMS & RATES
CREATE POLICY "Categories viewable by all authenticated"
    ON public.room_categories FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Rooms viewable by all authenticated"
    ON public.rooms FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Rooms updateable by front_desk, housekeeping and admin"
    ON public.rooms FOR UPDATE TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'housekeeping'))
    WITH CHECK ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'housekeeping'));

CREATE POLICY "Rates viewable by all authenticated"
    ON public.rate_plans FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Rates manageable by admin only"
    ON public.rate_plans FOR ALL TO authenticated
    USING ((SELECT public.get_auth_role()) = 'admin');

CREATE POLICY "Rate overrides viewable by authenticated"
    ON public.rate_daily_overrides FOR SELECT TO authenticated
    USING (true);

-- 6.4 GUEST CRM & PREFERENCES
CREATE POLICY "Guests viewable by staff"
    ON public.guests FOR SELECT TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'concierge'));

CREATE POLICY "Guests manageable by staff"
    ON public.guests FOR ALL TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'concierge'));

CREATE POLICY "Preferences viewable by staff"
    ON public.guest_preferences FOR SELECT TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'concierge', 'fnb_staff'));

CREATE POLICY "Preferences updateable by staff"
    ON public.guest_preferences FOR ALL TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'concierge'));

-- 6.5 BOOKINGS & ROOM MOVES
CREATE POLICY "Bookings viewable by staff and owning guest"
    ON public.bookings FOR SELECT TO authenticated
    USING (
        (SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'concierge', 'housekeeping') OR
        guest_id IN (SELECT g.id FROM public.guests g WHERE g.email = (SELECT u.email FROM public.users u WHERE u.id = (SELECT auth.uid())))
    );

CREATE POLICY "Bookings manageable by front_desk and admin"
    ON public.bookings FOR ALL TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk'));

CREATE POLICY "Room moves viewable by staff"
    ON public.room_moves FOR SELECT TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'housekeeping'));

CREATE POLICY "Room moves insertable by front_desk and admin"
    ON public.room_moves FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.get_auth_role()) IN ('admin', 'front_desk'));

-- 6.6 FOLIOS, TRANSACTIONS & PAYMENTS (Strict Financial Isolation)
CREATE POLICY "Folios viewable by front_desk, admin, and guest"
    ON public.folios FOR SELECT TO authenticated
    USING (
        (SELECT public.get_auth_role()) IN ('admin', 'front_desk') OR
        guest_id IN (SELECT g.id FROM public.guests g WHERE g.email = (SELECT u.email FROM public.users u WHERE u.id = (SELECT auth.uid())))
    );

CREATE POLICY "Folio transactions viewable by front_desk, admin and guest"
    ON public.folio_transactions FOR SELECT TO authenticated
    USING (
        (SELECT public.get_auth_role()) IN ('admin', 'front_desk') OR
        folio_id IN (
            SELECT f.id FROM public.folios f 
            JOIN public.guests g ON g.id = f.guest_id 
            WHERE g.email = (SELECT u.email FROM public.users u WHERE u.id = (SELECT auth.uid()))
        )
    );

CREATE POLICY "Folio transactions postable by front_desk, fnb, concierge and admin"
    ON public.folio_transactions FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'fnb_staff', 'concierge'));

CREATE POLICY "Payments manageable by front_desk and admin"
    ON public.folio_payments FOR ALL TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk'));

-- 6.7 HOUSEKEEPING & MAINTENANCE
CREATE POLICY "Housekeeping tasks viewable by staff"
    ON public.housekeeping_tasks FOR SELECT TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'housekeeping'));

CREATE POLICY "Housekeeping tasks updateable by assigned attendant and supervisors"
    ON public.housekeeping_tasks FOR UPDATE TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'housekeeping'))
    WITH CHECK ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'housekeeping'));

CREATE POLICY "Maintenance tickets viewable by staff"
    ON public.maintenance_tickets FOR SELECT TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'maintenance', 'housekeeping'));

CREATE POLICY "Maintenance tickets reportable by all staff"
    ON public.maintenance_tickets FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'maintenance', 'housekeeping', 'fnb_staff', 'concierge'));

CREATE POLICY "Maintenance tickets manageable by maintenance and admin"
    ON public.maintenance_tickets FOR UPDATE TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'maintenance', 'front_desk'))
    WITH CHECK ((SELECT public.get_auth_role()) IN ('admin', 'maintenance', 'front_desk'));

-- 6.8 F&B OUTLETS, MENUS & POS
CREATE POLICY "Outlets and menus viewable by all authenticated"
    ON public.fnb_outlets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Menu categories viewable by all authenticated"
    ON public.menu_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Menu items viewable by all authenticated"
    ON public.menu_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "POS orders viewable by fnb_staff, front_desk and admin"
    ON public.pos_orders FOR SELECT TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'front_desk', 'fnb_staff'));

CREATE POLICY "POS orders manageable by fnb_staff and admin"
    ON public.pos_orders FOR ALL TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'fnb_staff'));

CREATE POLICY "Order items manageable by fnb_staff and admin"
    ON public.pos_order_items FOR ALL TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'fnb_staff'));

-- 6.9 CONCIERGE & STAFF SHIFTS
CREATE POLICY "Vendors viewable by concierge and admin"
    ON public.concierge_vendors FOR SELECT TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'concierge', 'front_desk'));

CREATE POLICY "Concierge bookings viewable by concierge, front_desk and admin"
    ON public.concierge_bookings FOR SELECT TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'concierge', 'front_desk'));

CREATE POLICY "Concierge bookings manageable by concierge and admin"
    ON public.concierge_bookings FOR ALL TO authenticated
    USING ((SELECT public.get_auth_role()) IN ('admin', 'concierge'));

CREATE POLICY "Staff shifts viewable by staff members"
    ON public.staff_shifts FOR SELECT TO authenticated
    USING (
        (SELECT public.get_auth_role()) = 'admin' OR
        user_id = (SELECT auth.uid()) OR
        department = (SELECT department FROM public.staff_shifts WHERE user_id = (SELECT auth.uid()) LIMIT 1)
    );

CREATE POLICY "Audit logs viewable by admin only"
    ON public.audit_logs FOR SELECT TO authenticated
    USING ((SELECT public.get_auth_role()) = 'admin');

-- ==============================================================================
-- 7. PRODUCTION SEED DATA (BAHAMAS PARADISE ISLAND & CABLE BEACH DEMO)
-- ==============================================================================

-- 7.1 Organization & Property
INSERT INTO public.organizations (id, name, tax_tin) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'The Ocean Pearl Luxury Resorts & Private Cays Ltd.', 'VAT-10084920-BS');

INSERT INTO public.properties (id, organization_id, name, island, address, phone, email, total_rooms) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'The Royal Bahamian Ocean Resort & Private Cay', 'New Providence (Cable Beach)', '1000 Cable Beach Boulevard, Nassau, The Bahamas', '+1-242-555-PEARL', 'concierge@oceanpearlbahamas.com', 5);

-- 7.2 Staff Profiles
INSERT INTO public.users (id, organization_id, property_id, role, full_name, email, phone) VALUES
('11111111-1111-1111-1111-111111111101', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin', 'Sir Alistair Christie', 'alistair.christie@oceanpearlbahamas.com', '+1-242-555-0101'),
('11111111-1111-1111-1111-111111111102', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'front_desk', 'Chantal Bain', 'chantal.bain@oceanpearlbahamas.com', '+1-242-555-0102'),
('11111111-1111-1111-1111-111111111103', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'concierge', 'Tariq Strachan', 'tariq.strachan@oceanpearlbahamas.com', '+1-242-555-0103'),
('11111111-1111-1111-1111-111111111104', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'housekeeping', 'Marva Knowles', 'marva.knowles@oceanpearlbahamas.com', '+1-242-555-0104'),
('11111111-1111-1111-1111-111111111105', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'fnb_staff', 'Jevon Rolle', 'jevon.rolle@oceanpearlbahamas.com', '+1-242-555-0105'),
('11111111-1111-1111-1111-111111111106', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'maintenance', 'Devon Major', 'devon.major@oceanpearlbahamas.com', '+1-242-555-0106');

-- 7.3 Room Categories & Accommodations
INSERT INTO public.room_categories (id, property_id, tier, name, description, base_occupancy, max_adults, max_children, has_plunge_pool, butler_service_tier, square_feet) VALUES
('cccccccc-cccc-cccc-cccc-cccccccc0001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'oceanfront_villa', 'Sovereign Oceanfront Estate Villa', 'Two-story private compound with direct white sand beach access, private infinity pool, and dedicated 24-hour British Butler service.', 4, 4, 2, true, 'private_island_sovereign', 4200),
('cccccccc-cccc-cccc-cccc-cccccccc0002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'overwater_bungalow', 'Exuma Overwater Turquoise Bungalow', 'Suspended over turquoise waters with glass floor viewing panels, overwater hammock, and private ocean ladder.', 2, 2, 0, true, 'dedicated', 1850),
('cccccccc-cccc-cccc-cccc-cccccccc0003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'royal_palm_suite', 'Royal Palm Penthouse Suite', 'Top-floor panoramic ocean suite with expansive wraparound mahogany terrace and outdoor spa soaking tub.', 2, 3, 1, false, 'dedicated', 1600),
('cccccccc-cccc-cccc-cccc-cccccccc0004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'beachfront_cottage', 'Hibiscus Beachfront Cottage', 'Secluded tropical garden-fringed beachfront cottage steps away from the tranquil lagoon.', 2, 2, 2, false, 'standard', 1150),
('cccccccc-cccc-cccc-cccc-cccccccc0005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gardenview_deluxe', 'Bimini Sands Gardenview Deluxe Chamber', 'Spacious coastal chic retreat overlooking lush botanical gardens with marble bath.', 2, 2, 1, false, 'standard', 850);

-- Physical Rooms
INSERT INTO public.rooms (id, property_id, category_id, room_number, floor, building, status, bed_configuration) VALUES
('dddddddd-dddd-dddd-dddd-dddddddd0001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccc0001', 'Villa 101', 1, 'Presidential Cay Pavilion', 'occupied_clean', 'Two Emperor Kings'),
('dddddddd-dddd-dddd-dddd-dddddddd0002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccc0002', 'Overwater 201', 1, 'Reef Pier North', 'occupied_clean', 'Grand King'),
('dddddddd-dddd-dddd-dddd-dddddddd0003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccc0003', 'Suite 501', 5, 'Ocean Royal Tower', 'vacant_clean', 'California King'),
('dddddddd-dddd-dddd-dddd-dddddddd0004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccc0004', 'Cottage 301', 1, 'Sunset Beach Enclave', 'vacant_dirty', 'King + Daybed'),
('dddddddd-dddd-dddd-dddd-dddddddd0005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccc0005', 'Room 102', 1, 'Palm Garden Wing', 'out_of_order', 'King');

-- 7.4 Rate Plans (High Season Caribbean Yield)
INSERT INTO public.rate_plans (id, property_id, category_id, name, season_type, base_nightly_rate_bsd, base_nightly_rate_usd, min_length_of_stay, includes_breakfast, includes_airport_transfer, start_date, end_date) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeee0001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccc0001', 'Sovereign Winter Escape (High Season)', 3450.00, 3450.00, 3, true, true, '2026-12-15', '2027-04-30'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeee0002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccc0002', 'Overwater Romance Package (High Season)', 1950.00, 1950.00, 2, true, true, '2026-12-15', '2027-04-30'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeee0003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccc0003', 'Penthouse Luxury Daily (Standard)', 1450.00, 1450.00, 1, true, false, '2026-11-01', '2027-05-31');

-- 7.5 Guests & CRM 360 Records
INSERT INTO public.guests (id, organization_id, first_name, last_name, email, phone, passport_number, country, vip_tier, ltv_spend_bsd, total_stays, total_nights) VALUES
('ffffffff-ffff-ffff-ffff-ffffffff0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lord Harrison', 'Montague', 'h.montague@mayfairholdings.co.uk', '+44-20-7946-0912', 'GBR-9982014A', 'United Kingdom', 'platinum_sovereign', 48500.00, 5, 22),
('ffffffff-ffff-ffff-ffff-ffffffff0002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Camila', 'Vargas-Silva', 'camila.vargas@silvacapital.com', '+1-305-555-8821', 'USA-44920199', 'United States', 'emerald', 18200.00, 3, 11);

INSERT INTO public.guest_preferences (guest_id, dietary_restrictions, allergies, medical_flags, preferred_champagne, pillow_type, special_requests) VALUES
('ffffffff-ffff-ffff-ffff-ffffffff0001', ARRAY['Shellfish Allergy', 'Gluten-Free'], ARRAY['Lobster', 'Shrimp', 'Penicillin'], ARRAY['Asthma'], 'Dom Pérignon Vintage 2013', 'Buckwheat & Hypoallergenic Silk', 'VIP Butler to meet on private yacht arrival. Chilled bottle ready in Villa 101.');

-- 7.6 Active Bookings & Folios
INSERT INTO public.bookings (
    id, property_id, confirmation_number, guest_id, room_id, room_category_id, rate_plan_id,
    check_in_date, check_out_date, adults, children, status, estimated_arrival_time, checked_in_at
) VALUES (
    '10101010-1010-1010-1010-101010101001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'BHR-2026-8821',
    'ffffffff-ffff-ffff-ffff-ffffffff0001',
    'dddddddd-dddd-dddd-dddd-dddddddd0001', -- Villa 101
    'cccccccc-cccc-cccc-cccc-cccccccc0001',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeee0001',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '5 days',
    2, 0,
    'checked_in',
    '14:00:00',
    timezone('utc', now() - INTERVAL '3 hours')
);

INSERT INTO public.folios (id, booking_id, guest_id, folio_type, status, balance_bsd) VALUES
('20202020-2020-2020-2020-202020202001', '10101010-1010-1010-1010-101010101001', 'ffffffff-ffff-ffff-ffff-ffffffff0001', 'room_master', 'active', 4485.00);

-- Folio Nightly Charge with Full Bahamian Statutory Breakdown:
-- Base Rate: $3,450.00
-- Bahamas VAT @ 10%: $345.00
-- Resort Service Charge @ 10%: $345.00
-- Bahamas National Hotel Levy @ 10%: $345.00
-- Total Nightly Folio Posting: $4,485.00
INSERT INTO public.folio_transactions (
    folio_id, transaction_type, description, subtotal_bsd,
    vat_rate, vat_amount_bsd,
    resort_service_charge_pct, service_charge_amount_bsd,
    hotel_levy_pct, hotel_levy_amount_bsd,
    total_amount_bsd, source_reference_id
) VALUES (
    '20202020-2020-2020-2020-202020202001',
    'room_charge',
    'Nightly Lodging: Sovereign Oceanfront Estate Villa (101)',
    3450.00,
    0.100, 345.00,
    0.100, 345.00,
    0.100, 345.00,
    4485.00,
    'NIGHT-AUDIT-2026-11-14'
);

-- 7.7 F&B Outlets & Menu
INSERT INTO public.fnb_outlets (id, property_id, name, outlet_type, operating_hours) VALUES
('30303030-3030-3030-3030-303030303001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sunset Pier Oceanfront Dining', 'fine_dining', '17:30 - 23:00'),
('30303030-3030-3030-3030-303030303002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Driftwood Coral Pool Bar', 'pool_bar', '10:00 - 19:00');

INSERT INTO public.menu_categories (id, outlet_id, name, display_order) VALUES
('40404040-4040-4040-4040-404040404001', '30303030-3030-3030-3030-303030303001', 'Chef Special Degustation', 1);

INSERT INTO public.menu_items (id, category_id, name, description, price_bsd, price_usd, is_available) VALUES
('50505050-5050-5050-5050-505050505001', '40404040-4040-4040-4040-404040404001', 'Pan-Seared Yellowtail Snapper with Coconut Plantain Mash', 'Local reef catch with citrus ginger glaze.', 68.00, 68.00, true);

-- 7.8 Maintenance Ticket (P1 Urgent causing Room 102 to be Out-of-Order)
INSERT INTO public.maintenance_tickets (
    property_id, room_id, title, description, category, severity, status, causes_ooo, reported_by
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'dddddddd-dddd-dddd-dddd-dddddddd0005', -- Room 102
    'Chilled Water Chiller Fan Coil Breakdown',
    'Master bedroom AC compressor failure, temperature reached 84F. Compressor replacement ordered.',
    'ac_cooling',
    'p1_urgent',
    'open',
    true,
    '11111111-1111-1111-1111-111111111104' -- Marva Knowles
);

-- 7.9 Concierge Vendor & Excursion
INSERT INTO public.concierge_vendors (id, organization_id, name, service_type, email, phone, commission_pct) VALUES
('60606060-6060-6060-6060-606060606001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Exuma Cays Private Yacht & Aviation Charters', 'yacht_charter', 'bookings@exumacharters.bs', '+1-242-555-BOAT', 20.00);

INSERT INTO public.concierge_bookings (
    booking_id, guest_id, vendor_id, experience_name, excursion_date, start_time, duration_hours,
    guests_count, retail_price_bsd, vendor_cost_bsd, commission_amount_bsd, charged_to_folio_id, status, created_by
) VALUES (
    '10101010-1010-1010-1010-101010101001',
    'ffffffff-ffff-ffff-ffff-ffffffff0001',
    '60606060-6060-6060-6060-606060606001',
    'Private 65ft Sunseeker Exuma Cays Swimming Pigs Day Expedition',
    CURRENT_DATE + INTERVAL '2 days',
    '08:30:00',
    8.00,
    2,
    4800.00,
    3840.00,
    960.00,
    '20202020-2020-2020-2020-202020202001',
    'confirmed',
    '11111111-1111-1111-1111-111111111103'
);
