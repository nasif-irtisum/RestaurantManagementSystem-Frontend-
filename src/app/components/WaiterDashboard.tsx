import React, { useState, useMemo } from "react";
import {
  UserCheck, Clock, LogIn, LogOut, Plus, Minus, X, CheckCircle2,
  ShoppingBag, Users, MapPin, Utensils, AlertCircle, ChefHat,
  ClipboardList, CircleCheck, Loader2, Timer, Search
} from "lucide-react";
import { toast } from "sonner";

type Role = "Admin" | "Waiter" | "Chef" | "Customer" | "Guest";
type OrderStatus = "Placed" | "In Kitchen" | "Ready" | "Served" | "Paid";

interface MenuItem {
  id: string; name: string; category: string; price: number;
  description: string; prepTimeMinutes: number; image: string; approved: boolean;
  isCustomizable?: boolean;
}
interface Table {
  id: string; number: number; capacity: number; location: string;
  status: "Available" | "Occupied" | "Reserved";
  assignedWaiterId?: string; assignedWaiterName?: string;
}
interface OrderItem {
  id: string; menuItemId: string; name: string; price: number;
  quantity: number; customDetails?: string;
}
interface Order {
  id: string; customerName: string; tableNumber: number | string;
  items: OrderItem[]; status: OrderStatus;
  totalAmount: number; taxAmount: number; grandTotal: number;
  createdAt: Date; prepStartTime?: Date; prepTimeMinutes: number;
  waiterId?: string; waiterName?: string; isPaid?: boolean;
}
interface Employee {
  id: string; name: string; role: "Waiter" | "Chef";
  email: string; phone: string; clockedIn: boolean;
  lastClockIn?: string; lastClockOut?: string;
}

interface WaiterDashboardProps {
  currentUser: { name: string; email: string; role: Role };
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  menu: MenuItem[];
}

const STATUS_ORDER: OrderStatus[] = ["Placed", "In Kitchen", "Ready", "Served", "Paid"];

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  "Placed":    { bg: "rgba(96,165,250,0.12)", color: "#60a5fa", label: "Placed" },
  "In Kitchen":{ bg: "rgba(251,191,36,0.12)", color: "#fbbf24", label: "In Kitchen" },
  "Ready":     { bg: "rgba(52,211,153,0.12)", color: "#34d399", label: "Ready ✓" },
  "Served":    { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", label: "Served" },
  "Paid":      { bg: "rgba(156,163,175,0.12)", color: "#9ca3af", label: "Paid" },
};

const LOCATION_ICON: Record<string, string> = {
  "Main Dining Hall": "🏛",
  "Window Section": "🪟",
  "VIP Courtyard": "⭐",
};

export function WaiterDashboard({
  currentUser, employees, setEmployees, tables, setTables,
  orders, setOrders, menu
}: WaiterDashboardProps) {

  // Find this waiter's employee record
  const waiter = useMemo(
    () => employees.find(e => e.name === currentUser.name && e.role === "Waiter") || employees.find(e => e.role === "Waiter"),
    [employees, currentUser.name]
  );

  // Add-order modal state
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [orderTable, setOrderTable] = useState<Table | null>(null);
  const [orderCustomer, setOrderCustomer] = useState("");
  const [orderItems, setOrderItems] = useState<{ item: MenuItem; qty: number }[]>([]);
  const [menuSearch, setMenuSearch] = useState("");

  // Derived data
  const myTables = useMemo(() => tables.filter(t => t.assignedWaiterId === waiter?.id), [tables, waiter]);
  const availableTables = useMemo(() => tables.filter(t => t.status === "Available"), [tables]);
  const activeOrders = useMemo(
    () => orders.filter(o => o.waiterId === waiter?.id && o.status !== "Paid"),
    [orders, waiter]
  );
  const deliveredToday = useMemo(
    () => orders.filter(o => o.waiterId === waiter?.id && o.status === "Served").length,
    [orders, waiter]
  );
  const filteredMenu = useMemo(
    () => menu.filter(m => m.approved && m.name.toLowerCase().includes(menuSearch.toLowerCase())),
    [menu, menuSearch]
  );

  // ── Handlers ──────────────────────────────────────────────

  const handleClockToggle = () => {
    if (!waiter) return;
    const next = !waiter.clockedIn;
    setEmployees(prev => prev.map(e => e.id === waiter.id ? {
      ...e,
      clockedIn: next,
      lastClockIn: next ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : e.lastClockIn,
      lastClockOut: !next ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : e.lastClockOut,
    } : e));
    toast.success(next ? "Clocked IN — have a great shift!" : "Clocked OUT — see you next time!");
  };

  const handleTakeTable = (table: Table) => {
    if (!waiter) return;
    setTables(prev => prev.map(t => t.id === table.id
      ? { ...t, status: "Occupied", assignedWaiterId: waiter.id, assignedWaiterName: waiter.name }
      : t
    ));
    toast.success(`You are now serving Table ${table.number}`);
  };

  const handleReleaseTable = (table: Table) => {
    setTables(prev => prev.map(t => t.id === table.id
      ? { ...t, status: "Available", assignedWaiterId: undefined, assignedWaiterName: undefined }
      : t
    ));
    toast.info(`Table ${table.number} released`);
  };

  const handleMarkDelivered = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Served" } : o));
    toast.success(`Order marked as Delivered`);
  };

  const addItemToOrder = (item: MenuItem) => {
    setOrderItems(prev => {
      const ex = prev.find(x => x.item.id === item.id);
      return ex ? prev.map(x => x.item.id === item.id ? { ...x, qty: x.qty + 1 } : x) : [...prev, { item, qty: 1 }];
    });
  };

  const adjustQty = (itemId: string, delta: number) => {
    setOrderItems(prev =>
      prev.map(x => x.item.id === itemId ? { ...x, qty: x.qty + delta } : x).filter(x => x.qty > 0)
    );
  };

  const handleSubmitOrder = () => {
    if (!orderTable || orderItems.length === 0 || !waiter) return;
    const customer = orderCustomer.trim() || `Table ${orderTable.number} Guest`;
    const items: OrderItem[] = orderItems.map(({ item, qty }) => ({
      id: `oi-${Date.now()}-${item.id}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: qty,
    }));
    const sub = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = +(sub * 0.09).toFixed(2);
    const grand = +(sub + tax).toFixed(2);
    setOrders(prev => [{
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customer,
      tableNumber: orderTable.number,
      items, status: "Placed",
      totalAmount: sub, taxAmount: tax, grandTotal: grand,
      createdAt: new Date(), prepTimeMinutes: 20,
      waiterId: waiter.id, waiterName: waiter.name,
    }, ...prev]);
    setShowAddOrder(false);
    setOrderTable(null);
    setOrderCustomer("");
    setOrderItems([]);
    setMenuSearch("");
    toast.success(`Order placed for Table ${orderTable.number}`);
  };

  // ── UI helpers ─────────────────────────────────────────────

  const css = {
    bg:      "var(--background)",
    card:    "var(--card)",
    muted:   "var(--muted)",
    border:  "var(--border)",
    fg:      "var(--foreground)",
    sub:     "var(--muted-foreground)",
    primary: "var(--primary)",
    pFg:     "var(--primary-foreground)",
    secondary:"var(--secondary)",
    sans:    "var(--font-sans)",
    serif:   "var(--font-serif)",
    mono:    "var(--font-mono)",
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">

      {/* ── WELCOME HEADER ─── */}
      <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: css.card, border: `1px solid ${css.border}` }}>
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: css.primary, fontFamily: css.serif }}>
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: css.mono, color: css.primary }}>Waiter Dashboard</p>
            <h2 className="font-bold text-xl" style={{ fontFamily: css.serif, color: css.fg }}>{currentUser.name}</h2>
            <p className="text-xs mt-0.5" style={{ fontFamily: css.sans, color: css.sub }}>
              {waiter?.clockedIn
                ? `Clocked in since ${waiter.lastClockIn || "—"}`
                : `Last clocked out: ${waiter?.lastClockOut || "—"}`}
            </p>
          </div>
        </div>

        {/* Clock In/Out */}
        <button onClick={handleClockToggle}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition shrink-0"
          style={waiter?.clockedIn
            ? { background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444", border: "1.5px solid color-mix(in srgb, #ef4444 30%, transparent)", fontFamily: css.sans }
            : { background: css.primary, color: css.pFg, fontFamily: css.sans, boxShadow: "0 4px 20px color-mix(in srgb, var(--primary) 30%, transparent)" }}>
          {waiter?.clockedIn ? <LogOut className="size-5" /> : <LogIn className="size-5" />}
          <span>{waiter?.clockedIn ? "Clock Out" : "Clock In"}</span>
          <div className="size-2.5 rounded-full" style={{ background: waiter?.clockedIn ? "#22c55e" : "#ef4444" }} />
        </button>
      </div>

      {/* ── STATS ROW ─── */}
      {[
        { label: "My Tables", value: myTables.length, icon: Utensils, color: css.primary },
        { label: "Active Orders", value: activeOrders.length, icon: ClipboardList, color: "#60a5fa" },
        { label: "Delivered Today", value: deliveredToday, icon: CircleCheck, color: "#34d399" },
        { label: "Status", value: waiter?.clockedIn ? "On Duty" : "Off Duty", icon: UserCheck, color: waiter?.clockedIn ? "#22c55e" : "#9ca3af" },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} />
      )) /* placeholder replaced by grid below */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-4">
        {[
          { label: "My Tables", value: myTables.length, icon: Utensils, color: "var(--primary)" },
          { label: "Active Orders", value: activeOrders.length, icon: ClipboardList, color: "#60a5fa" },
          { label: "Delivered Today", value: deliveredToday, icon: CircleCheck, color: "#34d399" },
          { label: "Shift Status", value: waiter?.clockedIn ? "On Duty" : "Off Duty", icon: UserCheck, color: waiter?.clockedIn ? "#22c55e" : "#9ca3af" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: css.card, border: `1px solid ${css.border}` }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ fontFamily: css.sans, color: css.sub }}>{label}</span>
              <div className="size-7 rounded-lg flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                <Icon className="size-3.5" style={{ color }} />
              </div>
            </div>
            <p className="font-bold text-2xl" style={{ fontFamily: css.mono, color: css.fg }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: TABLES */}
        <div className="flex flex-col gap-4">

          {/* My Assigned Tables */}
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: css.card, border: `1px solid ${css.border}` }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ fontFamily: css.serif, color: css.fg }}>My Tables</h3>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", fontFamily: css.mono }}>
                {myTables.length} serving
              </span>
            </div>

            {myTables.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 rounded-xl" style={{ background: css.muted }}>
                <Utensils className="size-8" style={{ color: css.sub }} />
                <p className="text-sm" style={{ color: css.sub, fontFamily: css.sans }}>No tables assigned yet</p>
                <p className="text-xs" style={{ color: css.sub, fontFamily: css.sans }}>Pick up an available table below</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {myTables.map(table => {
                  const tableOrders = activeOrders.filter(o => o.tableNumber === table.number);
                  return (
                    <div key={table.id} className="rounded-xl p-4 flex items-center justify-between gap-3"
                      style={{ background: css.secondary, border: `1px solid color-mix(in srgb, var(--primary) 20%, transparent)` }}>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl flex items-center justify-center font-bold"
                          style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)", fontFamily: css.mono, fontSize: "1rem" }}>
                          {table.number}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: css.fg, fontFamily: css.sans }}>{table.location}</p>
                          <p className="text-xs" style={{ color: css.sub, fontFamily: css.sans }}>
                            {table.capacity} seats · {tableOrders.length} active order{tableOrders.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setOrderTable(table); setShowAddOrder(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: css.sans }}>
                          <Plus className="size-3" /> Order
                        </button>
                        <button onClick={() => handleReleaseTable(table)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          style={{ background: css.muted, color: css.sub, fontFamily: css.sans, border: `1px solid ${css.border}` }}>
                          Release
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Tables to Pick Up */}
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: css.card, border: `1px solid ${css.border}` }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ fontFamily: css.serif, color: css.fg }}>Available Tables</h3>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", color: "#22c55e", fontFamily: css.mono }}>
                {availableTables.length} free
              </span>
            </div>

            {availableTables.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: css.sub, fontFamily: css.sans }}>All tables are occupied or reserved</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availableTables.map(table => (
                  <div key={table.id} className="rounded-xl p-3 flex flex-col gap-2"
                    style={{ background: css.secondary, border: "1px solid color-mix(in srgb, #22c55e 20%, transparent)" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{LOCATION_ICON[table.location] || "🍽"}</span>
                        <span className="font-bold" style={{ fontFamily: css.mono, color: css.fg }}>T{table.number}</span>
                      </div>
                      <div className="size-2 rounded-full" style={{ background: "#22c55e" }} />
                    </div>
                    <p className="text-xs" style={{ color: css.sub, fontFamily: css.sans }}>{table.location} · {table.capacity} seats</p>
                    <button onClick={() => handleTakeTable(table)}
                      className="w-full py-1.5 rounded-lg text-xs font-bold transition"
                      style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", color: "#22c55e", border: "1px solid color-mix(in srgb, #22c55e 25%, transparent)", fontFamily: css.sans }}>
                      Take Table
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ACTIVE ORDERS */}
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: css.card, border: `1px solid ${css.border}` }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold" style={{ fontFamily: css.serif, color: css.fg }}>Active Orders</h3>
            <button onClick={() => { setOrderTable(myTables[0] || null); setShowAddOrder(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: css.sans }}>
              <Plus className="size-3.5" /> New Order
            </button>
          </div>

          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 rounded-xl" style={{ background: css.muted }}>
              <ShoppingBag className="size-10" style={{ color: css.sub }} />
              <div className="text-center">
                <p className="font-semibold" style={{ color: css.fg, fontFamily: css.sans }}>No active orders</p>
                <p className="text-xs mt-1" style={{ color: css.sub, fontFamily: css.sans }}>Add an order from a table above</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[520px] pr-1">
              {activeOrders.map(order => {
                const st = STATUS_STYLE[order.status];
                const canDeliver = order.status === "Ready";
                const canAdvance = order.status === "Placed";
                return (
                  <div key={order.id} className="rounded-xl p-4 flex flex-col gap-3"
                    style={{ background: css.secondary, border: `1px solid ${css.border}` }}>
                    {/* Order header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm" style={{ color: css.fg, fontFamily: css.sans }}>#{order.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: st.bg, color: st.color, fontFamily: css.mono }}>{st.label}</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: css.sub, fontFamily: css.sans }}>
                          Table {order.tableNumber} · {order.customerName}
                        </p>
                      </div>
                      <span className="font-bold text-sm shrink-0" style={{ color: "var(--primary)", fontFamily: css.mono }}>
                        ${order.grandTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="flex flex-col gap-1">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-xs" style={{ color: css.sub, fontFamily: css.sans }}>
                          <span>{item.name} ×{item.quantity}</span>
                          <span style={{ fontFamily: css.mono }}>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {canDeliver && (
                        <button onClick={() => handleMarkDelivered(order.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition"
                          style={{ background: "color-mix(in srgb, #34d399 12%, transparent)", color: "#34d399", border: "1px solid color-mix(in srgb, #34d399 25%, transparent)", fontFamily: css.sans }}>
                          <CheckCircle2 className="size-3.5" /> Mark Delivered
                        </button>
                      )}
                      {canAdvance && (
                        <button onClick={() => {
                          const maxPrepTime = Math.max(0, ...order.items.map(i => {
                            const mi = menu.find(m => m.id === i.menuItemId);
                            return mi ? mi.prepTimeMinutes : 0;
                          }));
                          setOrders(prev => prev.map(o => o.id === order.id ? {
                            ...o,
                            status: "In Kitchen",
                            prepStartTime: new Date(),
                            prepTimeMinutes: maxPrepTime || o.prepTimeMinutes,
                          } : o));
                          toast.success(`Order #${order.id} sent to kitchen`);
                        }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition"
                          style={{ background: "color-mix(in srgb, #fbbf24 12%, transparent)", color: "#fbbf24", border: "1px solid color-mix(in srgb, #fbbf24 25%, transparent)", fontFamily: css.sans }}>
                          <ChefHat className="size-3.5" /> Send to Kitchen
                        </button>
                      )}
                      {order.status === "In Kitchen" && (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs"
                          style={{ background: css.muted, color: css.sub, fontFamily: css.sans }}>
                          <Loader2 className="size-3.5 animate-spin" /> Kitchen preparing…
                        </div>
                      )}
                      {order.status === "Served" && (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs"
                          style={{ background: "color-mix(in srgb, #a78bfa 10%, transparent)", color: "#a78bfa", fontFamily: css.sans }}>
                          <CircleCheck className="size-3.5" /> Delivered
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ADD ORDER MODAL ─── */}
      {showAddOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowAddOrder(false)}>
          <div className="w-full max-w-2xl rounded-2xl flex flex-col shadow-2xl max-h-[90vh]"
            style={{ background: css.card, border: `1px solid ${css.border}` }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${css.border}` }}>
              <div>
                <h3 className="font-bold" style={{ fontFamily: css.serif, color: css.fg, fontSize: "1.1rem" }}>Add New Order</h3>
                <p className="text-xs mt-0.5" style={{ color: css.sub, fontFamily: css.sans }}>Select table, enter customer name, add items</p>
              </div>
              <button onClick={() => setShowAddOrder(false)} className="p-1.5 rounded-lg" style={{ color: css.sub }}>
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Left: Config */}
              <div className="p-5 flex flex-col gap-4 lg:w-56 shrink-0" style={{ borderRight: `1px solid ${css.border}` }}>
                {/* Table select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: css.fg, fontFamily: css.sans }}>Table</label>
                  <div className="flex flex-col gap-1.5">
                    {[...myTables, ...availableTables.filter(t => !myTables.find(m => m.id === t.id))].map(t => (
                      <button key={t.id} onClick={() => setOrderTable(t)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition"
                        style={orderTable?.id === t.id
                          ? { background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)", border: "1.5px solid color-mix(in srgb, var(--primary) 40%, transparent)", fontFamily: css.sans }
                          : { background: css.muted, color: css.sub, border: `1px solid ${css.border}`, fontFamily: css.sans }}>
                        <span className="font-bold" style={{ fontFamily: css.mono }}>T{t.number}</span>
                        <span className="truncate">{t.location}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: css.fg, fontFamily: css.sans }}>Customer Name</label>
                  <input value={orderCustomer} onChange={e => setOrderCustomer(e.target.value)}
                    placeholder="Guest / name…"
                    className="px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: css.muted, border: `1px solid ${css.border}`, color: css.fg, fontFamily: css.sans }}
                    onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                    onBlur={e => (e.target.style.borderColor = css.border)} />
                </div>

                {/* Cart summary */}
                {orderItems.length > 0 && (
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl" style={{ background: css.secondary, border: `1px solid ${css.border}` }}>
                    <p className="text-[10px] uppercase font-bold" style={{ color: css.sub, fontFamily: css.mono }}>Cart</p>
                    {orderItems.map(({ item, qty }) => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <span className="text-xs truncate" style={{ color: css.fg, fontFamily: css.sans }}>{item.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => adjustQty(item.id, -1)}
                            className="size-5 rounded flex items-center justify-center" style={{ background: css.muted, color: css.sub }}>
                            <Minus className="size-2.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold" style={{ color: css.fg, fontFamily: css.mono }}>{qty}</span>
                          <button onClick={() => adjustQty(item.id, 1)}
                            className="size-5 rounded flex items-center justify-center" style={{ background: css.muted, color: css.sub }}>
                            <Plus className="size-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1 mt-1" style={{ borderTop: `1px solid ${css.border}` }}>
                      <span className="text-xs font-bold" style={{ color: css.sub, fontFamily: css.sans }}>Total</span>
                      <span className="text-xs font-bold" style={{ color: "var(--primary)", fontFamily: css.mono }}>
                        ${orderItems.reduce((s, { item, qty }) => s + item.price * qty, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Menu */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4" style={{ borderBottom: `1px solid ${css.border}` }}>
                  <div className="relative">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: css.sub }} />
                    <input value={menuSearch} onChange={e => setMenuSearch(e.target.value)}
                      placeholder="Search menu…"
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                      style={{ background: css.muted, border: `1px solid ${css.border}`, color: css.fg, fontFamily: css.sans }}
                      onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={e => (e.target.style.borderColor = css.border)} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                  {filteredMenu.map(item => {
                    const inCart = orderItems.find(x => x.item.id === item.id);
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition"
                        style={{ background: inCart ? "color-mix(in srgb, var(--primary) 8%, var(--secondary))" : css.secondary, border: `1px solid ${inCart ? "color-mix(in srgb, var(--primary) 30%, transparent)" : css.border}` }}
                        onClick={() => addItemToOrder(item)}>
                        <img src={item.image} alt={item.name} className="size-12 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: css.fg, fontFamily: css.sans }}>{item.name}</p>
                          <p className="text-xs" style={{ color: css.sub, fontFamily: css.sans }}>{item.category}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold" style={{ color: "var(--primary)", fontFamily: css.mono }}>${item.price.toFixed(2)}</span>
                          {inCart ? (
                            <span className="size-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: css.mono }}>
                              {inCart.qty}
                            </span>
                          ) : (
                            <div className="size-6 rounded-full flex items-center justify-center"
                              style={{ background: css.muted, color: css.sub }}>
                              <Plus className="size-3.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${css.border}` }}>
              <div>
                {!orderTable && <p className="text-xs text-red-400 flex items-center gap-1" style={{ fontFamily: css.sans }}><AlertCircle className="size-3.5" /> Select a table first</p>}
                {orderItems.length === 0 && <p className="text-xs" style={{ color: css.sub, fontFamily: css.sans }}>Add at least one item</p>}
              </div>
              <button
                disabled={!orderTable || orderItems.length === 0}
                onClick={handleSubmitOrder}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition"
                style={(!orderTable || orderItems.length === 0)
                  ? { background: css.muted, color: css.sub, fontFamily: css.sans, cursor: "not-allowed" }
                  : { background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: css.sans, boxShadow: "0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent)" }}>
                <ClipboardList className="size-4" /> Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
