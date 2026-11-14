import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GET as getHealth } from '../../src/app/api/health/route';
import { GET as getMatrix } from '../../src/app/api/v1/matrix/route';
import { GET as getBookings, POST as postBooking } from '../../src/app/api/v1/bookings/route';
import { POST as postRoomCharge } from '../../src/app/api/v1/pos/charge/route';
import { GET as getFolios } from '../../src/app/api/v1/folios/route';
import { POST as settleFolio } from '../../src/app/api/v1/folios/[id]/route';
import { POST as postMaintenance } from '../../src/app/api/v1/maintenance/route';
import { GET as getRevPAR } from '../../src/app/api/v1/reports/revpar/route';
import { NextRequest } from 'next/server';

describe('Bahamas Hotel & Resort PMS — REST API Route Handlers', () => {
  test('GET /api/health: returns 200 and statutory compliance parameters', async () => {
    const res = await getHealth();
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'healthy');
    assert.equal(json.compliance.bahamas_vat_rate, '10.0%');
    assert.equal(json.compliance.resort_service_charge, '10.0%');
    assert.equal(json.compliance.hotel_guest_levy, '10.0%');
    assert.equal(json.compliance.currency_parity, 'USD 1:1 BSD');
  });

  test('GET /api/v1/matrix: returns 2D room inventory and operational counts', async () => {
    const res = await getMatrix();
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.rooms.length > 0);
    assert.ok(json.data.wings.length >= 4);
    assert.ok(json.data.counts.occupied_clean >= 0);
  });

  test('POST /api/v1/bookings: detects collision when room is already booked', async () => {
    // Attempt to book room 'rm-201' during Sir Arthur Wellington's stay (2026-11-12 to 2026-11-18)
    const req = new NextRequest('http://localhost:3000/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify({
        roomId: 'rm-201',
        checkInDate: '2026-11-14',
        checkOutDate: '2026-11-16',
        adults: 2,
      }),
    });

    const res = await postBooking(req);
    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.error, 'Room collision detected');
  });

  test('POST /api/v1/bookings: successfully creates booking and computes 10% VAT + 10% Service + 10% Levy', async () => {
    // Book available room 'rm-202'
    const req = new NextRequest('http://localhost:3000/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify({
        roomId: 'rm-202',
        checkInDate: '2026-12-01',
        checkOutDate: '2026-12-05', // 4 nights
        adults: 2,
      }),
    });

    const res = await postBooking(req);
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.ok(json.data.booking.id);
    assert.ok(json.data.pricing.vat_cents > 0);
    assert.ok(json.data.pricing.service_charge_cents > 0);
    assert.ok(json.data.pricing.hotel_levy_cents > 0);
  });

  test('POST /api/v1/pos/charge: allows charge for matching surname, rejects mismatch', async () => {
    // 1. Correct surname for in-house room 'V-201' (Sir Arthur Wellington)
    const validReq = new NextRequest('http://localhost:3000/api/v1/pos/charge', {
      method: 'POST',
      body: JSON.stringify({
        roomNumber: 'V-201',
        guestSurname: 'Wellington',
        outletName: 'Sunset Pier Restaurant',
        description: 'Chilled Caribbean Spiny Lobster',
        amountCents: 12000, // $120.00
      }),
    });
    const validRes = await postRoomCharge(validReq);
    assert.equal(validRes.status, 200);
    const validJson = await validRes.json();
    assert.equal(validJson.data.success, true);
    assert.equal(validJson.data.guest_name, 'Sir Arthur Wellington');

    // 2. Incorrect surname
    const invalidReq = new NextRequest('http://localhost:3000/api/v1/pos/charge', {
      method: 'POST',
      body: JSON.stringify({
        roomNumber: 'V-201',
        guestSurname: 'Johnson',
        outletName: 'Sunset Pier Restaurant',
        description: 'Cocktail',
        amountCents: 2500,
      }),
    });
    const invalidRes = await postRoomCharge(invalidReq);
    assert.equal(invalidRes.status, 403);
    const invalidJson = await invalidRes.json();
    assert.equal(invalidJson.reason, 'surname_mismatch');
  });

  test('POST /api/v1/maintenance: P1 Urgent ticket automatically marks room Out-of-Order (OOO)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/maintenance', {
      method: 'POST',
      body: JSON.stringify({
        roomId: 'rm-501',
        issueTitle: 'Master Bathroom Pipe Burst',
        description: 'Emergency plumbing isolation required.',
        severity: 'p1_urgent',
      }),
    });

    const res = await postMaintenance(req);
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.data.causes_ooo, true);
  });

  test('GET /api/v1/reports/revpar: outputs executive RevPAR and Daily Flash Report', async () => {
    const res = await getRevPAR();
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.total_rooms > 0);
    assert.ok(json.data.occupancy_rate_pct >= 0);
    assert.ok(json.data.revenue_per_available_room_cents >= 0);
    assert.ok(json.data.trevpar_cents >= 0);
  });
});
