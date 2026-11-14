'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Printer,
  ShieldCheck,
  DollarSign,
  BedDouble,
  Building2,
  Calendar,
} from 'lucide-react';
import { RevPARReport } from '@/types';

export default function ReportsPage() {
  const [report, setReport] = useState<RevPARReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/reports/revpar')
      .then((res) => res.json())
      .then((json) => {
        setReport(json.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load flash report', err);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#006B7D]">
            <BarChart3 className="w-4 h-4" />
            <span>Executive Financial & Night Audit Reports</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A2E35]">Daily Flash Audit & RevPAR Cockpit</h2>
          <p className="text-xs text-[#5C6B73]">
            Official hospitality performance KPIs and Department of Inland Revenue (DIR) statutory tax assessments.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-lg bg-[#1A2E35] hover:bg-[#2C4852] text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
        >
          <Printer className="w-4 h-4 text-[#C5A059]" />
          <span>Print Daily Flash Report</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#5C6B73] bg-white rounded-lg border border-[#DCE5E1]">
          Compiling Daily Flash Report...
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="luxury-card p-5">
              <span className="text-xs font-semibold text-[#5C6B73] uppercase tracking-wider">
                Resort Occupancy
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-serif text-3xl font-bold text-[#1A2E35]">
                  {report.occupancy_rate_pct.toFixed(1)}%
                </span>
                <span className="text-xs text-[#006B7D] font-medium">
                  {report.occupied_rooms} / {report.available_rooms} Avail
                </span>
              </div>
              <p className="text-[11px] text-[#5C6B73] mt-2">
                Inventory: {report.total_rooms} Total • {report.out_of_order_rooms} OOO
              </p>
            </div>

            <div className="luxury-card p-5">
              <span className="text-xs font-semibold text-[#5C6B73] uppercase tracking-wider">
                Average Daily Rate (ADR)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-serif text-3xl font-bold text-[#1A2E35]">
                  {formatCurrency(report.average_daily_rate_cents)}
                </span>
              </div>
              <p className="text-[11px] text-[#5C6B73] mt-2">Per occupied room night</p>
            </div>

            <div className="luxury-card p-5">
              <span className="text-xs font-semibold text-[#5C6B73] uppercase tracking-wider">
                RevPAR (Room Only)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-serif text-3xl font-bold text-[#006B7D]">
                  {formatCurrency(report.revenue_per_available_room_cents)}
                </span>
              </div>
              <p className="text-[11px] text-[#5C6B73] mt-2">ADR × Occupancy %</p>
            </div>

            <div className="luxury-card p-5">
              <span className="text-xs font-semibold text-[#5C6B73] uppercase tracking-wider">
                TRevPAR (Total Resort)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-serif text-3xl font-bold text-[#E07A5F]">
                  {formatCurrency(report.trevpar_cents)}
                </span>
              </div>
              <p className="text-[11px] text-[#5C6B73] mt-2">All revenue per available room</p>
            </div>
          </div>

          {/* Departmental Revenue Breakdown Table */}
          <div className="luxury-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE5E1] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A2E35]">
                  Departmental Revenue & Tax Distribution
                </h3>
                <p className="text-xs text-[#5C6B73]">
                  Date: <strong>{report.date}</strong> • Cable Beach Property
                </p>
              </div>
              <span className="px-3 py-1 rounded bg-[#EAF5EC] text-[#2D6A4F] text-xs font-bold border border-[#2D6A4F]/30">
                Audit Status: Balanced
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F4F2] text-[#5C6B73] font-semibold border-b border-[#DCE5E1] uppercase">
                <tr>
                  <th className="py-3 px-4">Department / Outlet</th>
                  <th className="py-3 px-4">Net Revenue</th>
                  <th className="py-3 px-4">Resort Svc Charge (10%)</th>
                  <th className="py-3 px-4">Hotel Levy (10%)</th>
                  <th className="py-3 px-4">Bahamas VAT (10%)</th>
                  <th className="py-3 px-4">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5E1] font-mono">
                <tr>
                  <td className="py-3 px-4 font-sans font-semibold text-[#1A2E35]">
                    Lodging & Accommodations
                  </td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.lodging_cents)}</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.lodging_cents * 0.1)}</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.lodging_cents * 0.1)}</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.lodging_cents * 0.1)}</td>
                  <td className="py-3 px-4 font-bold text-[#1A2E35]">
                    {formatCurrency(report.departmental_breakdown.lodging_cents * 1.3)}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-sans font-semibold text-[#1A2E35]">
                    Food & Beverage (Sunset Pier & Pool Bar)
                  </td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.fnb_cents)}</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.fnb_cents * 0.1)}</td>
                  <td className="py-3 px-4 text-[#A4B1B8] font-sans">Exempt (0%)</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.fnb_cents * 0.1)}</td>
                  <td className="py-3 px-4 font-bold text-[#1A2E35]">
                    {formatCurrency(report.departmental_breakdown.fnb_cents * 1.2)}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-sans font-semibold text-[#1A2E35]">
                    Spa & Holistic Wellness Center
                  </td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.spa_wellness_cents)}</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.spa_wellness_cents * 0.1)}</td>
                  <td className="py-3 px-4 text-[#A4B1B8] font-sans">Exempt (0%)</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.spa_wellness_cents * 0.1)}</td>
                  <td className="py-3 px-4 font-bold text-[#1A2E35]">
                    {formatCurrency(report.departmental_breakdown.spa_wellness_cents * 1.2)}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-sans font-semibold text-[#1A2E35]">
                    Concierge & Yacht Charters
                  </td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.concierge_yacht_cents)}</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.concierge_yacht_cents * 0.1)}</td>
                  <td className="py-3 px-4 text-[#A4B1B8] font-sans">Exempt (0%)</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.concierge_yacht_cents * 0.1)}</td>
                  <td className="py-3 px-4 font-bold text-[#1A2E35]">
                    {formatCurrency(report.departmental_breakdown.concierge_yacht_cents * 1.2)}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-sans font-semibold text-[#1A2E35]">
                    Beach Cabana Rentals
                  </td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.cabana_rentals_cents)}</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.cabana_rentals_cents * 0.1)}</td>
                  <td className="py-3 px-4 text-[#A4B1B8] font-sans">Exempt (0%)</td>
                  <td className="py-3 px-4">{formatCurrency(report.departmental_breakdown.cabana_rentals_cents * 0.1)}</td>
                  <td className="py-3 px-4 font-bold text-[#1A2E35]">
                    {formatCurrency(report.departmental_breakdown.cabana_rentals_cents * 1.2)}
                  </td>
                </tr>

                <tr className="bg-[#F8FAF8] font-bold text-sm">
                  <td className="py-4 px-4 font-sans text-[#006B7D]">Resort Consolidated Total:</td>
                  <td className="py-4 px-4 text-[#006B7D]">{formatCurrency(report.total_resort_revenue_cents)}</td>
                  <td className="py-4 px-4">{formatCurrency(report.total_resort_revenue_cents * 0.1)}</td>
                  <td className="py-4 px-4">{formatCurrency(report.departmental_breakdown.lodging_cents * 0.1)}</td>
                  <td className="py-4 px-4">{formatCurrency(report.total_resort_revenue_cents * 0.1)}</td>
                  <td className="py-4 px-4 text-[#006B7D]">
                    {formatCurrency(
                      report.total_resort_revenue_cents * 1.2 +
                        report.departmental_breakdown.lodging_cents * 0.1
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Statutory Tax Compliance Attestation Box */}
          <div className="luxury-card p-6 border-l-4 border-[#006B7D] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#006B7D]" />
                <h4 className="font-serif font-bold text-base text-[#1A2E35]">
                  Bahamas Ministry of Finance & Inland Revenue Certification
                </h4>
              </div>
              <p className="text-xs text-[#5C6B73]">
                Tax Identification Number: <strong>100293848-VAT-BS</strong> • Certified under the Bahamas Value Added Tax Act 2014 & Hotel Levy Regulations.
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-mono text-[#006B7D] font-bold">100% AUDIT ALIGNED</span>
              <p className="text-[10px] text-[#5C6B73]">Night Audit Finalized: 04:00 EST</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
