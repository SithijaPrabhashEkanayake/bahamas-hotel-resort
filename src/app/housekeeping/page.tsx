'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  User,
  Plus,
} from 'lucide-react';
import { HousekeepingTask, MaintenanceTicket } from '@/types';

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Maintenance Modal State
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintRoomId, setMaintRoomId] = useState('rm-101');
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDescription, setMaintDescription] = useState('');
  const [maintSeverity, setMaintSeverity] = useState<'p1_urgent' | 'p2_standard' | 'p3_preventative'>('p1_urgent');
  const [maintMessage, setMaintMessage] = useState<string | null>(null);
  const [isSubmittingMaint, setIsSubmittingMaint] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch('/api/v1/housekeeping').then((res) => res.json()),
      fetch('/api/v1/maintenance').then((res) => res.json()),
    ])
      .then(([tasksJson, ticketsJson]) => {
        setTasks(tasksJson.data);
        setTickets(ticketsJson.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load housekeeping/maintenance', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/v1/housekeeping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update task status', err);
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMaint(true);
    setMaintMessage(null);

    try {
      const res = await fetch('/api/v1/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: maintRoomId,
          issueTitle: maintTitle,
          description: maintDescription,
          severity: maintSeverity,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMaintMessage(`Error: ${json.error}`);
        setIsSubmittingMaint(false);
        return;
      }

      setMaintMessage(
        json.data.causes_ooo
          ? `🚨 P1 Urgent logged! Room ${json.data.room_number} transitioned to OUT-OF-ORDER (OOO).`
          : `Maintenance ticket #${json.data.id} created successfully.`
      );
      setIsSubmittingMaint(false);
      fetchData();
      setTimeout(() => {
        setIsMaintModalOpen(false);
        setMaintMessage(null);
        setMaintTitle('');
        setMaintDescription('');
      }, 2000);
    } catch (err: any) {
      setMaintMessage(`Error: ${err.message}`);
      setIsSubmittingMaint(false);
    }
  };

  const filteredTasks = statusFilter === 'All'
    ? tasks
    : tasks.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#006B7D]">
            <Sparkles className="w-4 h-4" />
            <span>Housekeeping Operations & Facilities Dispatch</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A2E35]">Attendant Queue & Turnover Triage</h2>
          <p className="text-xs text-[#5C6B73]">
            Room state progression (Dirty → In Progress → Clean → Inspected) and Urgent OOO engineering triage.
          </p>
        </div>

        <button
          onClick={() => setIsMaintModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#E07A5F] hover:bg-[#D06548] text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
        >
          <Wrench className="w-4 h-4" />
          <span>Report Urgent Maintenance</span>
        </button>
      </div>

      {/* Main Grid: Housekeeping Queue & Maintenance Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Housekeeping Task List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['All', 'dirty', 'in_progress', 'clean', 'inspected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                  statusFilter === status
                    ? 'bg-[#1A2E35] text-white border-[#1A2E35]'
                    : 'bg-white text-[#5C6B73] border-[#DCE5E1] hover:bg-[#F0F4F2]'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-[#5C6B73] bg-white rounded-lg border border-[#DCE5E1]">
                Loading housekeeping tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-[#5C6B73] bg-white rounded-lg border border-[#DCE5E1]">
                No housekeeping tasks matching filter.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="luxury-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base text-[#1A2E35]">
                        Room {task.room_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          task.priority === 'urgent_vip'
                            ? 'bg-[#F9F4EA] text-[#C5A059] border border-[#C5A059]'
                            : task.priority === 'high'
                            ? 'bg-[#F7DBD3] text-[#E07A5F] border border-[#E07A5F]'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.priority.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[#5C6B73]">• {task.task_type.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-[#5C6B73]">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#006B7D]" />
                        <span>{task.assigned_attendant}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Est: {task.estimated_minutes}m</span>
                      </span>
                    </div>

                    {task.inspection_notes && (
                      <p className="mt-2 text-[11px] text-[#006B7D] bg-[#E0F2F5] p-2 rounded">
                        <strong>Inspection Note:</strong> {task.inspection_notes}
                      </p>
                    )}
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {task.status === 'dirty' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                        className="px-3 py-1.5 rounded-lg bg-[#E07A5F] hover:bg-[#D06548] text-white text-xs font-semibold"
                      >
                        Start Cleaning
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'clean')}
                        className="px-3 py-1.5 rounded-lg bg-[#006B7D] hover:bg-[#004B57] text-white text-xs font-semibold"
                      >
                        Mark Clean
                      </button>
                    )}
                    {task.status === 'clean' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'inspected')}
                        className="px-3 py-1.5 rounded-lg bg-[#2D6A4F] hover:bg-[#1E4D38] text-white text-xs font-semibold"
                      >
                        Supervisor Inspect
                      </button>
                    )}
                    {task.status === 'inspected' && (
                      <span className="px-3 py-1.5 rounded-lg bg-[#EAF5EC] text-[#2D6A4F] border border-[#2D6A4F]/30 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Inspected</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Maintenance & OOO Registry */}
        <div className="space-y-4">
          <div className="luxury-card p-5 space-y-4">
            <div className="border-b border-[#DCE5E1] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#1A2E35]">Maintenance & OOO Log</h3>
                <p className="text-[11px] text-[#5C6B73]">P1 Urgent tickets trigger immediate room OOO</p>
              </div>
              <Wrench className="w-4 h-4 text-[#E07A5F]" />
            </div>

            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                    ticket.causes_ooo
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-[#F8FAF8] border-[#DCE5E1] text-[#1A2E35]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Room {ticket.room_number}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ticket.causes_ooo ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {ticket.causes_ooo ? 'OUT OF ORDER (OOO)' : ticket.severity}
                    </span>
                  </div>
                  <p className="font-semibold">{ticket.issue_title}</p>
                  <p className="text-[11px] opacity-80">{ticket.description}</p>
                  <div className="pt-1 text-[10px] opacity-70 flex justify-between">
                    <span>Assigned: {ticket.assigned_to}</span>
                    <span className="font-semibold uppercase">{ticket.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Report Modal */}
      {isMaintModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#DCE5E1]">
            <div className="flex items-start justify-between border-b border-[#DCE5E1] pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-[#E07A5F]">Facilities & Engineering</span>
                <h3 className="font-serif text-xl font-bold text-[#1A2E35]">Report Maintenance Ticket</h3>
              </div>
              <button
                onClick={() => setIsMaintModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {maintMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {maintMessage}
              </div>
            )}

            <form onSubmit={handleCreateMaintenance} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1A2E35] mb-1">Room Number:</label>
                <select
                  value={maintRoomId}
                  onChange={(e) => setMaintRoomId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#DCE5E1] bg-white"
                >
                  <option value="rm-101">OW-101 (Overwater Pier)</option>
                  <option value="rm-201">V-201 (East Oceanfront)</option>
                  <option value="rm-301">RC-301 (Royal Cays)</option>
                  <option value="rm-401">BC-401 (West Lagoon)</option>
                  <option value="rm-501">GD-501 (West Lagoon)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1A2E35] mb-1">Issue Title:</label>
                <input
                  type="text"
                  value={maintTitle}
                  onChange={(e) => setMaintTitle(e.target.value)}
                  placeholder="e.g. Master Suite AC unit compressor locked"
                  className="w-full p-2 rounded-lg border border-[#DCE5E1]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A2E35] mb-1">Detailed Description:</label>
                <textarea
                  value={maintDescription}
                  onChange={(e) => setMaintDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe failure details, noise, water leak, or electrical warning..."
                  className="w-full p-2 rounded-lg border border-[#DCE5E1]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A2E35] mb-1">Severity Level:</label>
                <select
                  value={maintSeverity}
                  onChange={(e) => setMaintSeverity(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-[#DCE5E1] bg-white font-semibold"
                >
                  <option value="p1_urgent">P1 Urgent — Triggers Immediate Room OOO</option>
                  <option value="p2_standard">P2 Standard — High Priority (Room Operable)</option>
                  <option value="p3_preventative">P3 Preventative — Routine Maintenance</option>
                </select>
              </div>

              {maintSeverity === 'p1_urgent' && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-[11px] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
                  <span>
                    <strong>Statutory Notice:</strong> P1 Urgent tickets automatically switch the room status to{' '}
                    <strong>Out-of-Order (OOO)</strong>, instantly removing it from available booking inventory.
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-[#DCE5E1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#DCE5E1] text-[#5C6B73] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMaint}
                  className="px-4 py-2 rounded-lg bg-[#E07A5F] hover:bg-[#D06548] text-white font-semibold transition-all shadow-sm"
                >
                  {isSubmittingMaint ? 'Logging Ticket...' : 'Dispatch Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
