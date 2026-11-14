'use client';

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Wine,
  Coffee,
  Sparkles,
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  outlet: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Bahamian Spiny Rock Lobster', category: 'Mains', priceCents: 6500, outlet: 'Sunset Pier Restaurant' },
  { id: 'm2', name: 'Conch Fritters with Calypso Dip', category: 'Appetizers', priceCents: 2400, outlet: 'Sunset Pier Restaurant' },
  { id: 'm3', name: 'Yellowfin Tuna Tartare & Plantain', category: 'Appetizers', priceCents: 2800, outlet: 'Sunset Pier Restaurant' },
  { id: 'm4', name: 'Bahama Mama Rum Punch', category: 'Cocktails', priceCents: 2200, outlet: 'Driftwood Pool Bar' },
  { id: 'm5', name: 'Sky Juice with Fresh Coconut & Nutmeg', category: 'Cocktails', priceCents: 1800, outlet: 'Driftwood Pool Bar' },
  { id: 'm6', name: 'Dom Pérignon Vintage Champagne', category: 'Champagne', priceCents: 45000, outlet: 'Sunset Pier Restaurant' },
  { id: 'm7', name: 'Kobe Beef Sliders with Truffle Fries', category: 'Bites', priceCents: 3800, outlet: 'Royal Cabanas' },
  { id: 'm8', name: 'Artisanal Blue Mountain Espresso', category: 'Coffee', priceCents: 900, outlet: 'Royal Cabanas' },
];

export default function POSPage() {
  const [selectedOutlet, setSelectedOutlet] = useState('All');
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);

  // Room charge modal
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState('V-201');
  const [guestSurname, setGuestSurname] = useState('Wellington');
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [chargeReceipt, setChargeReceipt] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredMenu = selectedOutlet === 'All'
    ? MENU_ITEMS
    : MENU_ITEMS.filter((i) => i.outlet === selectedOutlet);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const preTaxTotalCents = cart.reduce(
    (sum, i) => sum + i.item.priceCents * i.quantity,
    0
  );
  // Non-lodging taxes: 10% Service Charge, 10% VAT, 0% Hotel Levy
  const serviceChargeCents = Math.round(preTaxTotalCents * 0.10);
  const vatCents = Math.round(preTaxTotalCents * 0.10);
  const grandTotalCents = preTaxTotalCents + serviceChargeCents + vatCents;

  const handleChargeToRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargeError(null);
    setChargeReceipt(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/pos/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber,
          guestSurname,
          outletName: selectedOutlet === 'All' ? 'Sunset Pier Restaurant' : selectedOutlet,
          description: cart.map((i) => `${i.quantity}x ${i.item.name}`).join(', '),
          amountCents: preTaxTotalCents,
          serverName: 'Julian Cashier',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setChargeError(json.message || json.error || 'Room charge failed');
        setSubmitting(false);
        return;
      }

      setChargeReceipt(json.data);
      setSubmitting(false);
      setCart([]);
    } catch (err: any) {
      setChargeError(err.message || 'Network error');
      setSubmitting(false);
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
            <UtensilsCrossed className="w-4 h-4" />
            <span>F&B Outlets & Dining Terminal</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A2E35]">Resort Outlets Point-of-Sale</h2>
          <p className="text-xs text-[#5C6B73]">
            Instant room folio charge with strict surname verification and Bahamian 10% VAT + 10% service charge routing.
          </p>
        </div>

        {/* Outlet Filter */}
        <div className="flex items-center gap-2">
          {['All', 'Sunset Pier Restaurant', 'Driftwood Pool Bar', 'Royal Cabanas'].map((outlet) => (
            <button
              key={outlet}
              onClick={() => setSelectedOutlet(outlet)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                selectedOutlet === outlet
                  ? 'bg-[#1A2E35] text-white border-[#1A2E35]'
                  : 'bg-white text-[#5C6B73] border-[#DCE5E1] hover:bg-[#F0F4F2]'
              }`}
            >
              {outlet}
            </button>
          ))}
        </div>
      </div>

      {/* POS Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Menu Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              onClick={() => addToCart(item)}
              className="luxury-card p-4 cursor-pointer hover:border-[#006B7D] transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase text-[#006B7D]">{item.outlet}</span>
                <h3 className="font-serif font-bold text-base text-[#1A2E35] mt-0.5">{item.name}</h3>
                <span className="text-xs text-[#5C6B73]">{item.category}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-[#DCE5E1] flex items-center justify-between">
                <span className="font-mono text-base font-bold text-[#1A2E35]">
                  {formatCurrency(item.priceCents)}
                </span>
                <button className="p-1.5 rounded bg-[#E0F2F5] text-[#006B7D] hover:bg-[#006B7D] hover:text-white transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Col: Active Order Ticket */}
        <div className="luxury-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#DCE5E1] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#1A2E35]">Current Order Ticket</h3>
                <p className="text-[11px] text-[#5C6B73]">{selectedOutlet}</p>
              </div>
              <Receipt className="w-4 h-4 text-[#006B7D]" />
            </div>

            <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="text-xs text-[#5C6B73] text-center py-8 italic">
                  Select menu items to build order.
                </p>
              ) : (
                cart.map((i) => (
                  <div key={i.item.id} className="flex items-center justify-between text-xs p-2 rounded bg-[#F8FAF8] border border-[#DCE5E1]">
                    <div>
                      <span className="font-semibold text-[#1A2E35]">
                        {i.quantity}x {i.item.name}
                      </span>
                      <span className="block text-[10px] text-[#5C6B73]">
                        {formatCurrency(i.item.priceCents)} each
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1A2E35]">
                        {formatCurrency(i.item.priceCents * i.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(i.item.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pricing & Checkout */}
          <div className="pt-3 border-t border-[#DCE5E1] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#5C6B73]">
              <span>Pre-Tax Items:</span>
              <span className="font-mono">{formatCurrency(preTaxTotalCents)}</span>
            </div>
            <div className="flex items-center justify-between text-[#5C6B73]">
              <span>Resort Service Charge (10%):</span>
              <span className="font-mono">{formatCurrency(serviceChargeCents)}</span>
            </div>
            <div className="flex items-center justify-between text-[#5C6B73]">
              <span>Bahamas VAT (10%):</span>
              <span className="font-mono">{formatCurrency(vatCents)}</span>
            </div>
            <div className="pt-2 border-t border-[#DCE5E1] flex items-center justify-between font-bold text-sm text-[#1A2E35]">
              <span>Grand Total:</span>
              <span className="font-mono text-base text-[#006B7D]">{formatCurrency(grandTotalCents)}</span>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => {
                setChargeError(null);
                setChargeReceipt(null);
                setIsChargeModalOpen(true);
              }}
              className="w-full mt-3 py-2.5 rounded-lg bg-[#006B7D] hover:bg-[#004B57] disabled:bg-gray-300 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-[#C5A059]" />
              <span>Charge to Room Folio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Charge to Room Folio Verification Modal */}
      {isChargeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#DCE5E1]">
            <div className="flex items-start justify-between border-b border-[#DCE5E1] pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-[#006B7D]">Room Charge Verification</span>
                <h3 className="font-serif text-xl font-bold text-[#1A2E35]">Verify Guest & Post Charge</h3>
              </div>
              <button
                onClick={() => setIsChargeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {chargeError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{chargeError}</span>
              </div>
            )}

            {chargeReceipt ? (
              <div className="p-4 rounded-lg bg-[#EAF5EC] border border-[#2D6A4F]/30 text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#2D6A4F] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Charge Posted Successfully to Room Folio!</span>
                </div>
                <div className="text-[#1A2E35] space-y-1 pt-1 font-mono">
                  <p>Receipt: {chargeReceipt.receipt_number}</p>
                  <p>Room: {chargeReceipt.room_number}</p>
                  <p>Guest: {chargeReceipt.guest_name}</p>
                  <p>Total Charged: {formatCurrency(chargeReceipt.posted_item.total_amount_cents)}</p>
                  <p className="text-[#006B7D] font-bold">
                    Folio Balance Due: {formatCurrency(chargeReceipt.folio_balance_due_cents)}
                  </p>
                </div>
                <button
                  onClick={() => setIsChargeModalOpen(false)}
                  className="w-full mt-3 py-2 rounded-lg bg-[#2D6A4F] text-white font-semibold"
                >
                  Close Receipt
                </button>
              </div>
            ) : (
              <form onSubmit={handleChargeToRoom} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#1A2E35] mb-1">Room Number:</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. V-201, OW-102"
                    className="w-full p-2 rounded-lg border border-[#DCE5E1] font-mono font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1A2E35] mb-1">
                    Guest Surname (Last Name Verification):
                  </label>
                  <input
                    type="text"
                    value={guestSurname}
                    onChange={(e) => setGuestSurname(e.target.value)}
                    placeholder="e.g. Wellington, Vanderbilt"
                    className="w-full p-2 rounded-lg border border-[#DCE5E1]"
                    required
                  />
                  <p className="text-[10px] text-[#5C6B73] mt-1">
                    System verifies that the guest is in-house and surname matches room registry.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#F8FAF8] border border-[#DCE5E1] space-y-1 text-[11px]">
                  <div className="flex justify-between text-[#5C6B73]">
                    <span>Order Subtotal:</span>
                    <span className="font-mono">{formatCurrency(preTaxTotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-[#5C6B73]">
                    <span>10% Svc + 10% VAT:</span>
                    <span className="font-mono">{formatCurrency(serviceChargeCents + vatCents)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#006B7D] pt-1 border-t border-[#DCE5E1]">
                    <span>Total Posting:</span>
                    <span className="font-mono">{formatCurrency(grandTotalCents)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DCE5E1] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChargeModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#DCE5E1] text-[#5C6B73] font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-[#006B7D] hover:bg-[#004B57] text-white font-semibold transition-all shadow-sm"
                  >
                    {submitting ? 'Verifying Surname...' : 'Post Charge to Room'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
