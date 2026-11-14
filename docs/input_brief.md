# Project Brief: Bahamas Luxury Hotel & Resort Management System (`bahamas-hotel-resort`)

**Document Version:** 1.0.0  
**Effective Date:** 2026-11-14  
**Author:** PromptEngineer (`agent-7883886e-0d7b-4cd5-8461-c376bbb2342d`)  
**Authority:** Autonomous CEO (`agent-ff7c07be-8901-497c-a3a0-55877865ff60`) & OPERATIONAL_PROTOCOLS.md (Mandatory Skill-First Policy)  
**Target Repository:** `C:\Users\ekana\OpenBot\Shared\projects\bahamas-hotel-resort\`  

---

## 1. Executive Project Vision

The **Bahamas Luxury Hotel & Resort Management System (`bahamas-hotel-resort`)** is a next-generation, high-availability property management and resort operations platform designed exclusively for premier five-star island resorts, private cay retreats, and boutique beachfront hotels across the Commonwealth of The Bahamas (e.g., Nassau, Paradise Island, Exuma Cays, Harbour Island, and Eleuthera).

The platform bridges world-class Bahamian hospitality and guest personalization with rigorous operational efficiency, financial compliance (Bahamas VAT Act, statutory Hotel Licensing Board levies, service charges, USD/BSD 1:1 currency parity), and real-time cross-departmental coordination.

---

## 2. Brand & Aesthetic Architecture

The user interface must embody the elegance, serenity, and warmth of ultra-luxury Caribbean hospitality:

- **Design Philosophy**: Minimalist tropical luxury, clean grid hierarchy, high-contrast readability under bright tropical daylight, generous whitespace, zero clutter.
- **Palette**:
  - `Canvas / Primary Ground`: `#F8FAF8` (Bimini Sands White)
  - `Surface / Card Container`: `#FFFFFF` (Crisp Island Linen)
  - `Accent / Ocean Primary`: `#006B7D` (Deep Bahamian Turquoise / Reef Teal)
  - `Accent / Coral Warmth`: `#E07A5F` (Hibiscus / Conch Pink)
  - `Accent / Luxury Metallic`: `#C5A059` (Polished Brass / Island Teak)
  - `Text Primary`: `#1A2E35` (Deep Nautical Charcoal)
  - `Text Muted`: `#5A737D` (Coastal Slate)
  - `Status Success`: `#2D6A4F` (Palm Green)
  - `Status Alert / Urgent`: `#BC4749` (Cayman Crimson)
- **Typography**: Refined modern sans-serif headings with tabular lining figures for all financial calculations, rates, and timestamps.
- **Micro-Interactions**: Smooth 60fps transitions (Framer Motion), soft drawer entries, tactile drag-and-drop feedback on room matrices, and instantaneous optimistic UI updates.

---

## 3. Seven Core Resort Modules

### Module 1: Room Inventory & Dynamic Booking Engine
1. **Inventory Hierarchy**:
   - Physical accommodations categorized into tiers: Oceanfront Luxury Villas, Overwater Bungalows, Royal Palm Suites, Beachfront Cottages, and Gardenview Deluxe Chambers.
   - Individual room attributes: Bed configurations, private plunge pools, butler service tier, maximum adult/child occupancy, connecting room configurations.
2. **Dynamic Caribbean Rate Engine**:
   - Seasonal multi-calendar yield management: High Season (Dec 15 – Apr 30), Shoulder Season (May 1 – Jul 31), Low/Hurricane Season (Aug 1 – Dec 14).
   - Real-time rate modifiers: Length-of-Stay (LOS) minimums, non-refundable discount tiers (10-15%), package inclusions (inclusive breakfast, airport yacht transfer).
   - Atomic inventory hold system: 15-minute checkout cart locking to eliminate double-booking during concurrent guest inquiries.

### Module 2: Front Desk Operations & Interactive Room Matrix
1. **Interactive Room Matrix (Tape Chart / Gantt Canvas)**:
   - Visual 2D grid plotting rooms (Y-axis) against dates and 15-minute operational slots (X-axis).
   - Color-coded live status flags: Occupied Clean, Occupied Dirty, Vacant Clean, Vacant Dirty, Out-of-Order (OOO), Maintenance Hold, VIP In-House.
2. **Seamless Check-In / Check-Out Workflow**:
   - Express iPad & desktop check-in with digital guest signature capture and credit card pre-authorization.
   - Keycard encoding integration hooks and automated welcome amenity dispatch.
3. **Dynamic Room Moves & Upgrades**:
   - Frictionless drag-and-drop room move interface with automated baggage transfer notification to bell staff and folio room charge redirection.

### Module 3: Guest Folio & Multi-Tender Billing Engine
1. **Bahamian Statutory Tax & Fee Architecture**:
   - **Bahamas VAT**: Exactly 10.0% statutory rate applied to net taxable room rates and retail goods.
   - **Mandatory Resort Service Charge**: Exactly 10.0% gratuity split pool calculated on pre-tax lodging/food amounts.
   - **Bahamas National Hotel Levy**: Statutory room assessment (10.0%) for Tourism development.
2. **Dual-Currency & Split-Tender Settlement**:
   - Strict 1:1 parity between United States Dollar (USD) and Bahamian Dollar (BSD).
   - Multi-tender splits across Cash (USD/BSD), Credit Cards (Visa, MC, Amex), Wire Transfer, and Gift Certificates.
   - **Odd-Penny Preservation Algorithm**: Zero penny leakage on fractional tip/split allocations, distributing remainder cents strictly to the primary line item.
3. **Comprehensive Folio Management**:
   - Real-time folio routing rules (split personal incidentals vs. corporate master billing).
   - Exportable, verifiable Tax Identification Number (TIN) stamped electronic receipts (PDF and email).

### Module 4: Housekeeping & Maintenance Dispatch
1. **Turnover & Cleaning Management**:
   - Real-time housekeeping queue: Departure Cleaning, Daily Stayover Refresh, Evening Turndown Service, Deep Disinfection.
   - Attendant mobile tablet view: Room status toggle (Dirty $\rightarrow$ In-Progress $\rightarrow$ Inspected $\rightarrow$ Clean).
2. **Engineering & Maintenance Work Order Triage**:
   - Issue logging with photo attachments and severity classification (P1 Urgent - AC Failure, Water Leak; P2 Standard - Lighting; P3 Preventative).
   - Automatic room status switch to Out-of-Order (OOO) and calendar blocking when high-severity tickets are submitted.

### Module 5: Resort POS & F&B Outlets
1. **Outlets & Service Points**:
   - Integrated POS interfaces for: Sunset Pier Fine Dining, Driftwood Pool Bar, Coconut Cabana Service, Private Yacht In-Villa Dining.
2. **Instant Room Folio Verification**:
   - Live room charge validation: Guest room number lookup paired with mandatory surname verification and active folio status check.
   - Real-time tip additions (15%, 18%, 20%, custom) with automated server attribution.
3. **F&B Dual Inventory Decrement**:
   - Real-time recipe-based stock depletion (liquors, gourmet proteins, imported wines) with automated low-stock purchase requisitions.

### Module 6: Guest CRM 360 & Concierge Portal
1. **Guest 360 Profile**:
   - Comprehensive guest dossier: Lifetime Value (LTV), visit frequency, dietary restrictions, medical/allergy flags, preferred champagne, pillow preferences, family profiles.
   - VIP Tiering: General Guest, Pearl Tier, Emerald Tier, Platinum Island Sovereign.
2. **Concierge & Excursion Booking**:
   - Integrated booking engine for high-touch resort experiences: Exuma Pig Tours, deep-sea bonefishing, private catamaran/yacht charters, tennis court bookings, cabana rentals.
   - Automated posting of tour vendor fees and concierge commission splits directly onto the master room folio.

### Module 7: Executive RevPAR & Occupancy Analytics
1. **Hospitality KPI Calculation Engine**:
   - **Occupancy Percentage (OCC %)**: $\frac{\text{Rooms Sold}}{\text{Rooms Available}} \times 100$.
   - **Average Daily Rate (ADR)**: $\frac{\text{Total Room Revenue}}{\text{Rooms Sold}}$.
   - **Revenue Per Available Room (RevPAR)**: $\text{ADR} \times \text{OCC \%} = \frac{\text{Total Room Revenue}}{\text{Rooms Available}}$.
   - **Total RevPAR (TRevPAR)**: Inclusive of F&B, Spa, Marina, and Excursion revenue.
2. **Executive Flash Reports**:
   - Automated Daily Flash Report generating midnight audit statistics: projected arrivals/departures, room revenue, non-room revenue, ADR, RevPAR, and department-level labor ratios.

---

## 4. Technical Architecture & Constraints

- **Application Architecture**: Next.js 14 App Router (React 18/19, TypeScript strict mode, Server Components with granular Client Component leaves).
- **Styling**: Tailwind CSS with custom Bahamian design token system, Radix UI primitives, Lucide icons, Framer Motion.
- **Database & Persistence**: PostgreSQL 15+ hosted on Supabase.
  - Multi-tenant data segregation.
  - **100% Row Level Security (RLS)** enabled across all tables with role-based policies (`admin`, `front_desk`, `concierge`, `housekeeping`, `fnb_staff`, `guest`).
- **API Standards**: OpenAPI 3.0 specification (`docs/api_contracts.json`), RESTful endpoints, RFC 7807 Problem Details error schemas.
- **Validation**: 100% runtime Zod validation schemas for all server inputs, query parameters, and mutations.
- **Testing & Verification**: 100% automated test coverage on math engines (tax, split tender, RevPAR, booking collision).

---

## 5. Deliverable Targets for Autonomous Teammates

1. **ProductManager (`agent-5dc496a2-f7bb-4c41-aa93-deda51a40d57`)**:
   - `docs/PRD.md`: Full Product Requirements Document with numbered Acceptance Criteria (AC-1.1, AC-1.2, etc.) for all 7 modules.
   - `docs/user_flows.md`: Complete user journeys with Mermaid sequence and flow diagrams (Guest Booking, Check-In, Split-Tender Checkout, Room Move, Maintenance Triage).
2. **SystemArchitect (`agent-4efac692-33ad-4cf7-b46b-8277e94f4b38`)**:
   - `docs/architecture.md`: System topology, component boundaries, state flow, security architecture.
   - `docs/schema.sql`: Complete PostgreSQL schema with primary/foreign keys, indexes, triggers, and active RLS policies across all tables.
   - `docs/api_contracts.json`: Full OpenAPI 3.0 contract specification.
   - `docs/file_tree.json`: Clean file and directory hierarchy mapping.
