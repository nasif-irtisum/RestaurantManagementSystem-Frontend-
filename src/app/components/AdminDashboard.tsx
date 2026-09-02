import React, { useState, useId } from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  LayoutGrid,
  ClipboardList,
  BarChart3,
  Plus,
  Check,
  X,
  Download,
  CalendarDays,
  ChefHat,
  User,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  Clock,
  ShieldCheck,
  AlertCircle,
  Pencil,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminSection = "overview" | "staff" | "customers" | "tables" | "menu" | "reports";

interface Employee {
  id: string;
  name: string;
  role: "Waiter" | "Chef";
  email: string;
  phone: string;
  clockedIn: boolean;
  lastClockIn?: string;
  lastClockOut?: string;
}

interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  role: "Customer" | "Waiter" | "Chef";
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

interface Table {
  id: string;
  number: number;
  capacity: number;
  location: string;
  status: "Available" | "Occupied" | "Reserved";
  assignedWaiterName?: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  prepTimeMinutes: number;
  image: string;
  approved: boolean;
}

interface Order {
  id: string;
  grandTotal: number;
  status: string;
  isPaid?: boolean;
}

interface Props {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  customers: CustomerAccount[];
  setCustomers: React.Dispatch<React.SetStateAction<CustomerAccount[]>>;
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  menu: MenuItem[];
  setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  orders: Order[];
  currentUser: { name: string; email: string; role: string };
  onLogout: () => void;
}

// ─── Sidebar Nav Items ─────────────────────────────────────────────────────────

const NAV_ITEMS: { id: AdminSection; label: string; Icon: React.ElementType }[] = [
  { id: "overview",   label: "Overview",           Icon: LayoutDashboard },
  { id: "staff",      label: "Staff Management",   Icon: Users },
  { id: "customers",  label: "Account Approvals",  Icon: UserCheck },
  { id: "tables",     label: "Table Setup",         Icon: LayoutGrid },
  { id: "menu",       label: "Menu Approvals",      Icon: ClipboardList },
  { id: "reports",    label: "Financial Reports",   Icon: BarChart3 },
];

// ─── Revenue chart data ────────────────────────────────────────────────────────

const WEEKLY_DATA = [
  { day: "Mon", revenue: 420,  profit: 273 },
  { day: "Tue", revenue: 580,  profit: 377 },
  { day: "Wed", revenue: 750,  profit: 487 },
  { day: "Thu", revenue: 610,  profit: 396 },
  { day: "Fri", revenue: 1100, profit: 715 },
  { day: "Sat", revenue: 1450, profit: 943 },
  { day: "Sun", revenue: 1280, profit: 832 },
];

const MONTHLY_DATA = [
  { day: "Week 1", revenue: 4200, profit: 2730 },
  { day: "Week 2", revenue: 5100, profit: 3315 },
  { day: "Week 3", revenue: 6800, profit: 4420 },
  { day: "Week 4", revenue: 7200, profit: 4680 },
];

// ─── Shared style helpers using CSS vars ───────────────────────────────────────

const css = {
  sidebar:     "var(--sidebar)",
  sidebarBdr:  "var(--sidebar-border)",
  sidebarFg:   "var(--sidebar-foreground)",
  sidebarAcct: "var(--sidebar-accent)",
  sidebarPrim: "var(--sidebar-primary)",
  bg:          "var(--background)",
  card:        "var(--card)",
  muted:       "var(--muted)",
  border:      "var(--border)",
  fg:          "var(--foreground)",
  fgMuted:     "var(--muted-foreground)",
  primary:     "var(--primary)",
  primaryFg:   "var(--primary-foreground)",
  accent:      "var(--accent)",
  secondary:   "var(--secondary)",
  destructive: "var(--destructive)",
};

// ─── Reusable sub-components ───────────────────────────────────────────────────

function SectionHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 style={{ fontFamily: "var(--font-serif)", color: css.fg, fontSize: "1.35rem", fontWeight: 700 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ color: css.fgMuted, fontSize: "0.8125rem", marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function PrimaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
      style={{ background: css.primary, color: css.primaryFg }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, sub, subPositive, Icon, iconColor, iconBg }: {
  label: string;
  value: string;
  sub?: string;
  subPositive?: boolean;
  Icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div
      className="p-5 rounded-2xl flex items-center justify-between gap-4"
      style={{ background: css.card, border: `1px solid ${css.border}` }}
    >
      <div>
        <p style={{ color: css.fgMuted, fontSize: "0.75rem", fontWeight: 500 }}>{label}</p>
        <p style={{ color: css.fg, fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700, marginTop: 4 }}>
          {value}
        </p>
        {sub && (
          <p style={{ color: subPositive ? "#10b981" : "#ef4444", fontSize: "0.7rem", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
            {subPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {sub}
          </p>
        )}
      </div>
      <div className="p-3 rounded-xl shrink-0" style={{ background: iconBg, color: iconColor }}>
        <Icon className="size-6" />
      </div>
    </div>
  );
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5 relative shadow-2xl"
        style={{ background: css.card, border: `1px solid ${css.border}` }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
          style={{ color: css.fgMuted }}
        >
          <X className="size-4" />
        </button>
        <h3 style={{ fontFamily: "var(--font-serif)", color: css.fg, fontSize: "1.1rem", fontWeight: 700 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label style={{ color: css.fg, fontSize: "0.8125rem", fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  borderRadius: "0.625rem",
  background: "var(--input-background)",
  border: `1px solid var(--border)`,
  color: "var(--foreground)",
  fontSize: "0.875rem",
  outline: "none",
  fontFamily: "var(--font-sans)"
};

// ─── Section: Overview ─────────────────────────────────────────────────────────

function OverviewSection({ employees, customers, tables, menu, orders }: {
  employees: Employee[];
  customers: CustomerAccount[];
  tables: Table[];
  menu: MenuItem[];
  orders: Order[];
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `ovGrad-${uid}`;
  const totalRevenue = orders.reduce((s, o) => s + (o.isPaid || o.status === "Paid" ? o.grandTotal : 0), 2450);
  const activeStaff  = employees.filter(e => e.clockedIn).length;
  const occupied     = tables.filter(t => t.status === "Occupied").length;
  const pending      = customers.filter(c => c.status === "Pending").length + menu.filter(m => !m.approved).length;

  return (
    <div className="space-y-7">
      <div>
        <h2 style={{ fontFamily: "var(--font-serif)", color: css.fg, fontSize: "1.5rem", fontWeight: 700 }}>
          Good morning, Administrator
        </h2>
        <p style={{ color: css.fgMuted, fontSize: "0.8125rem", marginTop: 2 }}>
          Here's what's happening at Foodখোর Club today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} sub="+14.2% from last week" subPositive Icon={DollarSign} iconColor="var(--primary)" iconBg="color-mix(in srgb, var(--primary) 12%, transparent)" />
        <StatCard label="Active Staff" value={`${activeStaff} / ${employees.length}`} sub="Clocked in today" subPositive Icon={Users} iconColor="#60a5fa" iconBg="rgba(96,165,250,0.12)" />
        <StatCard label="Tables Occupied" value={`${occupied} / ${tables.length}`} sub="Live occupancy" subPositive Icon={Layers} iconColor="#34d399" iconBg="rgba(52,211,153,0.12)" />
        <StatCard label="Pending Approvals" value={`${pending}`} sub={pending > 0 ? "Action required" : "All clear"} subPositive={pending === 0} Icon={AlertCircle} iconColor="#c084fc" iconBg="rgba(192,132,252,0.12)" />
      </div>

      <div className="rounded-2xl p-6 space-y-4" style={{ background: css.card, border: `1px solid ${css.border}` }}>
        <p style={{ color: css.fg, fontWeight: 600, fontSize: "0.9375rem", fontFamily: "var(--font-serif)" }}>Revenue This Week</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={WEEKLY_DATA}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--foreground)", fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill={`url(#${gradId})`} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: css.card, border: `1px solid ${css.border}` }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: css.border }}>
          <p style={{ color: css.fg, fontWeight: 600, fontSize: "0.875rem" }}>Recent Orders</p>
        </div>
        <div className="divide-y" style={{ borderColor: css.border }}>
          {orders.slice(0, 5).map(o => (
            <div key={o.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p style={{ color: css.fg, fontSize: "0.8125rem", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{o.id}</p>
                <p style={{ color: css.fgMuted, fontSize: "0.7rem" }}>{o.status}</p>
              </div>
              <span style={{ color: css.primary, fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 700 }}>
                ${o.grandTotal?.toFixed(2) ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Staff Management ─────────────────────────────────────────────────

function StaffSection({ employees, setEmployees }: {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Waiter" as "Waiter" | "Chef", accessLevel: "Standard" });

  const handleAdd = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const emp: Employee = {
      id: `e-${Date.now()}`,
      name: form.name,
      email: form.email,
      role: form.role,
      phone: "",
      clockedIn: false
    };
    setEmployees(prev => [emp, ...prev]);
    setShowModal(false);
    setForm({ name: "", email: "", role: "Waiter", accessLevel: "Standard" });
    toast.success(`${emp.name} added to the team.`);
  };

  const statusPill = (clocked: boolean) => (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: clocked ? "rgba(52,211,153,0.12)" : "rgba(156,163,175,0.12)",
        color: clocked ? "#34d399" : "var(--muted-foreground)"
      }}
    >
      {clocked ? "Clocked In" : "Clocked Out"}
    </span>
  );

  return (
    <div>
      <SectionHeader
        title="Staff Management"
        subtitle="Manage your team, roles, and shift status."
        action={
          <PrimaryBtn onClick={() => setShowModal(true)}>
            <Plus className="size-4" /> Add Employee
          </PrimaryBtn>
        }
      />

      <div className="rounded-2xl overflow-hidden" style={{ background: css.card, border: `1px solid ${css.border}` }}>
        {/* Table header */}
        <div
          className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1fr", color: css.fgMuted, background: css.muted, borderBottom: `1px solid ${css.border}` }}
        >
          <span>Name</span>
          <span>Role</span>
          <span>Last Shift</span>
          <span>Status</span>
        </div>

        {employees.map((emp, i) => (
          <div
            key={emp.id}
            className="grid px-5 py-4 items-center transition-colors hover:bg-white/[0.02]"
            style={{
              gridTemplateColumns: "2fr 1fr 1.2fr 1fr",
              borderBottom: i < employees.length - 1 ? `1px solid ${css.border}` : "none"
            }}
          >
            {/* Name + email */}
            <div className="flex items-center gap-3">
              <div
                className="size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: emp.role === "Chef" ? "rgba(52,211,153,0.15)" : "rgba(96,165,250,0.15)", color: emp.role === "Chef" ? "#34d399" : "#60a5fa" }}
              >
                {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p style={{ color: css.fg, fontSize: "0.875rem", fontWeight: 600 }}>{emp.name}</p>
                <p style={{ color: css.fgMuted, fontSize: "0.7rem" }}>{emp.email}</p>
              </div>
            </div>

            {/* Role badge */}
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold w-fit flex items-center gap-1"
              style={{
                background: emp.role === "Chef" ? "rgba(52,211,153,0.12)" : "rgba(96,165,250,0.12)",
                color: emp.role === "Chef" ? "#34d399" : "#60a5fa"
              }}
            >
              {emp.role === "Chef" ? <ChefHat className="size-3" /> : <User className="size-3" />}
              {emp.role}
            </span>

            {/* Shift */}
            <p style={{ color: css.fgMuted, fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
              {emp.clockedIn ? `Since ${emp.lastClockIn ?? "—"}` : emp.lastClockOut ? `Out ${emp.lastClockOut}` : "No record"}
            </p>

            {/* Status */}
            {statusPill(emp.clockedIn)}
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <Modal title="Add New Employee" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <FormField label="Full Name">
              <input
                style={inputStyle}
                placeholder="e.g. Marco Vance"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </FormField>
            <FormField label="Email Address">
              <input
                style={inputStyle}
                type="email"
                placeholder="employee@foodkhorclub.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </FormField>
            <FormField label="Role">
              <select
                style={inputStyle}
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value as "Waiter" | "Chef" }))}
              >
                <option value="Waiter">Waiter / Server</option>
                <option value="Chef">Kitchen Chef</option>
              </select>
            </FormField>
            <FormField label="Access Level">
              <select
                style={inputStyle}
                value={form.accessLevel}
                onChange={e => setForm(p => ({ ...p, accessLevel: e.target.value }))}
              >
                <option value="Standard">Standard</option>
                <option value="Senior">Senior</option>
                <option value="Manager">Manager</option>
              </select>
            </FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: css.secondary, color: css.fgMuted, border: `1px solid ${css.border}` }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: css.primary, color: css.primaryFg }}
            >
              Add Employee
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Section: Account Approvals ────────────────────────────────────────────────

const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
  Customer: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  Waiter:   { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa" },
  Chef:     { bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
};

function CustomerSection({ customers, setCustomers, employees, setEmployees }: {
  customers: CustomerAccount[];
  setCustomers: React.Dispatch<React.SetStateAction<CustomerAccount[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}) {
  const handleApprove = (id: string, name: string) => {
    const account = customers.find(c => c.id === id);
    if (!account) return;

    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: "Approved" } : c));

    // For staff roles, create an Employee record so they can clock in/out and be tracked
    if (account.role === "Waiter" || account.role === "Chef") {
      const alreadyExists = employees.some(e => e.email === account.email);
      if (!alreadyExists) {
        const newEmp: Employee = {
          id: `e-${Date.now()}`,
          name: account.name,
          role: account.role,
          email: account.email,
          phone: "",
          clockedIn: false,
        };
        setEmployees(prev => [...prev, newEmp]);
      }
      toast.success(`${name}'s ${account.role} account approved — employee record created.`);
    } else {
      toast.success(`${name}'s account approved.`);
    }
  };

  const handleReject = (id: string, name: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: "Rejected" } : c));
    toast.error(`${name}'s application rejected.`);
  };

  const statusBadge = (s: CustomerAccount["status"]) => {
    const styles: Record<CustomerAccount["status"], { bg: string; color: string }> = {
      Pending:  { bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
      Approved: { bg: "rgba(52,211,153,0.12)", color: "#34d399" },
      Rejected: { bg: "rgba(239,68,68,0.12)",  color: "#f87171" },
    };
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ ...styles[s], fontFamily: "var(--font-mono)" }}>
        {s}
      </span>
    );
  };

  const roleBadge = (role: CustomerAccount["role"]) => {
    const { bg, color } = ROLE_COLOR[role] ?? { bg: css.muted, color: css.fgMuted };
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: bg, color, fontFamily: "var(--font-mono)" }}>
        {role}
      </span>
    );
  };

  const pending = customers.filter(c => c.status === "Pending");
  const rest    = customers.filter(c => c.status !== "Pending");
  const staffPending = pending.filter(c => c.role !== "Customer");

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Account Approvals"
        subtitle={`${pending.length} pending application${pending.length !== 1 ? "s" : ""} awaiting review.`}
      />

      {/* Info callout explaining the policy */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: "color-mix(in srgb, var(--primary) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 18%, transparent)" }}>
        <div className="size-5 shrink-0 mt-0.5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: "color-mix(in srgb, var(--primary) 18%, transparent)", color: "var(--primary)" }}>i</div>
        <p style={{ color: css.fgMuted, fontSize: "0.8125rem", fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
          <span style={{ color: css.fg, fontWeight: 600 }}>Customers</span> are auto-approved and sign in immediately. &nbsp;
          <span style={{ color: css.fg, fontWeight: 600 }}>Waiter & Chef</span> applications require your approval before they can access the system. Approving a staff account automatically creates their employee record.
        </p>
      </div>

      {/* Pending staff highlight */}
      {staffPending.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <div className="size-2 rounded-full animate-pulse" style={{ background: "#fbbf24" }} />
          <p style={{ color: "#fbbf24", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "var(--font-sans)" }}>
            {staffPending.length} staff application{staffPending.length > 1 ? "s" : ""} need your review
          </p>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: css.card, border: `1px solid ${css.border}` }}>
        {/* Table header */}
        <div
          className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1.6fr", color: css.fgMuted, background: css.muted, borderBottom: `1px solid ${css.border}`, fontFamily: "var(--font-mono)" }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Applied</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {[...pending, ...rest].length === 0 && (
          <div className="py-16 text-center" style={{ color: css.fgMuted, fontFamily: "var(--font-sans)" }}>
            No account applications yet.
          </div>
        )}

        {[...pending, ...rest].map((c, i) => (
          <div
            key={c.id}
            className="grid px-5 py-4 items-center transition-colors hover:bg-white/[0.02]"
            style={{
              gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1.6fr",
              borderBottom: i < customers.length - 1 ? `1px solid ${css.border}` : "none",
              background: c.status === "Pending" && c.role !== "Customer"
                ? "color-mix(in srgb, rgba(251,191,36,0.04), transparent)"
                : "transparent",
            }}
          >
            <p style={{ color: css.fg, fontSize: "0.875rem", fontWeight: 600, fontFamily: "var(--font-sans)" }}>{c.name}</p>
            <p style={{ color: css.fgMuted, fontSize: "0.8125rem", fontFamily: "var(--font-sans)" }}>{c.email}</p>
            {roleBadge(c.role ?? "Customer")}
            <p style={{ color: css.fgMuted, fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>{c.createdAt}</p>
            {statusBadge(c.status)}
            <div className="flex gap-2 justify-end">
              {c.status === "Pending" && (
                <>
                  <button
                    onClick={() => handleApprove(c.id, c.name)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", fontFamily: "var(--font-sans)" }}
                  >
                    <Check className="size-3" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(c.id, c.name)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", fontFamily: "var(--font-sans)" }}
                  >
                    <X className="size-3" /> Reject
                  </button>
                </>
              )}
              {c.status !== "Pending" && (
                <span style={{ color: css.fgMuted, fontSize: "0.75rem", fontFamily: "var(--font-sans)" }}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Table Setup ──────────────────────────────────────────────────────

function TableSection({ tables, setTables }: {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ number: "", capacity: "4", location: "Main Dining Floor", status: "Available" as Table["status"] });

  const handleAdd = () => {
    if (!form.number.trim()) { toast.error("Table number is required"); return; }
    const t: Table = {
      id: `t-${Date.now()}`,
      number: parseInt(form.number),
      capacity: parseInt(form.capacity),
      location: form.location,
      status: form.status
    };
    setTables(prev => [...prev, t]);
    setShowModal(false);
    setForm({ number: "", capacity: "4", location: "Main Dining Floor", status: "Available" });
    toast.success(`Table ${t.number} added.`);
  };

  const statusStyle: Record<Table["status"], { bg: string; color: string; dot: string }> = {
    Available: { bg: "rgba(52,211,153,0.12)",  color: "#34d399", dot: "#34d399" },
    Occupied:  { bg: "rgba(239,68,68,0.12)",   color: "#f87171", dot: "#f87171" },
    Reserved:  { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", dot: "#fbbf24" },
  };

  return (
    <div>
      <SectionHeader
        title="Table Setup"
        subtitle="View and manage your dining floor layout."
        action={<PrimaryBtn onClick={() => setShowModal(true)}><Plus className="size-4" /> Add Table</PrimaryBtn>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map(t => {
          const s = statusStyle[t.status];
          return (
            <div
              key={t.id}
              className="rounded-2xl p-4 flex flex-col gap-2 transition-all hover:scale-[1.02]"
              style={{ background: css.card, border: `1px solid ${css.border}` }}
            >
              {/* Table number */}
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "var(--font-mono)", color: css.primary, fontSize: "0.75rem", fontWeight: 700 }}>
                  T-{t.number.toString().padStart(2, "0")}
                </span>
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: s.bg, color: s.color }}
                >
                  <span className="size-1.5 rounded-full inline-block" style={{ background: s.dot }} />
                  {t.status}
                </span>
              </div>

              {/* Visual table icon */}
              <div
                className="w-full aspect-square rounded-xl flex items-center justify-center"
                style={{ background: css.muted }}
              >
                <LayoutGrid className="size-8" style={{ color: s.color, opacity: 0.7 }} />
              </div>

              <div>
                <p style={{ color: css.fg, fontSize: "0.8125rem", fontWeight: 600 }}>
                  {t.capacity} Seats
                </p>
                <p style={{ color: css.fgMuted, fontSize: "0.7rem" }}>{t.location}</p>
              </div>

              {t.assignedWaiterName && (
                <p style={{ color: css.fgMuted, fontSize: "0.7rem", fontStyle: "italic" }}>
                  Waiter: {t.assignedWaiterName}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Add New Table" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <FormField label="Table Number">
              <input style={inputStyle} type="number" placeholder="e.g. 7" value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} />
            </FormField>
            <FormField label="Capacity (Seats)">
              <select style={inputStyle} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}>
                {[2,4,6,8,10,12].map(n => <option key={n} value={n}>{n} seats</option>)}
              </select>
            </FormField>
            <FormField label="Location / Section">
              <input style={inputStyle} placeholder="e.g. VIP Garden Terrace" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </FormField>
            <FormField label="Initial Status">
              <select style={inputStyle} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Table["status"] }))}>
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Occupied">Occupied</option>
              </select>
            </FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: css.secondary, color: css.fgMuted, border: `1px solid ${css.border}` }}>
              Cancel
            </button>
            <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: css.primary, color: css.primaryFg }}>
              Add Table
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Section: Menu Approvals ───────────────────────────────────────────────────

function MenuSection({ menu, setMenu }: {
  menu: MenuItem[];
  setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>;
}) {
  const pending = menu.filter(m => !m.approved);
  const approved = menu.filter(m => m.approved);

  const approve = (id: string, name: string) => {
    setMenu(prev => prev.map(m => m.id === id ? { ...m, approved: true } : m));
    toast.success(`"${name}" approved and published.`);
  };
  const requestEdit = (name: string) => {
    toast.info(`Edit request sent for "${name}".`);
  };

  const all = [...pending, ...approved];

  return (
    <div>
      <SectionHeader
        title="Menu Approvals"
        subtitle={`${pending.length} item${pending.length !== 1 ? "s" : ""} pending approval.`}
      />

      {all.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16" style={{ color: css.fgMuted }}>
          <ClipboardList className="size-10 mb-3 opacity-30" />
          <p>No menu items to review.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {all.map(item => (
          <div
            key={item.id}
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: css.card,
              border: `1px solid ${item.approved ? css.border : "color-mix(in srgb, var(--primary) 30%, transparent)"}`
            }}
          >
            {/* Dish image */}
            <div className="relative h-40 overflow-hidden">
              <img src={item.image} alt={item.name} className="size-full object-cover" />
              {!item.approved && (
                <div className="absolute inset-0 flex items-end" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                  <span className="m-3 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                    Awaiting Approval
                  </span>
                </div>
              )}
              {item.approved && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1" style={{ background: "rgba(52,211,153,0.9)", color: "#fff" }}>
                  <Check className="size-3" /> Approved
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p style={{ color: css.fg, fontWeight: 700, fontSize: "0.9rem" }}>{item.name}</p>
                  <p style={{ color: css.fgMuted, fontSize: "0.7rem" }}>{item.category}</p>
                </div>
                <span style={{ color: css.primary, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.9375rem", whiteSpace: "nowrap" }}>
                  ${item.price.toFixed(2)}
                </span>
              </div>

              <p style={{ color: css.fgMuted, fontSize: "0.75rem", lineHeight: 1.5 }} className="line-clamp-2">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {[item.category, `${item.prepTimeMinutes}min prep`].map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: css.muted, color: css.fgMuted }}>
                    {tag}
                  </span>
                ))}
              </div>

              {!item.approved && (
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => approve(item.id, item.name)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-opacity hover:opacity-90"
                    style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
                  >
                    <Check className="size-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => requestEdit(item.name)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-opacity hover:opacity-90"
                    style={{ background: css.muted, color: css.fgMuted, border: `1px solid ${css.border}` }}
                  >
                    <Pencil className="size-3.5" /> Request Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Financial Reports ────────────────────────────────────────────────

function ReportsSection({ orders }: { orders: Order[] }) {
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [range, setRange] = useState<"week" | "month">("week");

  const totalRevenue = orders.reduce((s, o) => s + (o.isPaid || o.status === "Paid" ? o.grandTotal : 0), 2450);
  const avgOrderVal  = totalRevenue / Math.max(orders.length, 1);
  const netProfit    = totalRevenue * 0.65;

  const chartData = range === "week" ? WEEKLY_DATA : MONTHLY_DATA;

  const handleExport = (type: "PDF" | "CSV") => {
    if (type === "CSV") {
      const rows = ["Day,Revenue,Profit", ...chartData.map(d => `${d.day},${d.revenue},${d.profit}`)].join("\n");
      const el = document.createElement("a");
      el.href = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
      el.download = "foodkhorclub_financial_report.csv";
      el.click();
    }
    toast.success(`${type} report exported.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Financial Reports" subtitle="Analyse revenue, profitability, and trends." />

      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 rounded-2xl"
        style={{ background: css.card, border: `1px solid ${css.border}` }}
      >
        <CalendarDays className="size-4 shrink-0" style={{ color: css.fgMuted }} />
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ ...inputStyle, width: "auto", padding: "0.4rem 0.75rem" }}
          />
          <span style={{ color: css.fgMuted, fontSize: "0.8125rem" }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ ...inputStyle, width: "auto", padding: "0.4rem 0.75rem" }}
          />
        </div>

        <div className="flex items-center gap-1 ml-auto p-1 rounded-xl" style={{ background: css.muted }}>
          {(["week", "month"] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
              style={range === r ? { background: css.primary, color: css.primaryFg } : { color: css.fgMuted }}
            >
              {r === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport("PDF")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: css.muted, color: css.fgMuted, border: `1px solid ${css.border}` }}
          >
            <Download className="size-3.5" /> Export PDF
          </button>
          <button
            onClick={() => handleExport("CSV")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: css.muted, color: css.fgMuted, border: `1px solid ${css.border}` }}
          >
            <Download className="size-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} sub="+14.2% vs last period" subPositive Icon={DollarSign} iconColor="var(--primary)" iconBg="color-mix(in srgb, var(--primary) 12%, transparent)" />
        <StatCard label="Avg Order Value" value={`$${avgOrderVal.toFixed(2)}`} sub="+3.8% vs last period" subPositive Icon={TrendingUp} iconColor="#60a5fa" iconBg="rgba(96,165,250,0.12)" />
        <StatCard label="Net Profit (65%)" value={`$${netProfit.toFixed(2)}`} sub="+11.4% vs last period" subPositive Icon={BarChart3} iconColor="#34d399" iconBg="rgba(52,211,153,0.12)" />
      </div>

      {/* Revenue Line Chart */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: css.card, border: `1px solid ${css.border}` }}>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontFamily: "var(--font-serif)", color: css.fg, fontWeight: 700, fontSize: "1rem" }}>
              Revenue & Profit — {range === "week" ? "This Week" : "This Month"}
            </p>
            <p style={{ color: css.fgMuted, fontSize: "0.75rem" }}>Gross revenue vs net profit comparison</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5" style={{ color: css.fgMuted }}>
              <span className="size-2.5 rounded-full inline-block" style={{ background: "var(--primary)" }} />
              Revenue
            </span>
            <span className="flex items-center gap-1.5" style={{ color: css.fgMuted }}>
              <span className="size-2.5 rounded-full inline-block" style={{ background: "#34d399" }} />
              Profit
            </span>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--foreground)", fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="var(--primary)"  strokeWidth={2.5} dot={{ fill: "var(--primary)", r: 3 }}  activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="profit"  stroke="#34d399" strokeWidth={2.5} dot={{ fill: "#34d399",  r: 3 }}  activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminDashboard ───────────────────────────────────────────────────────

export function AdminDashboard({ employees, setEmployees, customers, setCustomers, tables, setTables, menu, setMenu, orders, currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");

  const initials = currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>

      {/* ── SIDEBAR ── */}
      <aside
        className="flex flex-col shrink-0 overflow-y-auto"
        style={{ width: 240, background: css.sidebar, borderRight: `1px solid ${css.sidebarBdr}` }}
      >
        {/* Logo mark */}
        <div className="px-5 py-5 border-b" style={{ borderColor: css.sidebarBdr }}>
          <div className="flex items-center gap-2.5">
            <div
              className="size-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--primary))", color: "var(--primary-foreground)" }}
            >
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-serif)", color: css.sidebarFg, fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>
                Admin Panel
              </p>
              <p style={{ fontFamily: "var(--font-mono)", color: css.sidebarPrim, fontSize: "0.625rem", opacity: 0.8 }}>
                Foodখোর Club
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? css.sidebarAcct : "transparent",
                  color: active ? css.sidebarPrim : css.sidebarFg,
                  opacity: active ? 1 : 0.7
                }}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {active && <ChevronRight className="size-3.5 opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="px-3 py-4 border-t" style={{ borderColor: css.sidebarBdr }}>
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "color-mix(in srgb, var(--primary) 20%, transparent)", color: css.sidebarPrim }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: css.sidebarFg, fontSize: "0.8125rem", fontWeight: 600 }} className="truncate">
                {currentUser.name}
              </p>
              <p style={{ color: css.sidebarPrim, fontSize: "0.625rem", fontFamily: "var(--font-mono)", opacity: 0.8 }}>
                Administrator
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ background: css.bg }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          {activeSection === "overview"  && <OverviewSection employees={employees} customers={customers} tables={tables} menu={menu} orders={orders} />}
          {activeSection === "staff"     && <StaffSection employees={employees} setEmployees={setEmployees} />}
          {activeSection === "customers" && <CustomerSection customers={customers} setCustomers={setCustomers} employees={employees} setEmployees={setEmployees} />}
          {activeSection === "tables"    && <TableSection tables={tables} setTables={setTables} />}
          {activeSection === "menu"      && <MenuSection menu={menu} setMenu={setMenu} />}
          {activeSection === "reports"   && <ReportsSection orders={orders} />}
        </div>
      </main>
    </div>
  );
}
