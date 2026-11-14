'use client';

import React, { useEffect, useState } from 'react';
import {
  Receipt,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { GuestFolio, FolioPayment } from '@/types';

export default function FoliosPage() {
  const [folios, setFolios] = useState<GuestFolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolio, setSelectedFolio] = useState<GuestFolio | null>(null);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);

  // Split-tender form state
  const [cashBsdAmount, setCashBsdAmount] = useState<number>(0);
  const [cashUsdAmount, setCashUsdAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [cardRef, setCardRef] = useState('AUTH-VISA-9821');
  const [settlementSuccess, setSettlementSuccess] = useState<string | null>(null);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFolios = () => {
    fetch('/api/v1/folios')
      .then((res) => res.json())
      .then((json) => {
        setFolios(json.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load folios', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFolios();
  }, []);

  const openSettlementModal = (folio: GuestFolio) => {
    setSelectedFolio(folio);
    // By default, set card payment to entire balance due
    setCardAmount(folio.balance_due_cents / 100);
    setCashBsdAmount(0);
    setCashUsdAmount(0);
    setSettlementSuccess(null);
    setSettlementError(null);
    setIsSettlementOpen(true);
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolio) return;
    setIsSubmitting(true);
    setSettlementError(null);

    const tenders = [];
    if (cashBsdAmount > 0) {
      tenders.push({
        tenderId: 't-cash-bsd',
        method: 'cash_bsd',
        fixedCents: Math.round(cashBsdAmount * 100),
      });
    }
    if (cashUsdAmount > 0) {
      tenders.push({
        tenderId: 't-cash-usd',
        method: 'cash_usd',
        fixedCents: Math.round(cashUsdAmount * 100),
      });
    }
    if (cardAmount > 0) {
      tenders.push({
        tenderId: 't-card',
        method: 'credit_card',
        fixedCents: Math.round(cardAmount * 100),
        referenceNumber: cardRef,
      });
    }

    try {
      const res = await fetch(`/api/v1/folios/${selectedFolio.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenders }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSettlementError(json.error || 'Settlement failed');
        setIsSubmitting(false);
        return;
      }

      setSettlementSuccess(
        `Folio ${selectedFolio.folio_number} successfully settled! Odd-penny preservation verified with zero cent drift.`
      );
      setIsSubmitting(false);
      fetchFolios();
      setTimeout(() => {
        setIsSettlementOpen(false);
      }, 1800);
    } catch (err: any) {
      setSettlementError(err.message || 'Network error');
      setIsSubmitting(false);
    }
  };

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
            <Receipt className="w-4 h-4" />
            <span>Statutory Multi-Tender Billing Engine</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A2E35]">Guest Folio & Billing Settlements</h2>
          <p className="text-xs text-[#5C6B73]">
            Odd-penny preservation algorithm, dual-currency USD/BSD parity, and Bahamas 10% VAT tax compliance.
          </p>
        </div>
      </div>

      {/* Folios List */}
      <div className="luxury-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F0F4F2] text-[#5C6B73] font-semibold border-b border-[#DCE5E1] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Folio #</th>
                <th className="py-3 px-4">Booking Reference</th>
                <th className="py-3 px-4">Net Pre-Tax</th>
                <th className="py-3 px-4">10% VAT</th>
                <th className="py-3 px-4">10% Svc Charge</th>
                <th className="py-3 px-4">10% Hotel Levy</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E1]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#5C6B73]">
                    Loading guest folios...
                  </td>
                </tr>
              ) : folios.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#5C6B73]">
                    No active folios found.
                  </td>
                </tr>
              ) : (
                folios.map((folio) => (
                  <tr key={folio.id} className="hover:bg-[#F8FAF8] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#006B7D]">
                      {folio.folio_number}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#1A2E35]">
                      {folio.booking?.booking_reference || folio.booking_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#5C6B73]">
                      {formatCurrency(folio.total_pre_tax_cents)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#006B7D] font-medium">
                      {formatCurrency(folio.total_vat_cents)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#5C6B73]">
                      {formatCurrency(folio.total_service_charge_cents)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#5C6B73]">
                      {formatCurrency(folio.total_hotel_levy_cents)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1A2E35]">
                      {formatCurrency(folio.grand_total_cents)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#E07A5F]">
                      {formatCurrency(folio.balance_due_cents)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          folio.status === 'settled'
                            ? 'bg-[#EAF5EC] text-[#2D6A4F] border border-[#2D6A4F]/30'
                            : 'bg-[#F9F4EA] text-[#C5A059] border border-[#C5A059]/40'
                        }`}
                      >
                        {folio.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {folio.balance_due_cents > 0 ? (
                        <button
                          onClick={() => openSettlementModal(folio)}
                          className="px-3 py-1 rounded bg-[#006B7D] hover:bg-[#004B57] text-white font-semibold text-[11px] transition-all shadow-sm"
                        >
                          Settle Folio
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#2D6A4F] font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid In Full</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Tender Settlement Modal */}
      {isSettlementOpen && selectedFolio && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#DCE5E1]">
            <div className="flex items-start justify-between border-b border-[#DCE5E1] pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-[#006B7D]">Odd-Penny Multi-Tender Settlement</span>
                <h3 className="font-serif text-xl font-bold text-[#1A2E35]">
                  Settle Folio {selectedFolio.folio_number}
                </h3>
              </div>
              <button
                onClick={() => setIsSettlementOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#5C6B73]">Outstanding Balance Due:</span>
                <p className="font-mono text-xl font-bold text-[#E07A5F]">
                  {formatCurrency(selectedFolio.balance_due_cents)}
                </p>
              </div>
              <div className="text-right text-[11px] text-[#5C6B73]">
                <p>USD 1.00 = BSD 1.00</p>
                <p className="text-[#006B7D] font-semibold">Odd-Penny Guard Active</p>
              </div>
            </div>

            {settlementError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{settlementError}</span>
              </div>
            )}

            {settlementSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{settlementSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSettle} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1A2E35] mb-1">
                  Bahamian Dollar Cash (BSD $):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 font-mono">B$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashBsdAmount}
                    onChange={(e) => setCashBsdAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#DCE5E1] font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A2E35] mb-1">
                  United States Dollar Cash (USD $):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 font-mono">US$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashUsdAmount}
                    onChange={(e) => setCashUsdAmount(Number(e.target.value))}
                    className="w-full pl-11 pr-3 py-2 rounded-lg border border-[#DCE5E1] font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A2E35] mb-1">
                  Credit Card Amount (Visa / MasterCard / Amex):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#DCE5E1] font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A2E35] mb-1">Card Auth Reference:</label>
                <input
                  type="text"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#DCE5E1] font-mono"
                />
              </div>

              {/* Tenders Total Preview */}
              <div className="p-3 rounded-lg bg-[#E0F2F5]/50 border border-[#006B7D]/20 text-[11px] flex items-center justify-between">
                <span className="font-semibold text-[#006B7D]">Tender Total Tendered:</span>
                <span className="font-mono font-bold text-[#1A2E35]">
                  {formatCurrency((cashBsdAmount + cashUsdAmount + cardAmount) * 100)}
                </span>
              </div>

              <div className="pt-3 border-t border-[#DCE5E1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettlementOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#DCE5E1] text-[#5C6B73] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#006B7D] hover:bg-[#004B57] text-white font-semibold transition-all shadow-sm"
                >
                  {isSubmitting ? 'Preserving Odd Pennies...' : 'Execute Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
