# User Journey Flows & Operational Lifecycles
## Bahamas Luxury Hotel & Resort Management System (`bahamas-hotel-resort`)

- **Document Version**: 1.0.0
- **Status**: Production-Ready / Ratified
- **Companion Document**: [PRD.md](file:///C:/Users/ekana/OpenBot/Shared/projects/bahamas-hotel-resort/docs/PRD.md)
- **Author**: Product Manager (PM) Agent (`agent-5dc496a2-f7bb-4c41-aa93-deda51a40d57`)
- **Authority**: Autonomous CEO (`agent-ff7c07be-8901-497c-a3a0-55877865ff60`) & `OPERATIONAL_PROTOCOLS.md` (Mandatory Skill-First Policy)
- **Target Repository**: `C:\Users\ekana\OpenBot\Shared\projects\bahamas-hotel-resort\`

---

## 1. System Ecosystem & Actor Roles

```mermaid
flowchart TD
    Guest["Resort Guest<br>(Online / In-House)"]
    FrontDesk["Front Desk Concierge<br>(Matrix & Folio Manager)"]
    FnbServer["F&B Server / Bartender<br>(Pool / Dining / Cabana)"]
    Housekeeping["Housekeeping Attendant<br>(Turnover & Inspection)"]
    Maintenance["Facilities Engineer<br>(Triage & OOO Control)"]
    Executive["General Manager / Auditor<br>(Analytics & Flash Reports)"]

    Guest -->|Direct Booking / Express Check-in| FrontDesk
    Guest -->|Dines & Charges Room| FnbServer
    FnbServer -->|Posts Charge to Folio| FrontDesk
    FrontDesk -->|Dispatches Room Status| Housekeeping
    Housekeeping -->|Reports P1 Defects| Maintenance
    Maintenance -->|Flags Out-of-Order OOO| FrontDesk
    FrontDesk -->|Reconciles Night Audit| Executive
```

---

## 2. Flow 1: Online Guest Direct Booking & Dynamic Rate Calculation

### 2.1 Description
Captures a luxury traveler exploring accommodations, selecting dates across seasonal yield boundaries, applying dynamic rate modifiers, reserving inventory under atomic 15-minute concurrency hold, and guaranteeing deposit payment.

### 2.2 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Luxury Guest
    participant Web as Booking Engine UI
    participant Rate as Caribbean Yield Engine
    participant Hold as Concurrency Hold Worker
    participant DB as Supabase PostgreSQL
    participant Pay as Payment Gateway

    Guest->>Web: Select Dates, Guests & Villa Category
    Web->>Rate: Request Rate Quote (Arrival, Departure, Adults, Category)
    Rate->>Rate: Evaluate Active Seasonal Calendar (High / Shoulder / Low)
    Rate->>Rate: Apply Minimum Length-of-Stay (LOS) Rules
    Rate->>Rate: Compute Daily Breakdown + 10% VAT + 10% Service + 10% Levy
    Rate-->>Web: Return Itemized Rate & Tax Quote
    
    Guest->>Web: Click "Reserve Villa"
    Web->>Hold: Request 15-Minute Inventory Hold
    Hold->>DB: Check Active Holds & Locked Reservations
    alt Room Available
        Hold->>DB: Create Atomic Hold (hold_expires_at = NOW() + 15m)
        Hold-->>Web: Hold Confirmed (Countdown Timer Activated)
    else Room Locked / Already Held
        Hold-->>Web: HTTP 409 Conflict (Suggest Next Available Suite)
        Web-->>Guest: Display Alternative Date / Room Options
    end
    
    Guest->>Web: Enter Guest Information & Credit Card
    Web->>Pay: Authorize First Night Deposit (pegged 1:1 USD/BSD)
    Pay-->>Web: Auth Succeeded (Transaction ID)
    Web->>DB: Persist Confirmed Reservation & Release Temporary Hold
    Web-->>Guest: Booking Confirmed (Reservation Code & Digital Voucher)
```

### 2.3 Operational Flowchart

```mermaid
flowchart TD
    Start(["Guest Initiates Booking Search"]) --> SelectDates["Choose Arrival, Departure & Guest Count"]
    SelectDates --> ValidateLOS{"Meets Minimum Length-of-Stay?"}
    
    ValidateLOS -- "No" --> RejectLOS["Prompt Minimum Nights Requirement"]
    RejectLOS --> SelectDates
    
    ValidateLOS -- "Yes" --> EvaluateYield["Calculate Rates Across High/Shoulder/Low Season Multipliers"]
    EvaluateYield --> CalcTaxes["Calculate Statutory Taxes:<br>+10% Bahamas VAT<br>+10% Resort Service Charge<br>+10% Hotel Levy"]
    
    CalcTaxes --> RenderPricing["Display Itemized Daily Rate Quote"]
    RenderPricing --> UserPicksRoom["Guest Selects Room & Enters Checkout"]
    
    UserPicksRoom --> AcquireHold{"Acquire 15-Minute Atomic Hold"}
    AcquireHold -- "Conflict / Held" --> ShowAlternatives["Display Alternative Available Villas"]
    ShowAlternatives --> UserPicksRoom
    
    AcquireHold -- "Success" --> StartTimer["Start 15-Minute Countdown"]
    StartTimer --> InputDetails["Capture Guest Profile & Payment Method"]
    
    InputDetails --> CheckExpired{"Timer Expired?"}
    CheckExpired -- "Yes" --> ReleaseHold["Release Hold back to Inventory Pool"]
    ReleaseHold --> ExpireNotice["Notify Guest Session Expired"]
    ExpireNotice --> SelectDates
    
    CheckExpired -- "No" --> ProcessPayment["Authorize 1-Night Deposit"]
    ProcessPayment --> ConfirmBooking["Confirm Reservation & Dispatch Welcome Email"]
    ConfirmBooking --> BookingEnd(["Reservation Persisted in Database"])
```

---

## 3. Flow 2: Front Desk Arrival, Passport Verification & Check-in

### 3.1 Description
Front desk check-in workflow for guests arriving at the resort, incorporating identity verification, pre-authorization, room status validation, and automated butler dispatch.

### 3.2 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Arriving Guest
    actor Agent as Front Desk Concierge
    participant UI as Front Desk Tape Chart UI
    participant Auth as Pre-Auth Payment Terminal
    participant DB as Supabase PostgreSQL
    participant Butler as Butler Service Queue

    Guest->>Agent: Arrives at Resort Lounge & Provides Name/Code
    Agent->>UI: Universal Search by Surname or Reservation Code
    UI->>DB: Query Reservation, VIP Tier & Health Alerts
    DB-->>UI: Return Guest Dossier (e.g., Emerald VIP, Shellfish Allergy)
    
    Agent->>UI: Scan Passport / Enter Document Number & Nationality
    Agent->>Guest: Present iPad for Digital Signature & Terms
    Guest->>UI: Submits Digital Signature (Data URL)
    
    Agent->>Auth: Initiate Pre-Authorization (Room + Tax + $250/night Incidentals)
    Auth-->>Agent: Pre-Authorization Approved
    
    UI->>DB: Check Room Status (Must be "Vacant Clean")
    alt Room Clean & Inspected
        UI->>DB: Update Room to "Occupied Clean" & Reservation to "Checked-In"
        UI->>UI: Trigger Keycard Encoding Hook
        opt Category is Villa or Royal Palm Suite
            UI->>Butler: Dispatch "VIP In-House" Arrival Alert
        end
        Agent->>Guest: Hand Keycard & Escort with Welcome Beverage
    else Room "Vacant Dirty" or "Cleaning In-Progress"
        UI->>Agent: Alert: "Room Not Inspected"
        Agent->>UI: Check Nearest Matching Vacant Clean Room (Complimentary Upgrade)
        UI->>DB: Perform Immediate Room Reassignment
        Agent->>Guest: Offer Welcome Lounge Hospitality while Keys Finalized
    end
```

### 3.3 Operational Flowchart

```mermaid
flowchart TD
    Arrival(["Guest Arrives at Concierge Lounge"]) --> FindBooking["Search Reservation by Name, Code or Room #"]
    FindBooking --> LoadDossier["Load Guest 360 Dossier & VIP Status"]
    
    LoadDossier --> CheckAllergy{"Medical / Allergy Flags Present?"}
    CheckAllergy -- "Yes" --> DisplayRedFlag["Render High-Visibility Red Contraindication Banner"]
    CheckAllergy -- "No" --> DocumentCheck["Scan Passport & Verify Identity"]
    DisplayRedFlag --> DocumentCheck
    
    DocumentCheck --> CaptureSignature["Capture Digital Signature on Guest iPad"]
    CaptureSignature --> RunPreAuth["Execute Credit Pre-Authorization:<br>Room & Tax + $250/night Incidentals"]
    
    RunPreAuth --> PreAuthPass{"Pre-Auth Approved?"}
    PreAuthPass -- "No" --> RequestAltPayment["Request Alternative Credit Card / Cash Deposit"]
    RequestAltPayment --> RunPreAuth
    
    PreAuthPass -- "Yes" --> InspectRoomStatus{"Assigned Room Cleanliness State"}
    InspectRoomStatus -- "Vacant Clean" --> CommitCheckin["Transition Room to 'Occupied Clean'"]
    InspectRoomStatus -- "Vacant Dirty / In-Progress" --> FindCleanAlt["Locate Adjacent Matching Clean Room or Upgrade"]
    FindCleanAlt --> CommitCheckin
    
    CommitCheckin --> EncodeKey["Encode RFID Keycard & Activate Digital Key"]
    EncodeKey --> CheckVIPTier{"Villa or Platinum VIP?"}
    CheckVIPTier -- "Yes" --> NotifyButler["Dispatch Dedicated Butler to Welcome Pavilion"]
    CheckVIPTier -- "No" --> EscortGuest["Concierge Escorts Guest to Accommodation"]
    NotifyButler --> EscortGuest
    EscortGuest --> CheckinDone(["Guest In-House & Active"])
```

---

## 4. Flow 3: F&B Outlet Room Charge & Folio Verification

### 4.1 Description
Settlement workflow at resort food and beverage outlets (Sunset Pier, Driftwood Pool Bar, Coconut Cabana) charging meals and drinks directly to the guest room folio with surname verification.

### 4.2 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Guest as In-House Guest
    actor Server as F&B Server
    participant POS as Outlet POS Terminal
    participant Engine as Folio Verification Engine
    participant DB as Supabase PostgreSQL

    Guest->>Server: Requests Check ("Charge to Room 304")
    Server->>POS: Ring Order (Food, Beverage, 10% VAT, Gratuity)
    Server->>POS: Select Tender: "Room Folio Charge"
    Server->>POS: Enter Room Number "304" & Guest Surname Letters "SMI"
    
    POS->>Engine: ValidateFolioCharge(room_number: "304", surname_prefix: "SMI", amount: $245.50)
    Engine->>DB: Query Active Reservation for Room 304
    
    alt Verification Successful
        DB-->>Engine: Matched "Smith, Alexander" (Folio Active, Credit Remaining: $1,800.00)
        Engine->>DB: Post Charge Line Item to Guest Folio
        Engine->>DB: Decrement Recipe Ingredients from Bar/Kitchen Inventory
        Engine-->>POS: HTTP 200 OK (Charge Approved)
        POS->>POS: Print Itemized Guest Slip with VAT TIN & Signature Line
        Server->>Guest: Present Slip for Signature Verification
    else Mismatched Surname
        DB-->>Engine: Surname Prefix "SMI" Does Not Match "Johnson"
        Engine-->>POS: HTTP 403 Forbidden ("Surname Mismatch")
        POS->>Server: Display Error: Verify Room Number or Guest Name
        Server->>Guest: Politely Request Passport Name or Card Settlement
    else Credit Limit Exceeded
        DB-->>Engine: Charge Exceeds Pre-Authorized Credit Limit
        Engine-->>POS: HTTP 402 Payment Required ("Credit Limit Exceeded")
        POS->>Server: Prompt for Front Desk Credit Extension or Card Payment
    end
```

### 4.3 Operational Flowchart

```mermaid
flowchart TD
    OrderDone(["Guest Concludes Meal / Bar Order"]) --> ServerTender["Server Opens Settlement Screen on POS"]
    ServerTender --> ChooseRoomCharge["Select Tender: 'Room Folio Charge'"]
    ChooseRoomCharge --> PromptCredentials["Enter Room # & First 3 Letters of Surname"]
    
    PromptCredentials --> CheckOccupied{"Is Room Currently 'Occupied'?"}
    CheckOccupied -- "No" --> RefuseCharge["Reject: Room Not Occupied / Checked Out"]
    
    CheckOccupied -- "Yes" --> MatchSurname{"Surname Matches Active Guest Register?"}
    MatchSurname -- "No" --> RejectSurname["Reject: Guest Name Verification Failed"]
    
    MatchSurname -- "Yes" --> VerifyCredit{"Charge Amount <= Available Credit Limit?"}
    VerifyCredit -- "No" --> RejectCredit["Reject: Folio Pre-Auth Limit Exceeded"]
    
    VerifyCredit -- "Yes" --> PostLineItem["Atomically Post Line Item to Active Folio:<br>- Subtotal<br>- 10.0% Bahamas VAT<br>- Gratuity (Server Attributed)"]
    PostLineItem --> DecrementStock["Decrement Recipe Ingredients from Outlet Inventory"]
    DecrementStock --> PrintSlip["Print Branded Receipt with Guest Signature Box"]
    PrintSlip --> CompleteDining(["Dining Check Settled"])
    
    RefuseCharge --> AlternativePayment["Request Credit Card or Cash Settlement"]
    RejectSurname --> AlternativePayment
    RejectCredit --> AlternativePayment
```

---

## 5. Flow 4: Housekeeping Turnover & Urgent Maintenance Triage

### 5.1 Description
Lifecycle of daily room turnover, departure deep cleans, and high-severity engineering defect triage that automatically transitions rooms to Out-of-Order (OOO).

### 5.2 State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> VacantDirty: Guest Check-Out
    VacantDirty --> CleaningInProgress: Attendant Starts Turnover
    CleaningInProgress --> InspectedClean: Supervisor Completes Inspection
    InspectedClean --> VacantClean: Released for Check-In
    VacantClean --> OccupiedClean: Guest Checks In
    OccupiedClean --> OccupiedDirty: Daily Morning Cycle
    OccupiedDirty --> OccupiedClean: Stayover Refresh Complete
    
    OccupiedClean --> OutOfOrder: P1 Maintenance Ticket Raised
    VacantDirty --> OutOfOrder: P1 Maintenance Ticket Raised
    OutOfOrder --> CleaningInProgress: Maintenance Resolved & Signed Off
```

### 5.3 Maintenance Triage Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Attendant as Housekeeping Attendant
    participant App as Attendant Mobile Tablet
    participant Maint as Maintenance Dispatch System
    participant Matrix as Interactive Room Matrix
    participant FD as Front Desk Alert Console
    participant Tech as Engineering Technician

    Attendant->>App: Discovers Major A/C Failure in Room 208
    App->>Maint: Log Maintenance Ticket (Severity: P1 Urgent, Category: HVAC)
    Maint->>Matrix: Atomically Flag Room 208 as "Out-of-Order (OOO)"
    Matrix->>Matrix: Render Crimson Red Block on Tape Chart
    
    alt Room is Occupied
        Maint->>FD: Dispatch Urgent Guest Relocation Alert
        FD->>Matrix: Identify Nearest Matching Vacant Clean Suite
        FD->>FD: Initiate Room Move & Luggage Transfer Dispatch
    end
    
    Maint->>Tech: Push Urgent Work Order Notification to Technician Mobile
    Tech->>Tech: Inspects and Replaces A/C Compressor
    Tech->>Maint: Mark Work Order "Resolved" (Upload Parts Used & Sign-Off)
    Maint->>App: Queue Room 208 for "Post-Maintenance Inspection Clean"
    Attendant->>App: Completes Sanitization & Flags "Inspected Clean"
    App->>Matrix: Release Room 208 back to "Vacant Clean" (Bookable)
```

---

## 6. Flow 5: Multi-Tender Folio Settlement & Tax Invoice Checkout

### 6.1 Description
Comprehensive departure settlement at Front Desk, managing multiple tenders across USD/BSD (pegged 1:1), personal vs. corporate master billing splits, statutory tax compliance, and zero-penny leakage.

### 6.2 Mathematical Tax & Odd-Penny Splitting Logic

```
1. Master Folio Aggregation:
   Total Charges = ∑(Room Nights) + ∑(F&B Checks) + ∑(Spa/Concierge) + ∑(Incidental Goods)

2. Tax & Statutory Fee Segregation:
   - Base Lodging = $3,000.00
   - 10.0% Resort Service Charge = $300.00
   - 10.0% Bahamas Hotel Levy = $300.00
   - 10.0% Bahamas VAT on Lodging = ($3,000.00 + $300.00) × 0.100 = $330.00
   - F&B Subtotal = $500.00
   - 10.0% Bahamas VAT on F&B = $50.00
   - Gratuity Paid = $90.00
   -----------------------------------------------------------------
   Grand Total Due = $3,000 + $300 + $300 + $330 + $500 + $50 + $90 = $4,570.00

3. Odd-Penny Split-Tender Allocation (e.g., 3 Equal Split Tenders):
   - Tender 1 (Credit Card): $1,523.34 (Allocated Remainder Cent)
   - Tender 2 (Cash BSD):    $1,523.33
   - Tender 3 (Wire / USD):  $1,523.33
   - Sum Check: $1,523.34 + $1,523.33 + $1,523.33 = $4,570.00 (Zero Leakage)
```

### 6.3 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Departing Guest
    actor Agent as Front Desk Concierge
    participant UI as Folio Settlement Screen
    participant Engine as Tax & Odd-Penny Engine
    participant Gateway as Card Payment Gateway
    participant DB as Supabase PostgreSQL

    Guest->>Agent: Arrives at Desk for Checkout ("Room 412")
    Agent->>UI: Open Folio for Room 412
    UI->>DB: Fetch All Unbilled & Posted Charges
    DB-->>UI: Return Itemized Room, F&B, Concierge & Tax Records
    
    Agent->>Guest: Present Itemized Folio on Countertop iPad for Review
    Guest->>Agent: "Charge $2,000 to Amex, and remainder in Cash USD"
    
    Agent->>UI: Enter Multi-Tender Split: $2,000.00 (Credit Card) + $2,570.00 (Cash)
    UI->>Engine: Validate Split Sum & Apply Odd-Penny Preservation Algorithm
    Engine-->>UI: Split Balance Verified (Exact Zero Remainder)
    
    Agent->>Gateway: Charge $2,000.00 to Guest Amex
    Gateway-->>Agent: Card Transaction Approved
    Agent->>UI: Record $2,570.00 Cash Received (USD pegged 1:1 BSD)
    
    UI->>DB: Record Payments, Close Folio Balance to $0.000, Archive Stay
    UI->>DB: Transition Room Status from "Occupied Clean" to "Vacant Dirty"
    UI->>UI: Generate Official Bahamas Tax Invoice (With VAT TIN: BAH-VAT-8921104-Z)
    
    Agent->>Guest: Hand Printed & Emailed Luxury Departure Tax Invoice
    Agent->>Guest: Bid Warm Bahamian Farewell
```

### 6.4 Operational Flowchart

```mermaid
flowchart TD
    StartCheckout(["Guest Requests Departure Checkout"]) --> FetchFolio["Fetch Live Folio Aggregates from Supabase"]
    FetchFolio --> CheckCorporateSplit{"Corporate Master Billing Split Required?"}
    
    CheckCorporateSplit -- "Yes" --> RouteMaster["Route Room & Tax to Corporate Master Account"]
    RouteMaster --> ReviewIncidentals["Remaining Incidental Balance to Guest"]
    CheckCorporateSplit -- "No" --> ReviewIncidentals
    
    ReviewIncidentals --> PresentReview["Present Detailed Itemized Charges to Guest"]
    PresentReview --> GuestQuestions{"Any Disputed Line Items?"}
    GuestQuestions -- "Yes" --> ManagerAudit["Front Desk Manager Audits & Adjusts Charges"]
    ManagerAudit --> CalcFinalBalance["Recalculate Net Balance Due"]
    GuestQuestions -- "No" --> CalcFinalBalance
    
    CalcFinalBalance --> SelectSplit{"Single or Multi-Tender Payment?"}
    SelectSplit -- "Single Tender" --> PaySingle["Process Entire Balance via Single Card / Cash"]
    SelectSplit -- "Multi-Tender" --> SplitAlgo["Apply Odd-Penny Preservation Split Algorithm"]
    
    SplitAlgo --> ProcessTenders["Execute Individual Payment Tenders (Cards / Cash / Folio)"]
    PaySingle --> ValidateZero
    ProcessTenders --> ValidateZero{"Is Balance Due Exactly $0.000?"}
    
    ValidateZero -- "No" --> CollectRemainder["Collect Remaining Outstanding Cent / Balance"]
    CollectRemainder --> ValidateZero
    
    ValidateZero -- "Yes" --> CloseFolio["Mark Folio Closed & Persist Transaction History"]
    CloseFolio --> UpdateRoom["Atomically Switch Room to 'Vacant Dirty'"]
    UpdateRoom --> QueueTurnover["Dispatch Turnover Clean to Housekeeping Attendants"]
    QueueTurnover --> PrintTaxInvoice["Generate Stamp-Verified Bahamas VAT Tax Invoice"]
    PrintTaxInvoice --> EndDeparture(["Guest Checked Out Successfully"])
```

---

## 7. Operational Validation & Traceability Matrix

| Flow ID | Scenario | Primary Actor | Success Assertion | Edge Case Handled |
| :--- | :--- | :--- | :--- | :--- |
| **FL-01** | Online Direct Booking | Guest | 15-minute atomic inventory hold acquired; deposit collected | Concurrent booking conflict (HTTP 409) with alternate suggestions |
| **FL-02** | Express Front Desk Check-in | Concierge | Digital signature & ID logged; room set to `Occupied Clean` | Room uncleaned at arrival $\rightarrow$ immediate clean upgrade reassignment |
| **FL-03** | F&B Outlet POS Room Charge | Server | Charge posted to room folio in <200ms with receipt slip | Surname mismatch or credit pre-auth limit exceeded $\rightarrow$ card settlement |
| **FL-04** | Housekeeping & Urgent P1 Triage | Attendant / Tech | P1 ticket atomically switches room to `Out-of-Order (OOO)` | Occupied room P1 defect triggers immediate front-desk guest relocation |
| **FL-05** | Multi-Tender Folio Settlement | Front Desk | Folio cleared to $0.000 with Bahamas VAT TIN invoice | Fractional penny split leakage eliminated via Odd-Penny Preservation |
