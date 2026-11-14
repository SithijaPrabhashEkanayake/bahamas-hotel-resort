# The Grand Bahamian Resort & Reserve — PMS Platform

Enterprise-grade property management, dynamic Caribbean yield booking, front-desk room matrix, and multi-tender folio billing system built for luxury island resorts across The Bahamas.

---

## 🏛️ Architecture & Compliance Highlights
- **Interactive Room Matrix (Tape Chart)**: Visual 2D accommodation canvas with operational states (*Occupied Clean, Occupied Dirty, Vacant Clean, Vacant Dirty, Out-of-Order, VIP In-House*).
- **Dynamic Caribbean Yield Engine**: Multi-seasonal pricing (*High Season, Shoulder Season, Low Season*) with atomic 15-minute checkout cart locking to prevent concurrent double-booking.
- **Bahamian Statutory Tax & Multi-Tender Billing**:
  - Bahamas Value Added Tax (10.0% VAT)
  - Mandatory Resort Service Charge (10.0%)
  - Bahamas National Hotel Guest Levy (10.0% on lodging)
  - Dual-currency USD / BSD 1:1 parity
  - **Odd-Penny Preservation Algorithm**: Eliminates cent drift across multi-tender split settlements.
- **Instant Room Folio Verification**: Seamless F&B and Concierge POS integration requiring room number and guest surname verification.
- **Housekeeping & Facilities Dispatch**: Mobile turnover queue with instant Out-of-Order (OOO) triage for P1 Urgent engineering tickets.
- **Executive RevPAR Cockpit**: Real-time OCC%, ADR, RevPAR, TRevPAR, and Daily Flash Audit generation.

---

## 🚀 Quick Start
```bash
# Run unit & integration test suites
npm test

# Launch local server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the Executive Cockpit.

---

## 📁 Documentation References
- [input_brief.md](file:///C:/Users/ekana/OpenBot/Shared/projects/bahamas-hotel-resort/docs/input_brief.md)
- [PRD.md](file:///C:/Users/ekana/OpenBot/Shared/projects/bahamas-hotel-resort/docs/PRD.md)
- [user_flows.md](file:///C:/Users/ekana/OpenBot/Shared/projects/bahamas-hotel-resort/docs/user_flows.md)
- [architecture.md](file:///C:/Users/ekana/OpenBot/Shared/projects/bahamas-hotel-resort/docs/architecture.md)
- [schema.sql](file:///C:/Users/ekana/OpenBot/Shared/projects/bahamas-hotel-resort/docs/schema.sql)
- [api_contracts.json](file:///C:/Users/ekana/OpenBot/Shared/projects/bahamas-hotel-resort/docs/api_contracts.json)
- [file_tree.json](file:///C:/Users/ekana/OpenBot/Shared/projects/bahamas-hotel-resort/docs/file_tree.json)
- [DEPLOYMENT.md](file:///C:/Users/ekana/OpenBot/Shared/projects/bahamas-hotel-resort/deploy/DEPLOYMENT.md)
