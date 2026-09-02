import React, { useRef } from "react";
import { X, Download, Printer, CheckCircle2, Utensils } from "lucide-react";

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customDetails?: string;
}

interface Order {
  id: string;
  customerName: string;
  tableNumber: number | string;
  items: OrderItem[];
  status: string;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  createdAt: Date;
  prepTimeMinutes: number;
  waiterId?: string;
  waiterName?: string;
}

interface BillModalProps {
  order: Order;
  onClose: () => void;
}

export function BillModal({ order, onClose }: BillModalProps) {
  const billRef = useRef<HTMLDivElement>(null);

  const createdAt = new Date(order.createdAt);
  const dateStr = createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const handlePrint = () => {
    const billHtml = billRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) return;
    win.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Bill — ${order.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #fff;
      color: #111;
      padding: 40px;
      max-width: 600px;
      margin: 0 auto;
    }
    .bill-wrap { width: 100%; }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f59e0b; margin-bottom: 20px; }
    .logo-row { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 6px; }
    .logo-icon { width: 40px; height: 40px; background: #f59e0b; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .brand { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #111; }
    .tagline { font-size: 11px; color: #888; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.1em; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin: 20px 0; font-size: 12px; }
    .meta-label { color: #888; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
    .meta-value { color: #111; font-weight: 600; }
    .divider { border: none; border-top: 1px dashed #ddd; margin: 16px 0; }
    .items-header { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; font-family: 'JetBrains Mono', monospace; padding-bottom: 8px; border-bottom: 1px solid #eee; margin-bottom: 8px; }
    .item-row { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
    .item-name { font-weight: 600; }
    .item-custom { font-size: 10px; color: #888; margin-top: 2px; font-style: italic; }
    .item-qty { color: #888; text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
    .item-total { font-weight: 600; text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
    .totals { margin-top: 12px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .total-row.sub, .total-row.tax { color: #666; }
    .total-row.grand { font-weight: 800; font-size: 18px; color: #111; padding-top: 10px; border-top: 2px solid #f59e0b; margin-top: 6px; }
    .total-row.grand .val { color: #d97706; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .footer { text-align: center; margin-top: 28px; font-size: 11px; color: #aaa; }
    .footer strong { color: #f59e0b; }
    .status-badge { display: inline-block; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 20px; padding: 2px 10px; font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-top: 4px; }
    @media print {
      body { padding: 20px; }
      @page { size: A5; margin: 10mm; }
    }
  </style>
</head>
<body>
<div class="bill-wrap">
  <div class="header">
    <div class="logo-row">
      <div class="logo-icon">🍽</div>
      <span class="brand">Foodখোর Club</span>
    </div>
    <p class="tagline">আসল বাংলার স্বাদ · Authentic Bengali Cuisine</p>
    <div class="status-badge">✓ Order Confirmed</div>
  </div>

  <div class="meta-grid">
    <div><div class="meta-label">Receipt No.</div><div class="meta-value mono">${order.id}</div></div>
    <div><div class="meta-label">Date</div><div class="meta-value">${dateStr}</div></div>
    <div><div class="meta-label">Time</div><div class="meta-value mono">${timeStr}</div></div>
    <div><div class="meta-label">Table</div><div class="meta-value">${order.tableNumber}</div></div>
    <div><div class="meta-label">Customer</div><div class="meta-value">${order.customerName}</div></div>
    ${order.waiterName ? `<div><div class="meta-label">Server</div><div class="meta-value">${order.waiterName}</div></div>` : ""}
  </div>

  <hr class="divider" />

  <div class="items-header">
    <span>Item</span><span>Qty</span><span>Amount</span>
  </div>
  ${order.items.map(item => `
    <div class="item-row">
      <div>
        <div class="item-name">${item.name}</div>
        ${item.customDetails ? `<div class="item-custom">${item.customDetails}</div>` : ""}
      </div>
      <div class="item-qty">×${item.quantity}</div>
      <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
    </div>
  `).join("")}

  <hr class="divider" />

  <div class="totals">
    <div class="total-row sub"><span>Subtotal</span><span class="mono">$${order.totalAmount.toFixed(2)}</span></div>
    <div class="total-row tax"><span>Tax (9%)</span><span class="mono">$${order.taxAmount.toFixed(2)}</span></div>
    <div class="total-row grand"><span>Total</span><span class="val mono">$${order.grandTotal.toFixed(2)}</span></div>
  </div>

  <div class="footer">
    <p>Thank you for dining with us! 🙏</p>
    <p style="margin-top:4px">Questions? Visit us at <strong>foodkhorclub.com</strong></p>
  </div>
</div>
<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>
    `);
    win.document.close();
  };

  const c = {
    bg: "var(--background)", card: "var(--card)", muted: "var(--muted)",
    border: "var(--border)", fg: "var(--foreground)", sub: "var(--muted-foreground)",
    primary: "var(--primary)", pFg: "var(--primary-foreground)",
    secondary: "var(--secondary)", popover: "var(--popover)",
    sans: "var(--font-sans)", serif: "var(--font-serif)", mono: "var(--font-mono)",
  };

  const subtotal = order.totalAmount;
  const tax = order.taxAmount;
  const grand = order.grandTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="w-full max-w-md flex flex-col rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{ background: c.card, border: `1px solid ${c.border}` }}
        onClick={e => e.stopPropagation()}>

        {/* ── Modal header ── */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10 rounded-t-2xl"
          style={{ background: c.card, borderBottom: `1px solid ${c.border}` }}>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold"
              style={{ fontFamily: c.mono, color: c.primary }}>Tax Invoice</p>
            <h3 className="font-bold" style={{ fontFamily: c.serif, color: c.fg, fontSize: "1.1rem" }}>
              Bill — #{order.id}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
              style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: c.primary, border: `1px solid color-mix(in srgb, var(--primary) 25%, transparent)`, fontFamily: c.sans }}>
              <Download className="size-3.5" /> Download PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: c.sub }}>
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* ── Bill body (preview) ── */}
        <div ref={billRef} className="px-6 py-5 flex flex-col gap-5">

          {/* Brand header */}
          <div className="flex flex-col items-center gap-1.5 pb-4"
            style={{ borderBottom: `2px solid ${c.primary}` }}>
            <div className="size-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", boxShadow: "0 6px 20px color-mix(in srgb, var(--primary) 35%, transparent)" }}>
              <Utensils className="size-5" style={{ color: "#000" }} />
            </div>
            <p className="font-bold text-xl" style={{ fontFamily: c.serif, color: c.fg }}>Foodখোর Club</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: c.mono, color: c.sub }}>
              আসল বাংলার স্বাদ · Authentic Bengali Cuisine
            </p>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold mt-1"
              style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", color: "#22c55e", border: "1px solid color-mix(in srgb, #22c55e 25%, transparent)", fontFamily: c.mono }}>
              <CheckCircle2 className="size-3" /> Order Confirmed
            </div>
          </div>

          {/* Meta details */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Receipt No.", value: order.id, mono: true },
              { label: "Date", value: dateStr, mono: false },
              { label: "Time", value: timeStr, mono: true },
              { label: "Table", value: String(order.tableNumber), mono: false },
              { label: "Customer", value: order.customerName, mono: false },
              ...(order.waiterName ? [{ label: "Server", value: order.waiterName, mono: false }] : []),
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex flex-col gap-0.5 p-3 rounded-xl"
                style={{ background: c.secondary, border: `1px solid ${c.border}` }}>
                <span className="text-[9px] uppercase tracking-widest"
                  style={{ fontFamily: c.mono, color: c.sub }}>{label}</span>
                <span className="text-sm font-semibold truncate"
                  style={{ fontFamily: mono ? c.mono : c.sans, color: c.fg }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Line items */}
          <div className="flex flex-col" style={{ border: `1px solid ${c.border}`, borderRadius: "12px", overflow: "hidden" }}>
            {/* Column headers */}
            <div className="grid px-4 py-2 text-[10px] uppercase tracking-widest"
              style={{ gridTemplateColumns: "1fr 3rem 5rem", background: c.muted, color: c.sub, fontFamily: c.mono }}>
              <span>Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Amount</span>
            </div>

            {order.items.map((item, idx) => (
              <div key={item.id}
                className="grid px-4 py-3 items-start"
                style={{
                  gridTemplateColumns: "1fr 3rem 5rem",
                  borderTop: idx === 0 ? `1px solid ${c.border}` : `1px solid color-mix(in srgb, ${c.border} 50%, transparent)`,
                  background: idx % 2 === 0 ? "transparent" : `color-mix(in srgb, ${c.muted} 40%, transparent)`,
                }}>
                <div>
                  <p className="text-sm font-semibold" style={{ fontFamily: c.sans, color: c.fg }}>{item.name}</p>
                  {item.customDetails && (
                    <p className="text-[10px] mt-0.5 italic" style={{ fontFamily: c.sans, color: c.sub }}>{item.customDetails}</p>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ fontFamily: c.mono, color: c.sub }}>
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
                <p className="text-sm text-right self-center" style={{ fontFamily: c.mono, color: c.sub }}>×{item.quantity}</p>
                <p className="text-sm font-bold text-right self-center" style={{ fontFamily: c.mono, color: c.fg }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals block */}
          <div className="flex flex-col gap-0 rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${c.border}` }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${c.border}` }}>
              <span className="text-sm" style={{ fontFamily: c.sans, color: c.sub }}>Subtotal</span>
              <span className="text-sm font-semibold" style={{ fontFamily: c.mono, color: c.fg }}>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `2px dashed ${c.border}` }}>
              <div>
                <span className="text-sm" style={{ fontFamily: c.sans, color: c.sub }}>Tax</span>
                <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded"
                  style={{ background: c.muted, color: c.sub, fontFamily: c.mono }}>9%</span>
              </div>
              <span className="text-sm font-semibold" style={{ fontFamily: c.mono, color: c.fg }}>${tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-4"
              style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)" }}>
              <span className="font-bold" style={{ fontFamily: c.sans, color: c.fg, fontSize: "1rem" }}>Total Due</span>
              <span className="font-bold" style={{ fontFamily: c.mono, color: c.primary, fontSize: "1.35rem" }}>
                ${grand.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Thank-you footer */}
          <div className="flex flex-col items-center gap-1.5 text-center pt-1 pb-2">
            <p className="text-sm" style={{ fontFamily: c.sans, color: c.sub }}>
              Thank you for dining with us! 🙏
            </p>
            <p className="text-[10px]" style={{ fontFamily: c.mono, color: c.sub }}>
              Questions? Speak to our team or visit foodkhorclub.com
            </p>
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="sticky bottom-0 flex gap-3 px-5 py-4 rounded-b-2xl"
          style={{ background: c.card, borderTop: `1px solid ${c.border}` }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: c.secondary, color: c.fg, border: `1px solid ${c.border}`, fontFamily: c.sans }}>
            Close
          </button>
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition"
            style={{ background: c.primary, color: c.pFg, fontFamily: c.sans, boxShadow: "0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent)" }}>
            <Printer className="size-4" /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
