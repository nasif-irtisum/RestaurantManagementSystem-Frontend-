import React, { useState, useEffect, useMemo } from "react";
import {
  ChefHat, Clock, LogIn, LogOut, CheckCircle2, Plus, X,
  BookOpen, Timer, Flame, CircleCheck, Loader2, Lock,
  Utensils, ClipboardList, Trash2, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

type Role = "Admin" | "Waiter" | "Chef" | "Customer" | "Guest";
type OrderStatus = "Placed" | "In Kitchen" | "Ready" | "Served" | "Paid";

interface MenuItem { id: string; name: string; category: string; price: number; description: string; prepTimeMinutes: number; image: string; approved: boolean; }
interface Recipe { id: string; menuItemId: string; menuItemName: string; prepTimeMinutes: number; instructions: string; ingredients: string[]; }
interface OrderItem { id: string; menuItemId: string; name: string; price: number; quantity: number; customDetails?: string; }
interface Order {
  id: string; customerName: string; tableNumber: number | string;
  items: OrderItem[]; status: OrderStatus;
  totalAmount: number; taxAmount: number; grandTotal: number;
  createdAt: Date; prepStartTime?: Date; prepTimeMinutes: number;
  waiterId?: string; waiterName?: string; isPaid?: boolean;
}
interface Employee { id: string; name: string; role: "Waiter" | "Chef"; email: string; phone: string; clockedIn: boolean; lastClockIn?: string; lastClockOut?: string; }

interface ChefDashboardProps {
  currentUser: { name: string; email: string; role: Role };
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  menu: MenuItem[];
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function secondsRemaining(order: Order, now: number): number {
  if (!order.prepStartTime) return order.prepTimeMinutes * 60;
  const elapsed = Math.floor((now - new Date(order.prepStartTime).getTime()) / 1000);
  return Math.max(0, order.prepTimeMinutes * 60 - elapsed);
}

function fmtCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function progressPct(order: Order, now: number): number {
  if (!order.prepStartTime) return 0;
  const total = order.prepTimeMinutes * 60 * 1000;
  const elapsed = now - new Date(order.prepStartTime).getTime();
  return Math.min(100, Math.round((elapsed / total) * 100));
}

// ── component ─────────────────────────────────────────────────────────────────

export function ChefDashboard({
  currentUser, employees, setEmployees,
  orders, setOrders, menu, recipes, setRecipes
}: ChefDashboardProps) {

  // Live clock for countdown timers — refreshes every second
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Tab state
  const [activeTab, setActiveTab] = useState<"kitchen" | "recipes">("kitchen");

  // Recipe modal state
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [recipeMenuItem, setRecipeMenuItem] = useState<MenuItem | null>(null);
  const [recipePrepTime, setRecipePrepTime] = useState(20);
  const [recipeInstructions, setRecipeInstructions] = useState("");
  const [ingredientInput, setIngredientInput] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState<string[]>([]);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  // Find this chef's employee record
  const chef = useMemo(
    () => employees.find(e => e.name === currentUser.name && e.role === "Chef") || employees.find(e => e.role === "Chef"),
    [employees, currentUser.name]
  );

  // Kitchen orders: only "In Kitchen" and "Ready" — but "In Kitchen" orders are
  // only shown AFTER their prepStartTime has been set (i.e. sent to kitchen).
  // The "Mark Ready" action is locked until full prep time has elapsed.
  const kitchenOrders = useMemo(
    () => orders
      .filter(o => o.status === "In Kitchen" || o.status === "Ready")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders]
  );

  const completedToday = useMemo(
    () => orders.filter(o => o.status === "Ready" || o.status === "Served" || o.status === "Paid").length,
    [orders]
  );

  const menuItemsWithoutRecipe = useMemo(
    () => menu.filter(m => m.approved && !recipes.find(r => r.menuItemId === m.id)),
    [menu, recipes]
  );

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleClockToggle = () => {
    if (!chef) return;
    const next = !chef.clockedIn;
    setEmployees(prev => prev.map(e => e.id === chef.id ? {
      ...e, clockedIn: next,
      lastClockIn: next ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : e.lastClockIn,
      lastClockOut: !next ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : e.lastClockOut,
    } : e));
    toast.success(next ? "Clocked IN — fire up the kitchen!" : "Clocked OUT — great shift!");
  };

  const handleMarkReady = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Ready" } : o));
    toast.success("Order marked as Ready — waiter notified!");
  };

  const handleAddIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (!trimmed || recipeIngredients.includes(trimmed)) return;
    setRecipeIngredients(prev => [...prev, trimmed]);
    setIngredientInput("");
  };

  const handleSaveRecipe = () => {
    if (!recipeMenuItem || !recipeInstructions.trim() || recipeIngredients.length === 0) return;
    const newRecipe: Recipe = {
      id: `r-${Date.now()}`,
      menuItemId: recipeMenuItem.id,
      menuItemName: recipeMenuItem.name,
      prepTimeMinutes: recipePrepTime,
      instructions: recipeInstructions.trim(),
      ingredients: recipeIngredients,
    };
    setRecipes(prev => [newRecipe, ...prev]);
    setShowAddRecipe(false);
    setRecipeMenuItem(null);
    setRecipePrepTime(20);
    setRecipeInstructions("");
    setRecipeIngredients([]);
    toast.success(`Recipe for "${newRecipe.menuItemName}" saved!`);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
    toast.info("Recipe removed.");
  };

  // ── css tokens ────────────────────────────────────────────────────────────

  const c = {
    bg: "var(--background)", card: "var(--card)", muted: "var(--muted)",
    border: "var(--border)", fg: "var(--foreground)", sub: "var(--muted-foreground)",
    primary: "var(--primary)", pFg: "var(--primary-foreground)",
    secondary: "var(--secondary)", accent: "var(--accent)",
    sans: "var(--font-sans)", serif: "var(--font-serif)", mono: "var(--font-mono)",
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">

      {/* ── WELCOME HEADER ── */}
      <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: c.card, border: `1px solid ${c.border}` }}>
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in srgb, #34d399 12%, transparent)", color: "#34d399" }}>
            <ChefHat className="size-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: c.mono, color: "#34d399" }}>
              Chef Dashboard
            </p>
            <h2 className="font-bold text-xl" style={{ fontFamily: c.serif, color: c.fg }}>
              {currentUser.name}
            </h2>
            <p className="text-xs mt-0.5" style={{ fontFamily: c.sans, color: c.sub }}>
              {chef?.clockedIn
                ? `On duty since ${chef.lastClockIn || "—"}`
                : `Last clocked out: ${chef?.lastClockOut || "—"}`}
            </p>
          </div>
        </div>

        <button onClick={handleClockToggle}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition shrink-0"
          style={chef?.clockedIn
            ? { background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444", border: "1.5px solid color-mix(in srgb, #ef4444 30%, transparent)", fontFamily: c.sans }
            : { background: c.primary, color: c.pFg, fontFamily: c.sans, boxShadow: "0 4px 20px color-mix(in srgb, var(--primary) 30%, transparent)" }}>
          {chef?.clockedIn ? <LogOut className="size-5" /> : <LogIn className="size-5" />}
          {chef?.clockedIn ? "Clock Out" : "Clock In"}
          <div className="size-2.5 rounded-full" style={{ background: chef?.clockedIn ? "#22c55e" : "#ef4444" }} />
        </button>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "In Kitchen", value: kitchenOrders.filter(o => o.status === "In Kitchen").length, icon: Flame, color: "#fbbf24" },
          { label: "Ready to Serve", value: kitchenOrders.filter(o => o.status === "Ready").length, icon: CheckCircle2, color: "#34d399" },
          { label: "Completed Today", value: completedToday, icon: CircleCheck, color: c.primary },
          { label: "Recipes", value: recipes.length, icon: BookOpen, color: "#a78bfa" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: c.card, border: `1px solid ${c.border}` }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ fontFamily: c.sans, color: c.sub }}>{label}</span>
              <div className="size-7 rounded-lg flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                <Icon className="size-3.5" style={{ color }} />
              </div>
            </div>
            <p className="font-bold text-2xl" style={{ fontFamily: c.mono, color: c.fg }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ background: c.muted, border: `1px solid ${c.border}` }}>
        {([
          { id: "kitchen", label: "Kitchen Queue", icon: Flame },
          { id: "recipes", label: "Recipe Book", icon: BookOpen },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
            style={activeTab === id
              ? { background: c.primary, color: c.pFg, fontFamily: c.sans }
              : { color: c.sub, fontFamily: c.sans }}>
            <Icon className="size-4" />{label}
          </button>
        ))}
      </div>

      {/* ── KITCHEN QUEUE TAB ── */}
      {activeTab === "kitchen" && (
        <div className="flex flex-col gap-4">
          {kitchenOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 rounded-2xl"
              style={{ background: c.card, border: `1px solid ${c.border}` }}>
              <div className="size-16 rounded-2xl flex items-center justify-center"
                style={{ background: c.muted }}>
                <ChefHat className="size-8" style={{ color: c.sub }} />
              </div>
              <div className="text-center">
                <p className="font-semibold" style={{ color: c.fg, fontFamily: c.sans }}>Kitchen is all clear!</p>
                <p className="text-sm mt-1" style={{ color: c.sub, fontFamily: c.sans }}>New orders will appear here when sent to kitchen</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {kitchenOrders.map(order => {
                const secsLeft = secondsRemaining(order, now);
                const pct = progressPct(order, now);
                const isReady = order.status === "Ready";
                const canMark = secsLeft === 0 && order.status === "In Kitchen";
                const recipe = recipes.find(r => order.items.some(i => i.menuItemId === r.menuItemId));

                return (
                  <div key={order.id} className="rounded-2xl p-5 flex flex-col gap-4 transition"
                    style={{
                      background: c.card,
                      border: `1.5px solid ${isReady
                        ? "color-mix(in srgb, #34d399 30%, transparent)"
                        : canMark
                          ? "color-mix(in srgb, var(--primary) 30%, transparent)"
                          : c.border}`
                    }}>

                    {/* Order ID + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold" style={{ color: c.fg, fontFamily: c.sans }}>#{order.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={isReady
                              ? { background: "color-mix(in srgb, #34d399 12%, transparent)", color: "#34d399", fontFamily: c.mono }
                              : { background: "color-mix(in srgb, #fbbf24 12%, transparent)", color: "#fbbf24", fontFamily: c.mono }}>
                            {isReady ? "Ready ✓" : "Cooking"}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: c.sub, fontFamily: c.sans }}>
                          Table {order.tableNumber} · {order.customerName}
                        </p>
                      </div>
                      <span className="text-sm font-bold shrink-0" style={{ color: c.primary, fontFamily: c.mono }}>
                        ${order.grandTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="flex flex-col gap-1 p-3 rounded-xl" style={{ background: c.secondary }}>
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between items-start gap-2 text-xs">
                          <div>
                            <span className="font-semibold" style={{ color: c.fg, fontFamily: c.sans }}>
                              {item.name} ×{item.quantity}
                            </span>
                            {item.customDetails && (
                              <p className="mt-0.5" style={{ color: c.sub, fontFamily: c.sans }}>{item.customDetails}</p>
                            )}
                          </div>
                          <span style={{ color: c.sub, fontFamily: c.mono }}>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Prep timer — only for "In Kitchen" orders */}
                    {!isReady && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5" style={{ color: secsLeft === 0 ? c.primary : c.sub, fontFamily: c.sans }}>
                            {secsLeft === 0
                              ? <><CheckCircle2 className="size-3.5" style={{ color: c.primary }} /> Ready to mark</>
                              : <><Timer className="size-3.5" /> Prep time remaining</>
                            }
                          </div>
                          <span className="font-bold" style={{
                            fontFamily: c.mono,
                            color: secsLeft === 0 ? c.primary : secsLeft < 60 ? "#fbbf24" : c.sub
                          }}>
                            {secsLeft === 0 ? "Done!" : fmtCountdown(secsLeft)}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.muted }}>
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${pct}%`,
                              background: pct === 100
                                ? "var(--primary)"
                                : pct > 75
                                  ? "#34d399"
                                  : "#fbbf24"
                            }} />
                        </div>
                        <p className="text-[10px]" style={{ color: c.sub, fontFamily: c.mono }}>
                          {order.prepTimeMinutes} min total · {recipe ? `Recipe: ${recipe.menuItemName}` : "No recipe on file"}
                        </p>
                      </div>
                    )}

                    {/* Action button */}
                    {isReady ? (
                      <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: "color-mix(in srgb, #34d399 10%, transparent)", color: "#34d399", border: "1px solid color-mix(in srgb, #34d399 25%, transparent)", fontFamily: c.sans }}>
                        <CircleCheck className="size-4" /> Served — awaiting waiter pickup
                      </div>
                    ) : canMark ? (
                      <button onClick={() => handleMarkReady(order.id)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition"
                        style={{ background: c.primary, color: c.pFg, fontFamily: c.sans, boxShadow: "0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent)" }}>
                        <CheckCircle2 className="size-4" /> Mark as Ready
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
                        style={{ background: c.muted, color: c.sub, fontFamily: c.sans, border: `1px solid ${c.border}` }}>
                        <Lock className="size-3.5" />
                        <span>Mark Ready in {fmtCountdown(secsLeft)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RECIPE BOOK TAB ── */}
      {activeTab === "recipes" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold" style={{ fontFamily: c.serif, color: c.fg, fontSize: "1.1rem" }}>Recipe Book</h3>
              <p className="text-sm mt-0.5" style={{ color: c.sub, fontFamily: c.sans }}>
                {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} on file
              </p>
            </div>
            <button onClick={() => setShowAddRecipe(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition"
              style={{ background: c.primary, color: c.pFg, fontFamily: c.sans }}>
              <Plus className="size-4" /> Add Recipe
            </button>
          </div>

          {/* Menu items missing a recipe */}
          {menuItemsWithoutRecipe.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: "color-mix(in srgb, #fbbf24 8%, transparent)", border: "1px solid color-mix(in srgb, #fbbf24 20%, transparent)" }}>
              <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#fbbf24", fontFamily: c.sans }}>
                  {menuItemsWithoutRecipe.length} menu item{menuItemsWithoutRecipe.length > 1 ? "s" : ""} missing a recipe
                </p>
                <p className="text-xs mt-0.5" style={{ color: c.sub, fontFamily: c.sans }}>
                  {menuItemsWithoutRecipe.map(m => m.name).join(" · ")}
                </p>
              </div>
            </div>
          )}

          {recipes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 rounded-2xl"
              style={{ background: c.card, border: `1px solid ${c.border}` }}>
              <BookOpen className="size-12" style={{ color: c.sub }} />
              <div className="text-center">
                <p className="font-semibold" style={{ color: c.fg, fontFamily: c.sans }}>No recipes yet</p>
                <p className="text-sm mt-1" style={{ color: c.sub, fontFamily: c.sans }}>Add your first recipe to get started</p>
              </div>
              <button onClick={() => setShowAddRecipe(true)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: c.primary, color: c.pFg, fontFamily: c.sans }}>
                <Plus className="size-4 inline mr-1" /> Add First Recipe
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.map(recipe => {
                const isExpanded = expandedRecipe === recipe.id;
                return (
                  <div key={recipe.id} className="rounded-2xl overflow-hidden"
                    style={{ background: c.card, border: `1px solid ${c.border}` }}>
                    {/* Recipe header */}
                    <div className="p-4 flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "color-mix(in srgb, #a78bfa 12%, transparent)", color: "#a78bfa" }}>
                          <BookOpen className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold" style={{ color: c.fg, fontFamily: c.sans }}>{recipe.menuItemName}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs flex items-center gap-1" style={{ color: c.sub, fontFamily: c.mono }}>
                              <Timer className="size-3" /> {recipe.prepTimeMinutes} min
                            </span>
                            <span className="text-xs" style={{ color: c.sub, fontFamily: c.sans }}>
                              {recipe.ingredients.length} ingredients
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={e => { e.stopPropagation(); handleDeleteRecipe(recipe.id); }}
                          className="p-1.5 rounded-lg transition"
                          style={{ color: c.sub }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                          onMouseLeave={e => (e.currentTarget.style.color = c.sub)}>
                          <Trash2 className="size-4" />
                        </button>
                        <div className="transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c.sub} strokeWidth="2">
                            <path d="M2 5l5 5 5-5" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 flex flex-col gap-4" style={{ borderTop: `1px solid ${c.border}` }}>
                        {/* Ingredients */}
                        <div className="flex flex-col gap-2 pt-3">
                          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: c.sub, fontFamily: c.mono }}>Ingredients</p>
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.ingredients.map(ing => (
                              <span key={ing} className="px-2.5 py-1 rounded-full text-xs"
                                style={{ background: c.secondary, color: c.fg, fontFamily: c.sans, border: `1px solid ${c.border}` }}>
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* Instructions */}
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: c.sub, fontFamily: c.mono }}>Instructions</p>
                          <p className="text-sm leading-relaxed" style={{ color: c.fg, fontFamily: c.sans }}>{recipe.instructions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ADD RECIPE MODAL ── */}
      {showAddRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowAddRecipe(false)}>
          <div className="w-full max-w-lg rounded-2xl flex flex-col shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: c.card, border: `1px solid ${c.border}` }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
              style={{ background: c.card, borderBottom: `1px solid ${c.border}` }}>
              <div>
                <h3 className="font-bold" style={{ fontFamily: c.serif, color: c.fg, fontSize: "1.1rem" }}>Add Recipe</h3>
                <p className="text-xs mt-0.5" style={{ color: c.sub, fontFamily: c.sans }}>Document how a dish is prepared</p>
              </div>
              <button onClick={() => setShowAddRecipe(false)} className="p-1.5 rounded-lg" style={{ color: c.sub }}>
                <X className="size-5" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">
              {/* Menu item selector */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" style={{ color: c.fg, fontFamily: c.sans }}>Dish</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {menu.filter(m => m.approved).map(m => {
                    const hasRecipe = recipes.some(r => r.menuItemId === m.id);
                    return (
                      <button key={m.id} onClick={() => !hasRecipe && setRecipeMenuItem(m)}
                        disabled={hasRecipe}
                        className="flex items-center gap-2 p-2.5 rounded-xl text-left text-xs transition"
                        style={hasRecipe
                          ? { background: c.muted, color: c.sub, opacity: 0.5, cursor: "not-allowed", fontFamily: c.sans }
                          : recipeMenuItem?.id === m.id
                            ? { background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", border: "1.5px solid color-mix(in srgb, var(--primary) 40%, transparent)", fontFamily: c.sans }
                            : { background: c.secondary, color: c.fg, border: `1px solid ${c.border}`, fontFamily: c.sans }}>
                        <img src={m.image} alt={m.name} className="size-8 rounded-lg object-cover shrink-0" />
                        <span className="font-semibold truncate">{m.name}</span>
                        {hasRecipe && <span className="ml-auto shrink-0 text-[9px]" style={{ color: "#34d399" }}>✓ Done</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prep time */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" style={{ color: c.fg, fontFamily: c.sans }}>
                  Prep Time (minutes)
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setRecipePrepTime(t => Math.max(5, t - 5))}
                    className="size-9 rounded-xl flex items-center justify-center"
                    style={{ background: c.muted, color: c.fg }}>
                    <svg width="14" height="2" viewBox="0 0 14 2" fill={c.fg}><rect width="14" height="2" rx="1" /></svg>
                  </button>
                  <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl"
                    style={{ background: c.secondary, border: `1px solid ${c.border}` }}>
                    <Timer className="size-4" style={{ color: c.primary }} />
                    <span className="text-xl font-bold" style={{ color: c.fg, fontFamily: c.mono }}>{recipePrepTime}</span>
                    <span className="text-sm" style={{ color: c.sub, fontFamily: c.sans }}>min</span>
                  </div>
                  <button onClick={() => setRecipePrepTime(t => t + 5)}
                    className="size-9 rounded-xl flex items-center justify-center"
                    style={{ background: c.muted, color: c.fg }}>
                    <Plus className="size-4" />
                  </button>
                </div>
                <input type="range" min={5} max={120} step={5} value={recipePrepTime}
                  onChange={e => setRecipePrepTime(Number(e.target.value))}
                  className="w-full accent-amber-500" />
              </div>

              {/* Ingredients */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" style={{ color: c.fg, fontFamily: c.sans }}>
                  Ingredients <span style={{ color: c.sub }}>({recipeIngredients.length} added)</span>
                </label>
                <div className="flex gap-2">
                  <input value={ingredientInput}
                    onChange={e => setIngredientInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddIngredient()}
                    placeholder="e.g. Hilsa Fish — 4 pieces"
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: c.muted, border: `1px solid ${c.border}`, color: c.fg, fontFamily: c.sans }}
                    onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                    onBlur={e => (e.target.style.borderColor = c.border)} />
                  <button onClick={handleAddIngredient}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm"
                    style={{ background: c.primary, color: c.pFg, fontFamily: c.sans }}>
                    Add
                  </button>
                </div>
                {recipeIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl" style={{ background: c.secondary, border: `1px solid ${c.border}` }}>
                    {recipeIngredients.map(ing => (
                      <span key={ing} className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs"
                        style={{ background: c.muted, color: c.fg, fontFamily: c.sans }}>
                        {ing}
                        <button onClick={() => setRecipeIngredients(prev => prev.filter(i => i !== ing))}
                          style={{ color: c.sub }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                          onMouseLeave={e => (e.currentTarget.style.color = c.sub)}>
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" style={{ color: c.fg, fontFamily: c.sans }}>Cooking Instructions</label>
                <textarea value={recipeInstructions}
                  onChange={e => setRecipeInstructions(e.target.value)}
                  rows={5}
                  placeholder="Describe the cooking steps in detail…"
                  className="px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: c.muted, border: `1px solid ${c.border}`, color: c.fg, fontFamily: c.sans }}
                  onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.target.style.borderColor = c.border)} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 sticky bottom-0"
              style={{ background: c.card, borderTop: `1px solid ${c.border}` }}>
              <button onClick={() => setShowAddRecipe(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: c.secondary, color: c.fg, border: `1px solid ${c.border}`, fontFamily: c.sans }}>
                Cancel
              </button>
              <button
                disabled={!recipeMenuItem || recipeIngredients.length === 0 || !recipeInstructions.trim()}
                onClick={handleSaveRecipe}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition"
                style={(!recipeMenuItem || recipeIngredients.length === 0 || !recipeInstructions.trim())
                  ? { background: c.muted, color: c.sub, fontFamily: c.sans, cursor: "not-allowed" }
                  : { background: c.primary, color: c.pFg, fontFamily: c.sans, boxShadow: "0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent)" }}>
                <BookOpen className="size-4" /> Save Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
