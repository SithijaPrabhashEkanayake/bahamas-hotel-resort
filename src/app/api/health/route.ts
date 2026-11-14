import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    resort: 'The Grand Bahamian Resort & Reserve',
    location: 'Cable Beach, Nassau, Commonwealth of The Bahamas',
    version: '1.0.0',
    compliance: {
      bahamas_vat_rate: '10.0%',
      resort_service_charge: '10.0%',
      hotel_guest_levy: '10.0%',
      currency_parity: 'USD 1:1 BSD',
      tin: '100293848-VAT-BS',
    },
    modules: [
      'Room Inventory & Dynamic Booking Engine',
      'Front Desk Operations & Interactive Room Matrix',
      'Guest Folio & Multi-Tender Billing Engine',
      'Housekeeping & Maintenance Dispatch',
      'Resort POS & F&B Outlets',
      'Guest CRM 360 & Concierge Portal',
      'Executive RevPAR & Midnight Audit Cockpit',
    ],
  });
}
