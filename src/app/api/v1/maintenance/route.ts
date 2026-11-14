import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_MAINTENANCE_TICKETS, INITIAL_ROOMS } from '@/lib/data/mock-resort-data';
import { MaintenanceTicket } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let results = [...INITIAL_MAINTENANCE_TICKETS];
  if (status) {
    results = results.filter((m) => m.status === status);
  }

  return NextResponse.json({ data: results });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomId,
      issueTitle,
      description,
      severity = 'p2_standard',
      reportedBy = 'Front Desk',
      assignedTo = 'Facilities Engineering',
    } = body;

    if (!roomId || !issueTitle || !description) {
      return NextResponse.json(
        { error: 'Missing required maintenance parameters: roomId, issueTitle, description' },
        { status: 400 }
      );
    }

    const room = INITIAL_ROOMS.find((r) => r.id === roomId || r.room_number === roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const causesOOO = severity === 'p1_urgent';

    const newTicket: MaintenanceTicket = {
      id: `maint-${Date.now()}`,
      room_id: room.id,
      room_number: room.room_number,
      issue_title: issueTitle,
      description,
      severity,
      status: 'open',
      reported_by: reportedBy,
      assigned_to: assignedTo,
      causes_ooo: causesOOO,
      created_at: new Date().toISOString(),
    };

    INITIAL_MAINTENANCE_TICKETS.push(newTicket);

    // If P1 Urgent, transition room to out_of_order immediately
    if (causesOOO) {
      room.status = 'out_of_order';
      room.notes = `P1 Urgent Maintenance: ${issueTitle}`;
    }

    return NextResponse.json({ data: newTicket }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
