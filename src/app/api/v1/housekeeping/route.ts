import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_HOUSEKEEPING_TASKS, INITIAL_ROOMS } from '@/lib/data/mock-resort-data';
import { TaskStatus } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let results = [...INITIAL_HOUSEKEEPING_TASKS];
  if (status) {
    results = results.filter((t) => t.status === status);
  }

  return NextResponse.json({ data: results });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, status, inspectionNotes } = body;

    if (!taskId || !status) {
      return NextResponse.json({ error: 'taskId and status are required' }, { status: 400 });
    }

    const task = INITIAL_HOUSEKEEPING_TASKS.find((t) => t.id === taskId);
    if (!task) {
      return NextResponse.json({ error: 'Housekeeping task not found' }, { status: 404 });
    }

    task.status = status as TaskStatus;
    if (inspectionNotes) {
      task.inspection_notes = inspectionNotes;
    }
    if (status === 'in_progress' && !task.started_at) {
      task.started_at = new Date().toISOString();
    }
    if (status === 'clean' || status === 'inspected') {
      task.completed_at = new Date().toISOString();

      // Update associated room status
      const room = INITIAL_ROOMS.find((r) => r.id === task.room_id || r.room_number === task.room_number);
      if (room) {
        if (room.status === 'occupied_dirty') {
          room.status = 'occupied_clean';
        } else if (room.status === 'vacant_dirty') {
          room.status = 'vacant_clean';
        }
      }
    }

    return NextResponse.json({ data: task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
