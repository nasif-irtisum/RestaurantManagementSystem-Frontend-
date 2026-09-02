import React, { useState } from "react";
import {
  Utensils,
  User,
  ChefHat,
  Calendar,
  CalendarCheck,
  Clock,
  Users,
  MapPin,
  Plus,
  Minus,
  Trash2,
  X,
  ShieldCheck,
  ShoppingCart,
  UserCheck,
  LogIn,
  LogOut,
  Lock,
  Mail,
  UserPlus,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Receipt,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  BookOpen,
  ShoppingBag,
  Download
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { LoginPage } from "./components/LoginPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { WaiterDashboard } from "./components/WaiterDashboard";
import { ChefDashboard } from "./components/ChefDashboard";
import { ChatPanel, ChatMessage } from "./components/ChatPanel";
import { BillModal } from "./components/BillModal";

// TYPES & INTERFACES
type Role = "Admin" | "Waiter" | "Chef" | "Customer" | "Guest";

type OrderStatus = "Placed" | "In Kitchen" | "Ready" | "Served" | "Paid";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  prepTimeMinutes: number;
  image: string;
  approved: boolean;
  isCustomizable?: boolean;
  ingredientsOptions?: {
    bases?: string[];
    sauces?: string[];
    toppings?: { name: string; price: number }[];
    proteins?: { name: string; price: number }[];
  };
}

interface Recipe {
  id: string;
  menuItemId: string;
  menuItemName: string;
  prepTimeMinutes: number;
  instructions: string;
  ingredients: string[];
}

interface Table {
  id: string;
  number: number;
  capacity: number;
  location: string;
  status: "Available" | "Occupied" | "Reserved";
  assignedWaiterId?: string;
  assignedWaiterName?: string;
}

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  tableId: string;
  tableNumber: number;
  date: string;
  timeSlot: string;
  guests: number;
  status: "Confirmed" | "Cancelled" | "Completed";
  preOrders?: { itemName: string; price: number; quantity: number }[];
}

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
  status: OrderStatus;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  createdAt: Date;
  prepStartTime?: Date;
  prepTimeMinutes: number;
  waiterId?: string;
  waiterName?: string;
  isPaid?: boolean;
}

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


// SEED DATA
const INITIAL_MENU: MenuItem[] = [
  {
    id: "m1",
    name: "Ilish Bhapa",
    category: "Mains",
    price: 14,
    description: "Hilsa fillets wrapped in banana leaf and slow-steamed with black mustard paste (shorshe bata), raw turmeric, bird's eye chilli & cold-pressed mustard oil. The steam traps the pungent mustard aroma and the fish's natural oils, yielding a flaky, intensely flavoured result unique to Bengali cuisine.",
    prepTimeMinutes: 20,
    image: "https://images.unsplash.com/photo-1735988813908-6d38db90c41e?w=600&h=400&fit=crop&auto=format",
    approved: true
  },
  {
    id: "m2",
    name: "Custom Biryani",
    category: "Custom Meals",
    price: 13,
    description: "Aged basmati rice par-boiled with whole spices (bay leaf, star anise, mace, kewra water), then layered with marinated protein and sealed with dough for dum cooking — trapping steam for 25 minutes until the rice absorbs every drop of saffron-spiced stock. Build your own protein and add-on combination.",
    prepTimeMinutes: 30,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop&auto=format",
    approved: true,
    isCustomizable: true,
    ingredientsOptions: {
      proteins: [
        { name: "Mutton", price: 0 },
        { name: "Chicken", price: 0 },
        { name: "Hilsa Fish", price: 3 },
        { name: "Egg (Vegetarian)", price: 0 }
      ],
      toppings: [
        { name: "Borhani (Spiced Yogurt Drink)", price: 2 },
        { name: "Salad & Raita", price: 1.5 },
        { name: "Extra Egg", price: 2 },
        { name: "Ghee Rice Upgrade", price: 3 }
      ]
    }
  },
  {
    id: "m3",
    name: "Mutton Kala Bhuna",
    category: "Mains",
    price: 16,
    description: "Chittagong's most celebrated dish — bone-in mutton bhuna'd (dry-fried) with deeply caramelised onions, whole garam masala and a robust spice paste until the meat turns nearly black with concentrated flavour. No added water: the mutton releases its own juices, creating an intensely dark, dry-ish gravy that clings to every bone.",
    prepTimeMinutes: 40,
    image: "https://images.unsplash.com/photo-1606843046080-45bf7a23c39f?w=600&h=400&fit=crop&auto=format",
    approved: true
  },
  {
    id: "m4",
    name: "Chingri Malai Curry",
    category: "Mains",
    price: 18,
    description: "Head-on river prawns (golda chingri) cooked in freshly squeezed coconut milk (narikeler doodh) with green cardamom, cinnamon, a pinch of sugar and golden-fried onion paste. The prawn heads enrich the sauce with a natural briny sweetness. Served over steamed aromatic rice.",
    prepTimeMinutes: 18,
    image: "https://images.unsplash.com/photo-1620894580123-466ad3a0ca06?w=600&h=400&fit=crop&auto=format",
    approved: true
  },
  {
    id: "m5",
    name: "Singara",
    category: "Starters",
    price: 5,
    description: "Crispy hand-folded pastry cones stuffed with a dry masala of diced potato, cauliflower, green peas and roasted peanuts tempered with panch phoron (five-spice blend), green chilli and a squeeze of lime. Deep-fried in mustard oil until audibly crunchy. Served hot with tamarind chutney and fresh dhania (coriander) dip.",
    prepTimeMinutes: 10,
    image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=600&h=400&fit=crop&auto=format",
    approved: true
  },
  {
    id: "m6",
    name: "Mishti Doi",
    category: "Desserts",
    price: 6,
    description: "Full-fat buffalo milk reduced by a third and sweetened with caramelised nolen gur (date palm jaggery), then set overnight in unglazed clay pots (matkis) at low heat. The porous clay slowly absorbs excess whey, resulting in a thick, lightly tangy, warmly caramel-scented yogurt served chilled straight from the pot.",
    prepTimeMinutes: 5,
    image: "https://images.unsplash.com/photo-1563282397-ce3677ef7fca?w=600&h=400&fit=crop&auto=format",
    approved: false
  }
];

const INITIAL_TABLES: Table[] = [
  { id: "t1", number: 1, capacity: 2, location: "Main Dining Hall", status: "Available" },
  { id: "t2", number: 2, capacity: 4, location: "Main Dining Hall", status: "Occupied", assignedWaiterId: "e1", assignedWaiterName: "Rahim Chowdhury" },
  { id: "t3", number: 3, capacity: 4, location: "Window Section", status: "Reserved" },
  { id: "t4", number: 4, capacity: 6, location: "VIP Courtyard", status: "Available" },
  { id: "t5", number: 5, capacity: 2, location: "Window Section", status: "Available" },
  { id: "t6", number: 6, capacity: 8, location: "VIP Courtyard", status: "Occupied", assignedWaiterId: "e2", assignedWaiterName: "Sumaiya Begum" }
];

const INITIAL_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Rahim Chowdhury", role: "Waiter", email: "rahim@foodkhorclub.com", phone: "+880 1711-234567", clockedIn: true, lastClockIn: "08:30 AM" },
  { id: "e2", name: "Sumaiya Begum", role: "Waiter", email: "sumaiya@foodkhorclub.com", phone: "+880 1812-345678", clockedIn: true, lastClockIn: "09:00 AM" },
  { id: "e3", name: "Chef Karim Uddin", role: "Chef", email: "karim@foodkhorclub.com", phone: "+880 1915-456789", clockedIn: true, lastClockIn: "07:45 AM" },
  { id: "e4", name: "Chef Nasrin Akter", role: "Chef", email: "nasrin@foodkhorclub.com", phone: "+880 1614-567890", clockedIn: false, lastClockOut: "Yesterday 11:00 PM" }
];

const INITIAL_CUSTOMERS: CustomerAccount[] = [
  { id: "c1", name: "Arif Hassan",   email: "arif.h@example.com",   role: "Customer", status: "Approved", createdAt: "2026-07-20" },
  { id: "c2", name: "Nusrat Jahan",  email: "nusrat.j@example.com",  role: "Waiter",   status: "Pending",  createdAt: "2026-07-28" },
  { id: "c3", name: "Tanvir Ahmed",  email: "tanvir.a@example.com",  role: "Chef",     status: "Pending",  createdAt: "2026-07-29" },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-8901",
    customerName: "Table 2 (Arif Hassan)",
    tableNumber: 2,
    items: [
      { id: "oi1", menuItemId: "m1", name: "Ilish Bhapa", price: 14, quantity: 1 },
      { id: "oi2", menuItemId: "m5", name: "Singara", price: 5, quantity: 2 }
    ],
    status: "In Kitchen",
    totalAmount: 24,
    taxAmount: 2.16,
    grandTotal: 26.16,
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    prepStartTime: new Date(Date.now() - 10 * 60 * 1000),
    prepTimeMinutes: 20,
    waiterId: "e1",
    waiterName: "Rahim Chowdhury"
  },
  {
    id: "ORD-8902",
    customerName: "Table 6 (Walk-in)",
    tableNumber: 6,
    items: [
      { id: "oi3", menuItemId: "m2", name: "Custom Biryani", price: 16, quantity: 2, customDetails: "Mutton, Ghee Rice Upgrade, Borhani" },
      { id: "oi4", menuItemId: "m6", name: "Mishti Doi", price: 6, quantity: 2 }
    ],
    status: "Ready",
    totalAmount: 44,
    taxAmount: 3.96,
    grandTotal: 47.96,
    createdAt: new Date(Date.now() - 35 * 60 * 1000),
    prepStartTime: new Date(Date.now() - 30 * 60 * 1000),
    prepTimeMinutes: 30,
    waiterId: "e2",
    waiterName: "Sumaiya Begum"
  }
];

const INITIAL_RECIPES: Recipe[] = [
  {
    id: "r1",
    menuItemId: "m1",
    menuItemName: "Ilish Bhapa",
    prepTimeMinutes: 20,
    instructions: "Soak black mustard seeds and blend into a coarse paste with green chilli, turmeric and salt. Coat hilsa fillets generously. Place each portion on a banana leaf, drizzle cold-pressed mustard oil, fold the leaf tightly and tie with twine. Steam in a covered vessel for 15–18 mins. Serve in the leaf so the aroma unfolds at the table.",
    ingredients: ["Hilsa Fish (Ilish) — 4 large pieces", "Black Mustard Paste (shorshe bata)", "Raw Turmeric (halud)", "Bird's Eye Green Chilli", "Cold-Pressed Mustard Oil", "Banana Leaf", "Salt"]
  },
  {
    id: "r2",
    menuItemId: "m3",
    menuItemName: "Mutton Kala Bhuna",
    prepTimeMinutes: 40,
    instructions: "Dry-roast whole spices. Fry onions until deep golden. Add mutton and cook on high until browned. Lower heat, add spice paste, and bhuna until oil separates. Slow-cook covered until tender.",
    ingredients: ["Bone-in Mutton", "Caramelised Onion", "Bay Leaf", "Cardamom", "Cinnamon", "Garam Masala Paste", "Mustard Oil"]
  }
];


const INITIAL_RESERVATIONS: Reservation[] = [
  { id: "res-001", customerName: "Arif Hassan", customerPhone: "+880 1700-000001", tableId: "t3", tableNumber: 3, date: "2026-08-02", timeSlot: "7:30 PM", guests: 3, status: "Confirmed" },
  { id: "res-002", customerName: "Nusrat Jahan", customerPhone: "+880 1700-000002", tableId: "t4", tableNumber: 4, date: "2026-08-05", timeSlot: "1:00 PM", guests: 2, status: "Confirmed" }
];

function minsAgo(m: number) { return new Date(Date.now() - m * 60000); }

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  { id: "c1", senderName: "Chef Karim Uddin", senderRole: "Chef", text: "Good afternoon everyone! Ilish is fresh today — highly recommend.", room: "general", timestamp: minsAgo(62) },
  { id: "c2", senderName: "Rahim Chowdhury",  senderRole: "Waiter", text: "Table 3 is asking about the daily special — what's ready?", room: "kitchen", timestamp: minsAgo(45) },
  { id: "c3", senderName: "Chef Karim Uddin", senderRole: "Chef", text: "Ilish Bhapa and Mutton Kala Bhuna are both ready to go. Singara batch in 10 mins.", room: "kitchen", timestamp: minsAgo(44) },
  { id: "c4", senderName: "System Administrator", senderRole: "Admin", text: "Reminder: Iftar rush starts at 7 PM. All hands on deck please!", room: "general", timestamp: minsAgo(30) },
  { id: "c5", senderName: "Rahim Chowdhury",  senderRole: "Waiter", text: "Noted! Tables 5 & 6 are pre-booked for 7:30.", room: "general", timestamp: minsAgo(28) },
  { id: "c6", senderName: "Guest",             senderRole: "Guest",  text: "Hi! Do you have any vegetarian options?", room: "support", timestamp: minsAgo(15) },
  { id: "c7", senderName: "Rahim Chowdhury",  senderRole: "Waiter", text: "Yes! Mishti Doi and Singara are vegetarian. Would you like a table recommendation?", room: "support", timestamp: minsAgo(13) },
];

const TIME_SLOTS = [
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM"
];

const LOCATION_ICONS: Record<string, string> = {
  "Main Dining Hall": "🏛",
  "Window Section": "🪟",
  "VIP Courtyard": "⭐"
};

// Shared menu grid used by both Guest and Customer tabs
function MenuGrid({ menu, selectedCategory, setSelectedCategory, addToCart, handleOpenCustomizer, isGuest }: {
  menu: MenuItem[];
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  addToCart: (item: MenuItem) => void;
  handleOpenCustomizer: (item: MenuItem) => void;
  isGuest: boolean;
}) {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)", fontSize: "1.25rem" }}>আমাদের মেনু</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>বাংলার সেরা রান্না — ক্যাটাগরি বেছে নিন বা কাস্টম মিল তৈরি করুন</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          {["All", "Mains", "Custom Meals", "Starters", "Desserts"].map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={selectedCategory === cat
                ? { background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)" }
                : { color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu
          .filter((m) => m.approved)
          .filter((m) => selectedCategory === "All" || m.category === selectedCategory)
          .map((item) => (
            <div key={item.id} className="rounded-2xl overflow-hidden flex flex-col justify-between group transition"
              style={{ background: "var(--popover)", border: "1px solid var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 40%, transparent)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
              <div>
                <div className="relative h-44 overflow-hidden">
                  <img src={item.image} alt={item.name} className="size-full object-cover group-hover:scale-105 transition duration-500" />
                  <span className="absolute top-3 right-3 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: "rgba(0,0,0,0.75)", color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                    ${item.price.toFixed(2)}
                  </span>
                  <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-semibold"
                    style={{ background: "rgba(0,0,0,0.6)", color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                    {item.category}
                  </span>
                </div>
                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>{item.name}</h4>
                  <p className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>{item.description}</p>
                </div>
              </div>
              <div className="p-4 pt-0">
                {item.isCustomizable ? (
                  <button onClick={() => handleOpenCustomizer(item)}
                    className="w-full py-2.5 rounded-xl font-extrabold text-xs transition"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)" }}>
                    Customize Meal
                  </button>
                ) : (
                  <button onClick={() => !isGuest && addToCart(item)}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs transition"
                    style={{ background: "var(--secondary)", color: isGuest ? "var(--muted-foreground)" : "var(--foreground)", border: "1px solid var(--border)", fontFamily: "var(--font-sans)" }}>
                    {isGuest ? "Sign in to Order" : "+ Add to Cart"}
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function App() {
  // AUTH & USER SESSION STATE
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showLoginPage, setShowLoginPage] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: Role;
  }>({
    name: "Guest",
    email: "",
    role: "Guest"
  });

  const [currentRole, setCurrentRole] = useState<Role>("Guest");

  // SYSTEM DATA STATE
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [customers, setCustomers] = useState<CustomerAccount[]>(INITIAL_CUSTOMERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);

  // UI STATES
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [customerTab, setCustomerTab] = useState<"menu" | "tables" | "reservations" | "orders">("menu");
  const [billOrder, setBillOrder] = useState<Order | null>(null);

  // MODALS
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState<boolean>(false);
  const [showAddTableModal, setShowAddTableModal] = useState<boolean>(false);
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState<boolean>(false);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState<boolean>(false);
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [showWaiterAddOrderModal, setShowWaiterAddOrderModal] = useState<boolean>(false);

  // BOOKING FORM STATE
  const [bookingTable, setBookingTable] = useState<Table | null>(null);
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingTimeSlot, setBookingTimeSlot] = useState<string>("");
  const [bookingGuests, setBookingGuests] = useState<number>(2);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);


  // LOGIN HANDLER — checks approval status for staff accounts
  const handleLogin = (name: string, email: string, role: Role) => {
    // For staff roles, verify the account exists and is approved
    if (role === "Waiter" || role === "Chef") {
      const account = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.role === role);
      if (account) {
        if (account.status === "Pending") {
          toast.error("Your account is pending admin approval. Please wait.");
          return;
        }
        if (account.status === "Rejected") {
          toast.error("Your account application was rejected. Please contact the restaurant.");
          return;
        }
      }
    }
    setCurrentUser({ name, email, role });
    setCurrentRole(role);
    setIsLoggedIn(true);
    setShowLoginPage(false);
    toast.success(`Welcome back, ${name}! Signed in as ${role}.`);
  };

  // REGISTER HANDLER — Customers auto-approved; Waiter/Chef go pending
  const handleRegister = (name: string, email: string, role: "Customer" | "Waiter" | "Chef" = "Customer") => {
    const isCustomer = role === "Customer";
    const newAccount: CustomerAccount = {
      id: `c-${Date.now()}`,
      name,
      email,
      role,
      status: isCustomer ? "Approved" : "Pending",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setCustomers(prev => [newAccount, ...prev]);

    if (isCustomer) {
      setCurrentUser({ name, email, role: "Customer" });
      setCurrentRole("Customer");
      setIsLoggedIn(true);
      setShowLoginPage(false);
      toast.success("Account created! Welcome to Foodখোর Club.");
    } else {
      setShowLoginPage(false);
      toast.success(`Application submitted! An admin will review your ${role} account shortly.`);
    }
  };

  // GUEST — just close the login overlay, stay on landing
  const handleGuestAccess = () => {
    setShowLoginPage(false);
  };

  // LOGOUT
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentRole("Guest");
    setCurrentUser({ name: "Guest", email: "", role: "Guest" });
    toast.info("Logged out. Browsing as guest.");
  };

  // CHAT SEND
  const handleChatSend = (text: string, room: ChatMessage["room"]) => {
    setChatMessages(prev => [...prev, {
      id: `chat-${Date.now()}`,
      senderName: currentUser.name,
      senderRole: currentRole,
      text,
      room,
      timestamp: new Date(),
    }]);
  };

  // OPEN BOOKING MODAL for a specific table
  const openBookingForTable = (table: Table) => {
    setBookingTable(table);
    setBookingDate("");
    setBookingTimeSlot("");
    setBookingGuests(Math.min(2, table.capacity));
    setBookingStep(1);
    setShowBookingModal(true);
  };

  // CHECK if a slot is already taken
  const isSlotTaken = (tableId: string, date: string, slot: string) =>
    reservations.some(
      (r) => r.tableId === tableId && r.date === date && r.timeSlot === slot && r.status === "Confirmed"
    );

  // CONFIRM BOOKING
  const handleConfirmBooking = () => {
    if (!bookingTable || !bookingDate || !bookingTimeSlot) return;
    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      customerName: currentUser.name,
      customerPhone: "",
      tableId: bookingTable.id,
      tableNumber: bookingTable.number,
      date: bookingDate,
      timeSlot: bookingTimeSlot,
      guests: bookingGuests,
      status: "Confirmed"
    };
    setReservations((prev) => [newRes, ...prev]);
    setShowBookingModal(false);
    setBookingTable(null);
    setBookingStep(1);
    setCustomerTab("reservations");
    toast.success(`Table ${bookingTable.number} booked for ${bookingDate} at ${bookingTimeSlot}!`);
  };

  // CANCEL RESERVATION
  const handleCancelReservation = (resId: string) => {
    setReservations((prev) =>
      prev.map((r) => r.id === resId ? { ...r, status: "Cancelled" } : r)
    );
    toast.info("Reservation cancelled.");
  };

  // CLOCK IN / OUT
  const toggleClockIn = (employeeId: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === employeeId) {
          const nextState = !emp.clockedIn;
          toast.success(`${emp.name} is now ${nextState ? "Clocked IN 🟢" : "Clocked OUT 🔴"}`);
          return {
            ...emp,
            clockedIn: nextState,
            lastClockIn: nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : emp.lastClockIn,
            lastClockOut: !nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : emp.lastClockOut
          };
        }
        return emp;
      })
    );
  };

  // ORDER STATUS
  const advanceOrderStatus = (orderId: string, targetStatus?: OrderStatus) => {
    const statusFlow: OrderStatus[] = ["Placed", "In Kitchen", "Ready", "Served", "Paid"];
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          let nextStatus: OrderStatus = targetStatus || ord.status;
          if (!targetStatus) {
            const currentIndex = statusFlow.indexOf(ord.status);
            if (currentIndex < statusFlow.length - 1) {
              nextStatus = statusFlow[currentIndex + 1];
            }
          }
          toast.success(`Order #${ord.id} status updated to '${nextStatus}'`);
          return {
            ...ord,
            status: nextStatus,
            isPaid: nextStatus === "Paid" ? true : ord.isPaid
          };
        }
        return ord;
      })
    );
  };


  // CUSTOM MEAL BUILDER HANDLERS
  const [selectedBase, setSelectedBase] = useState<string>("");
  const [selectedProtein, setSelectedProtein] = useState<string>("");
  const [selectedSauce, setSelectedSauce] = useState<string>("");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const handleOpenCustomizer = (item: MenuItem) => {
    setCustomizingItem(item);
    setSelectedBase(item.ingredientsOptions?.bases?.[0] || "");
    setSelectedSauce(item.ingredientsOptions?.sauces?.[0] || "");
    setSelectedProtein(item.ingredientsOptions?.proteins?.[0]?.name || "");
    setSelectedToppings([]);
  };

  const addCustomizedToCart = () => {
    if (!customizingItem) return;
    let extraPrice = 0;
    const detailsArr: string[] = [];

    if (selectedBase) detailsArr.push(`Base: ${selectedBase}`);
    if (selectedProtein) detailsArr.push(`Protein: ${selectedProtein}`);
    if (selectedSauce) detailsArr.push(`Sauce: ${selectedSauce}`);

    if (selectedToppings.length > 0) {
      detailsArr.push(`Toppings: ${selectedToppings.join(", ")}`);
      selectedToppings.forEach((topName) => {
        const match = customizingItem.ingredientsOptions?.toppings?.find((t) => t.name === topName);
        if (match) extraPrice += match.price;
      });
    }

    const cartItem: OrderItem = {
      id: `ci-${Date.now()}`,
      menuItemId: customizingItem.id,
      name: customizingItem.name,
      price: customizingItem.price + extraPrice,
      quantity: 1,
      customDetails: detailsArr.join(" | ")
    };

    setCart((prev) => [...prev, cartItem]);
    setCustomizingItem(null);
    setCartOpen(true);
    toast.success(`${customizingItem.name} added to cart with custom choices!`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.id !== cartItemId));
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => ci.id === cartItemId ? { ...ci, quantity: ci.quantity + delta } : ci)
        .filter((ci) => ci.quantity > 0)
    );
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItemId === item.id && !ci.customDetails);
      if (existing) {
        return prev.map((ci) =>
          ci.id === existing.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [
        ...prev,
        {
          id: `ci-${Date.now()}`,
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        }
      ];
    });
    setCartOpen(true);
    toast.success(`Added ${item.name} to cart`);
  };

  const handlePlaceOrder = (tableNum: number | string = "Dine-in / Takeout") => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = +(subtotal * 0.09).toFixed(2);
    const grand = +(subtotal + tax).toFixed(2);

    const newOrd: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: isLoggedIn ? currentUser.name : "Guest Customer",
      tableNumber: tableNum,
      items: [...cart],
      status: "Placed",
      totalAmount: subtotal,
      taxAmount: tax,
      grandTotal: grand,
      createdAt: new Date(),
      prepTimeMinutes: 15
    };

    setOrders((prev) => [newOrd, ...prev]);
    setCart([]);
    setCartOpen(false);
    toast.success("Your order has been placed successfully!");
  };


  return (
    <div className="min-h-screen flex flex-col selection:bg-amber-500 selection:text-black"
      style={{ background: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
      <Toaster position="top-right" theme="dark" />

      {/* HEADER & NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4"
        style={{ background: "color-mix(in srgb, var(--sidebar) 92%, transparent)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-black font-extrabold shadow-lg shadow-amber-500/20">
            <Utensils className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}>
              Foodখোর Club
            </h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>আসল বাংলার স্বাদ</p>
          </div>
        </div>

        {/* ROLE BADGE — hidden for guests */}
        {isLoggedIn && currentRole !== "Guest" && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            {currentRole === "Admin" && <ShieldCheck className="size-3.5" style={{ color: "var(--primary)" }} />}
            {currentRole === "Waiter" && <UserCheck className="size-3.5 text-blue-400" />}
            {currentRole === "Chef" && <ChefHat className="size-3.5 text-emerald-400" />}
            {currentRole === "Customer" && <User className="size-3.5 text-purple-400" />}
            <span className="text-xs font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>{currentRole} Dashboard</span>
          </div>
        )}

        {/* USER SESSION / SIGN IN */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-xl"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <div className="text-left">
                <p className="text-xs font-bold leading-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>{currentUser.name}</p>
                <p className="text-[10px]" style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>{currentRole}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 rounded-lg transition"
                style={{ color: "var(--muted-foreground)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginPage(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                fontFamily: "var(--font-sans)",
                boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 28%, transparent)"
              }}
            >
              <LogIn className="size-4" /> Sign In
            </button>
          )}

          {/* CART QUICK ACCESS */}
          {(currentRole === "Customer" || currentRole === "Guest") && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-xl transition"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 40%, transparent)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <ShoppingCart className="size-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 text-black text-[10px] font-extrabold size-5 rounded-full flex items-center justify-center"
                  style={{ background: "var(--primary)" }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          )}

        </div>
      </header>

      {/* ADMIN DASHBOARD — full-width sidebar layout */}
      {currentRole === "Admin" && (
        <AdminDashboard
          employees={employees}
          setEmployees={setEmployees}
          customers={customers}
          setCustomers={setCustomers}
          tables={tables}
          setTables={setTables}
          menu={menu}
          setMenu={setMenu}
          orders={orders}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* WAITER DASHBOARD */}
      {currentRole === "Waiter" && (
        <WaiterDashboard
          currentUser={currentUser}
          employees={employees}
          setEmployees={setEmployees}
          tables={tables}
          setTables={setTables}
          orders={orders}
          setOrders={setOrders}
          menu={menu}
        />
      )}

      {/* CHEF DASHBOARD */}
      {currentRole === "Chef" && (
        <ChefDashboard
          currentUser={currentUser}
          employees={employees}
          setEmployees={setEmployees}
          orders={orders}
          setOrders={setOrders}
          menu={menu}
          recipes={recipes}
          setRecipes={setRecipes}
        />
      )}

      {/* OTHER ROLES BODY */}
      {currentRole !== "Admin" && currentRole !== "Waiter" && currentRole !== "Chef" && (
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

        {/* ROLE BAR — for authenticated non-admin, non-waiter, non-guest users */}
        {isLoggedIn && currentRole !== "Guest" && currentRole !== "Waiter" && (
          <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ background: "color-mix(in srgb, var(--accent) 8%, var(--card))", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
                {currentRole === "Waiter" && <UserCheck className="size-6" />}
                {currentRole === "Chef" && <ChefHat className="size-6" />}
                {currentRole === "Customer" && <User className="size-6" />}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>Active Perspective</div>
                <h2 className="font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}>{currentRole} Dashboard</h2>
              </div>
            </div>
          </div>
        )}


        {/* GUEST PERSPECTIVE — hero + tables + menu */}
        {currentRole === "Guest" && (
          <div className="flex flex-col gap-10">
            {/* Hero banner */}
            <div className="relative rounded-3xl overflow-hidden p-8 border shadow-2xl"
              style={{ background: "linear-gradient(135deg, var(--card) 0%, color-mix(in srgb, var(--accent) 12%, var(--card)) 100%)", borderColor: "var(--border)" }}>
              <div className="max-w-xl space-y-4 relative z-10">
                <span className="text-xs uppercase px-3 py-1 rounded-full font-semibold"
                  style={{ fontFamily: "var(--font-mono)", background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)" }}>
                  আসল বাংলার স্বাদ
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold leading-tight"
                  style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}>
                  টেবিল বুক করুন &amp; আগেই খাবার বেছে নিন
                </h2>
                <p style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                  Browse our floor plan and menu below. Sign in to reserve a table and pre-order your favourite Bengali dishes.
                </p>
                <button onClick={() => setShowLoginPage(true)}
                  className="px-5 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2 transition"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)" }}>
                  <LogIn className="size-4" /> Sign In to Book
                </button>
              </div>
            </div>

            {/* Tables — read-only view */}
            <div className="flex flex-col gap-5">
              {/* Section header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)", fontSize: "1.25rem" }}>
                    Restaurant Floor
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                    Live table availability — sign in to make a reservation
                  </p>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs" style={{ fontFamily: "var(--font-sans)" }}>
                  {[
                    { label: "Available", color: "#22c55e" },
                    { label: "Reserved", color: "var(--primary)" },
                    { label: "Occupied", color: "#ef4444" },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full" style={{ background: color }} />
                      <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tables grouped by location */}
              {["Main Dining Hall", "Window Section", "VIP Courtyard"].map((location) => {
                const locationTables = tables.filter(t => t.location === location);
                return (
                  <div key={location}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{LOCATION_ICONS[location] || "🍽"}</span>
                      <h4 className="font-semibold" style={{ fontFamily: "var(--font-sans)", color: "var(--foreground)" }}>{location}</h4>
                      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {locationTables.map((table) => {
                        const statusColor = table.status === "Available" ? "#22c55e" : table.status === "Reserved" ? "var(--primary)" : "#ef4444";
                        const isAvailable = table.status === "Available";
                        return (
                          <div key={table.id}
                            className="rounded-2xl p-4 flex flex-col gap-3"
                            style={{
                              background: "var(--card)",
                              border: `1.5px solid ${isAvailable ? "color-mix(in srgb, #22c55e 22%, transparent)" : "var(--border)"}`,
                              boxShadow: isAvailable ? "0 0 16px color-mix(in srgb, #22c55e 6%, transparent)" : "none",
                            }}>
                            {/* Number + status badge */}
                            <div className="flex items-start justify-between">
                              <div className="size-12 rounded-xl flex items-center justify-center font-bold text-xl"
                                style={{ background: "var(--muted)", color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                                {table.number}
                              </div>
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
                                style={{ background: `color-mix(in srgb, ${statusColor} 15%, transparent)`, color: statusColor, fontFamily: "var(--font-mono)" }}>
                                <div className="size-1.5 rounded-full" style={{ background: statusColor }} />
                                {table.status}
                              </div>
                            </div>
                            {/* Details */}
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                                <Users className="size-3.5" />
                                <span>Up to {table.capacity} guests</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                                <MapPin className="size-3.5" />
                                <span>{table.location}</span>
                              </div>
                            </div>
                            {/* CTA — sign in to book if available */}
                            {isAvailable ? (
                              <button
                                onClick={() => setShowLoginPage(true)}
                                className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                                style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)" }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                                <LogIn className="size-3" /> Sign In to Book
                              </button>
                            ) : (
                              <div className="w-full py-2 rounded-xl text-xs text-center"
                                style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", opacity: 0.7 }}>
                                {table.status}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Menu */}
            <MenuGrid menu={menu} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
              addToCart={addToCart} handleOpenCustomizer={handleOpenCustomizer} isGuest={true} />
          </div>
        )}

        {/* CUSTOMER PERSPECTIVE — tabbed dashboard */}
        {currentRole === "Customer" && (
          <div className="flex flex-col gap-6">
            {/* Tab bar */}
            <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              {([
                { id: "menu",         label: "Browse Menu",    icon: BookOpen },
                { id: "tables",       label: "View Tables",    icon: Calendar },
                { id: "reservations", label: "Reservations",   icon: CalendarCheck },
                { id: "orders",       label: "My Orders",      icon: ShoppingBag },
              ] as const).map(({ id, label, icon: Icon }) => {
                const myResCount = reservations.filter(r => r.customerName === currentUser.name && r.status === "Confirmed").length;
                const myOrdCount = orders.filter(o => o.customerName === currentUser.name && o.status !== "Paid").length;
                const badge = id === "reservations" ? myResCount : id === "orders" ? myOrdCount : 0;
                const isActive = customerTab === id;
                return (
                  <button key={id} onClick={() => setCustomerTab(id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
                    style={isActive
                      ? { background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)" }
                      : { color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                    <Icon className="size-4" />{label}
                    {badge > 0 && (
                      <span className="size-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: isActive ? "rgba(0,0,0,0.2)" : "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-mono)" }}>
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB: MENU */}
            {customerTab === "menu" && (
              <MenuGrid menu={menu} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                addToCart={addToCart} handleOpenCustomizer={handleOpenCustomizer} isGuest={false} />
            )}

            {/* TAB: TABLES */}
            {customerTab === "tables" && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)", fontSize: "1.25rem" }}>Restaurant Floor</h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>Select an available table to make a reservation</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ fontFamily: "var(--font-sans)" }}>
                    {[
                      { label: "Available", color: "#22c55e" },
                      { label: "Reserved", color: "var(--primary)" },
                      { label: "Occupied", color: "#ef4444" }
                    ].map(({ label, color }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className="size-2.5 rounded-full" style={{ background: color }} />
                        <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group by location */}
                {["Main Dining Hall", "Window Section", "VIP Courtyard"].map((location) => {
                  const locationTables = tables.filter(t => t.location === location);
                  return (
                    <div key={location}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{LOCATION_ICONS[location] || "🍽"}</span>
                        <h4 className="font-semibold" style={{ fontFamily: "var(--font-sans)", color: "var(--foreground)" }}>{location}</h4>
                        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {locationTables.map((table) => {
                          const statusColor = table.status === "Available" ? "#22c55e" : table.status === "Reserved" ? "var(--primary)" : "#ef4444";
                          const isAvailable = table.status === "Available";
                          return (
                            <div key={table.id}
                              className="rounded-2xl p-4 flex flex-col gap-3 transition"
                              style={{
                                background: "var(--card)",
                                border: `1.5px solid ${isAvailable ? "color-mix(in srgb, #22c55e 25%, transparent)" : "var(--border)"}`,
                                boxShadow: isAvailable ? "0 0 16px color-mix(in srgb, #22c55e 8%, transparent)" : "none"
                              }}>
                              <div className="flex items-start justify-between">
                                <div className="size-12 rounded-xl flex items-center justify-center font-bold text-xl"
                                  style={{ background: "var(--muted)", color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                                  {table.number}
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
                                  style={{ background: `color-mix(in srgb, ${statusColor} 15%, transparent)`, color: statusColor, fontFamily: "var(--font-mono)" }}>
                                  <div className="size-1.5 rounded-full" style={{ background: statusColor }} />
                                  {table.status}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                                  <Users className="size-3.5" />
                                  <span>Up to {table.capacity} guests</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                                  <MapPin className="size-3.5" />
                                  <span>{table.location}</span>
                                </div>
                              </div>
                              <button
                                disabled={!isAvailable}
                                onClick={() => isAvailable && openBookingForTable(table)}
                                className="w-full py-2 rounded-xl text-xs font-bold transition"
                                style={isAvailable
                                  ? { background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)", cursor: "pointer" }
                                  : { background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", cursor: "not-allowed", opacity: 0.6 }}>
                                {isAvailable ? "Book This Table" : table.status}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB: MY RESERVATIONS */}
            {customerTab === "reservations" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)", fontSize: "1.25rem" }}>My Reservations</h3>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>All your upcoming and past table bookings</p>
                </div>

                {reservations.filter(r => r.customerName === currentUser.name).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <CalendarCheck className="size-12" style={{ color: "var(--muted-foreground)" }} />
                    <div className="text-center">
                      <p className="font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>No reservations yet</p>
                      <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>Head to View Tables and book your spot</p>
                    </div>
                    <button onClick={() => setCustomerTab("tables")}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)" }}>
                      <Calendar className="size-4" /> View Tables
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {reservations
                      .filter(r => r.customerName === currentUser.name)
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((res) => {
                        const table = tables.find(t => t.id === res.tableId);
                        const isPast = new Date(`${res.date} ${res.timeSlot}`) < new Date();
                        const statusColor = res.status === "Confirmed" ? "#22c55e" : res.status === "Cancelled" ? "#ef4444" : "var(--muted-foreground)";
                        return (
                          <div key={res.id} className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition"
                            style={{ background: "var(--card)", border: `1.5px solid ${res.status === "Confirmed" ? "color-mix(in srgb, #22c55e 20%, transparent)" : "var(--border)"}` }}>
                            {/* Table number badge */}
                            <div className="size-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                              <span className="text-[10px] uppercase" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>Table</span>
                              <span className="text-2xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>{res.tableNumber}</span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
                                  Table {res.tableNumber} — {table?.location || ""}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  style={{ background: `color-mix(in srgb, ${statusColor} 15%, transparent)`, color: statusColor, fontFamily: "var(--font-mono)" }}>
                                  {res.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                                <span className="flex items-center gap-1.5"><Calendar className="size-3.5" />{res.date}</span>
                                <span className="flex items-center gap-1.5"><Clock className="size-3.5" />{res.timeSlot}</span>
                                <span className="flex items-center gap-1.5"><Users className="size-3.5" />{res.guests} guests</span>
                              </div>
                            </div>

                            {/* Actions */}
                            {res.status === "Confirmed" && !isPast && (
                              <button onClick={() => handleCancelReservation(res.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0"
                                style={{ background: "color-mix(in srgb, #ef4444 10%, transparent)", color: "#ef4444", border: "1px solid color-mix(in srgb, #ef4444 25%, transparent)", fontFamily: "var(--font-sans)" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in srgb, #ef4444 20%, transparent)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "color-mix(in srgb, #ef4444 10%, transparent)")}>
                                <XCircle className="size-4" /> Cancel
                              </button>
                            )}
                            {(res.status === "Cancelled" || isPast) && (
                              <span className="text-xs px-3 py-2 rounded-xl shrink-0"
                                style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                                {res.status === "Cancelled" ? "Cancelled" : "Completed"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    <button onClick={() => { setCustomerTab("tables"); }}
                      className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                      style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", fontFamily: "var(--font-sans)" }}>
                      <Plus className="size-4" /> Add Another Booking
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: MY ORDERS */}
            {customerTab === "orders" && (() => {
              const myOrders = orders
                .filter(o => o.customerName === currentUser.name)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              const STATUS_COLOR: Record<string, string> = {
                "Placed":     "#60a5fa",
                "In Kitchen": "#fbbf24",
                "Ready":      "#34d399",
                "Served":     "#a78bfa",
                "Paid":       "var(--muted-foreground)",
              };

              return (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)", fontSize: "1.25rem" }}>My Orders</h3>
                      <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                        Track your active orders and download bills
                      </p>
                    </div>
                  </div>

                  {myOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <ShoppingBag className="size-12" style={{ color: "var(--muted-foreground)" }} />
                      <div className="text-center">
                        <p className="font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>No orders yet</p>
                        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>Browse the menu and place your first order</p>
                      </div>
                      <button onClick={() => setCustomerTab("menu")}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)" }}>
                        <BookOpen className="size-4" /> Browse Menu
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {myOrders.map(order => {
                        const sc = STATUS_COLOR[order.status] ?? "var(--muted-foreground)";
                        const isSettled = order.status === "Served" || order.status === "Paid";
                        return (
                          <div key={order.id} className="rounded-2xl overflow-hidden"
                            style={{ background: "var(--card)", border: `1.5px solid ${isSettled ? "color-mix(in srgb, #34d399 18%, transparent)" : "var(--border)"}` }}>

                            {/* Order header */}
                            <div className="flex items-center justify-between gap-3 px-5 py-4 flex-wrap"
                              style={{ borderBottom: "1px solid var(--border)" }}>
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
                                  style={{ background: `color-mix(in srgb, ${sc} 12%, transparent)`, color: sc }}>
                                  <Receipt className="size-4.5" />
                                </div>
                                <div>
                                  <p className="font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                                    #{order.id}
                                  </p>
                                  <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-sans)", color: "var(--muted-foreground)" }}>
                                    {new Date(order.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    {" · "} Table {order.tableNumber}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                                  style={{ background: `color-mix(in srgb, ${sc} 12%, transparent)`, color: sc, fontFamily: "var(--font-mono)" }}>
                                  {order.status}
                                </span>
                                <span className="font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                                  ${order.grandTotal.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Items summary */}
                            <div className="px-5 py-3 flex flex-wrap gap-2">
                              {order.items.map(item => (
                                <span key={item.id} className="text-xs px-2.5 py-1 rounded-full"
                                  style={{ background: "var(--secondary)", color: "var(--foreground)", fontFamily: "var(--font-sans)", border: "1px solid var(--border)" }}>
                                  {item.name} ×{item.quantity}
                                </span>
                              ))}
                            </div>

                            {/* Totals row + bill button */}
                            <div className="flex items-center justify-between gap-3 px-5 py-3 flex-wrap"
                              style={{ borderTop: "1px solid var(--border)", background: "color-mix(in srgb, var(--muted) 40%, transparent)" }}>
                              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                                <span>Subtotal: ${order.totalAmount.toFixed(2)}</span>
                                <span>Tax: ${order.taxAmount.toFixed(2)}</span>
                              </div>
                              <button
                                onClick={() => setBillOrder(order)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition"
                                style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)", boxShadow: "0 3px 10px color-mix(in srgb, var(--primary) 25%, transparent)" }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                                <Download className="size-3.5" /> View & Download Bill
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

      </div>
      )}

      {/* FOOTER — hidden for admin, waiter and chef (they have own layouts) */}
      {currentRole !== "Admin" && currentRole !== "Waiter" && currentRole !== "Chef" && (
      <footer className="mt-auto py-6 px-4 text-center text-xs"
        style={{ borderTop: "1px solid var(--border)", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
        Foodখোর Club • আসল বাংলার স্বাদ
      </footer>
      )}

      {/* CART DRAWER */}
      {cartOpen && (currentRole === "Customer" || currentRole === "Guest") && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          {/* Drawer panel */}
          <div
            className="fixed top-0 right-0 h-full z-50 flex flex-col w-full max-w-sm shadow-2xl"
            style={{ background: "var(--sidebar)", borderLeft: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="size-5" style={{ color: "var(--primary)" }} />
                <span style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)", fontWeight: 700, fontSize: "1.1rem" }}>
                  Your Order
                </span>
                {cart.length > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-lg transition"
                style={{ color: "var(--muted-foreground)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
                  <div
                    className="size-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--muted)" }}
                  >
                    <ShoppingCart className="size-7" style={{ color: "var(--muted-foreground)" }} />
                  </div>
                  <div className="text-center">
                    <p style={{ fontFamily: "var(--font-sans)", color: "var(--foreground)", fontWeight: 600 }}>
                      Your cart is empty
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                      Add dishes from the menu to get started
                    </p>
                  </div>
                </div>
              ) : (
                cart.map((ci) => {
                  const menuItem = menu.find(m => m.id === ci.menuItemId);
                  return (
                    <div
                      key={ci.id}
                      className="flex gap-3 p-3 rounded-xl"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      {menuItem && (
                        <img
                          src={menuItem.image}
                          alt={ci.name}
                          className="size-14 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
                          {ci.name}
                        </p>
                        {ci.customDetails && (
                          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "var(--muted-foreground)" }}>
                            {ci.customDetails}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateCartQty(ci.id, -1)}
                              className="size-6 rounded-lg flex items-center justify-center transition"
                              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                              {ci.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQty(ci.id, 1)}
                              className="size-6 rounded-lg flex items-center justify-center transition"
                              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                              ${(ci.price * ci.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeFromCart(ci.id)}
                              className="p-1 rounded-lg transition"
                              style={{ color: "var(--muted-foreground)" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer summary + CTA */}
            {cart.length > 0 && (() => {
              const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
              const tax = subtotal * 0.09;
              const grand = subtotal + tax;
              return (
                <div
                  className="px-5 py-4 flex flex-col gap-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm" style={{ color: "var(--muted-foreground)" }}>
                      <span style={{ fontFamily: "var(--font-sans)" }}>Subtotal</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ color: "var(--muted-foreground)" }}>
                      <span style={{ fontFamily: "var(--font-sans)" }}>Tax (9%)</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>${tax.toFixed(2)}</span>
                    </div>
                    <div
                      className="flex justify-between font-bold pt-1.5"
                      style={{ borderTop: "1px solid var(--border)", color: "var(--foreground)" }}
                    >
                      <span style={{ fontFamily: "var(--font-sans)" }}>Total</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>${grand.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlaceOrder()}
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                    style={{
                      background: "var(--primary)",
                      color: "var(--primary-foreground)",
                      fontFamily: "var(--font-sans)",
                      boxShadow: "0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent)"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    <Receipt className="size-4" /> Place Order
                  </button>
                  <button
                    onClick={() => setCart([])}
                    className="w-full py-2 rounded-xl text-sm transition"
                    style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
                  >
                    Clear all items
                  </button>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* CUSTOMIZER MODAL */}
      {customizingItem && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setCustomizingItem(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Item image header */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={customizingItem.image}
                  alt={customizingItem.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <button
                  onClick={() => setCustomizingItem(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
                >
                  <X className="size-4" />
                </button>
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-bold text-white" style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem" }}>
                    {customizingItem.name}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                    from ${customizingItem.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
                {/* Protein selector */}
                {customizingItem.ingredientsOptions?.proteins && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
                      Choose Protein
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {customizingItem.ingredientsOptions.proteins.map(p => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setSelectedProtein(p.name)}
                          className="p-3 rounded-xl text-left transition"
                          style={
                            selectedProtein === p.name
                              ? { background: "color-mix(in srgb, var(--primary) 12%, transparent)", border: "1.5px solid var(--primary)", color: "var(--primary)" }
                              : { background: "var(--muted)", border: "1.5px solid var(--border)", color: "var(--muted-foreground)" }
                          }
                        >
                          <p className="text-xs font-semibold" style={{ fontFamily: "var(--font-sans)" }}>{p.name}</p>
                          {p.price > 0 && (
                            <p className="text-[10px] mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>+${p.price.toFixed(2)}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toppings selector */}
                {customizingItem.ingredientsOptions?.toppings && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
                      Add-ons <span className="font-normal" style={{ color: "var(--muted-foreground)" }}>(optional)</span>
                    </p>
                    <div className="flex flex-col gap-2">
                      {customizingItem.ingredientsOptions.toppings.map(t => {
                        const selected = selectedToppings.includes(t.name);
                        return (
                          <button
                            key={t.name}
                            type="button"
                            onClick={() =>
                              setSelectedToppings(prev =>
                                selected ? prev.filter(x => x !== t.name) : [...prev, t.name]
                              )
                            }
                            className="flex items-center justify-between p-3 rounded-xl transition"
                            style={
                              selected
                                ? { background: "color-mix(in srgb, var(--primary) 8%, transparent)", border: "1.5px solid color-mix(in srgb, var(--primary) 40%, transparent)" }
                                : { background: "var(--muted)", border: "1.5px solid var(--border)" }
                            }
                          >
                            <div className="flex items-center gap-2.5">
                              {selected
                                ? <CheckSquare className="size-4 shrink-0" style={{ color: "var(--primary)" }} />
                                : <Square className="size-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                              }
                              <span className="text-xs font-medium" style={{ color: selected ? "var(--foreground)" : "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                                {t.name}
                              </span>
                            </div>
                            <span className="text-xs font-bold" style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                              +${t.price.toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Price preview */}
                <div
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>Total price</span>
                  <span className="font-bold" style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                    ${(
                      customizingItem.price +
                      selectedToppings.reduce((sum, name) => {
                        const t = customizingItem.ingredientsOptions?.toppings?.find(x => x.name === name);
                        return sum + (t?.price || 0);
                      }, 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                <button
                  onClick={addCustomizedToCart}
                  className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    fontFamily: "var(--font-sans)",
                    boxShadow: "0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent)"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  <ShoppingCart className="size-4" /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TABLE BOOKING MODAL */}
      {showBookingModal && bookingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowBookingModal(false)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)", fontSize: "1.1rem" }}>
                  Reserve Table {bookingTable.number}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                  {bookingTable.location} · Up to {bookingTable.capacity} guests
                </p>
              </div>
              <button onClick={() => setShowBookingModal(false)}
                className="p-1.5 rounded-lg transition" style={{ color: "var(--muted-foreground)" }}>
                <X className="size-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-0 px-6 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              {[
                { n: 1, label: "Date & Time" },
                { n: 2, label: "Guests" },
                { n: 3, label: "Confirm" }
              ].map(({ n, label }, i) => (
                <React.Fragment key={n}>
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full flex items-center justify-center text-xs font-bold transition"
                      style={bookingStep >= n
                        ? { background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-mono)" }
                        : { background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                      {bookingStep > n ? <CheckCircle2 className="size-4" /> : n}
                    </div>
                    <span className="text-xs font-medium hidden sm:block"
                      style={{ color: bookingStep >= n ? "var(--foreground)" : "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                      {label}
                    </span>
                  </div>
                  {i < 2 && <div className="flex-1 h-px mx-3" style={{ background: bookingStep > n ? "var(--primary)" : "var(--border)" }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Step content */}
            <div className="px-6 py-5 flex flex-col gap-5 max-h-[55vh] overflow-y-auto">

              {/* STEP 1: Date & Time */}
              {bookingStep === 1 && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
                      Select Date
                    </label>
                    <input
                      type="date"
                      min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                      value={bookingDate}
                      onChange={e => { setBookingDate(e.target.value); setBookingTimeSlot(""); }}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{
                        background: "var(--input-background)", border: "1px solid var(--border)",
                        color: "var(--foreground)", fontFamily: "var(--font-sans)",
                        colorScheme: "dark"
                      }}
                    />
                  </div>

                  {bookingDate && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
                        Select Time Slot
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {TIME_SLOTS.map(slot => {
                          const taken = isSlotTaken(bookingTable.id, bookingDate, slot);
                          return (
                            <button key={slot} disabled={taken}
                              onClick={() => !taken && setBookingTimeSlot(slot)}
                              className="py-2 rounded-xl text-xs font-semibold transition"
                              style={taken
                                ? { background: "var(--muted)", color: "var(--muted-foreground)", cursor: "not-allowed", opacity: 0.4, fontFamily: "var(--font-mono)" }
                                : bookingTimeSlot === slot
                                  ? { background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-mono)" }
                                  : { background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)" }
                              }>
                              {taken ? "Booked" : slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* STEP 2: Guests */}
              {bookingStep === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
                      Number of Guests
                    </label>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                      This table seats up to {bookingTable.capacity} guests.
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={() => setBookingGuests(g => Math.max(1, g - 1))}
                        className="size-10 rounded-xl flex items-center justify-center transition"
                        style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                        <Minus className="size-4" />
                      </button>
                      <span className="text-4xl font-bold w-16 text-center"
                        style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                        {bookingGuests}
                      </span>
                      <button onClick={() => setBookingGuests(g => Math.min(bookingTable.capacity, g + 1))}
                        className="size-10 rounded-xl flex items-center justify-center transition"
                        style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {Array.from({ length: bookingTable.capacity }, (_, i) => i + 1).map(n => (
                        <button key={n} onClick={() => setBookingGuests(n)}
                          className="size-9 rounded-lg text-sm font-bold transition"
                          style={bookingGuests === n
                            ? { background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-mono)" }
                            : { background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)" }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Confirm */}
              {bookingStep === 3 && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl p-4 flex flex-col gap-3"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                      Booking Summary
                    </p>
                    {[
                      { label: "Table", value: `Table ${bookingTable.number} — ${bookingTable.location}` },
                      { label: "Date", value: bookingDate },
                      { label: "Time", value: bookingTimeSlot },
                      { label: "Guests", value: `${bookingGuests} ${bookingGuests === 1 ? "guest" : "guests"}` },
                      { label: "Name", value: currentUser.name }
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>{label}</span>
                        <span className="font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
                    <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                      Your reservation will be instantly confirmed. You can cancel from My Reservations up to the booking time.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => bookingStep === 1 ? setShowBookingModal(false) : setBookingStep((s) => (s - 1) as 1 | 2 | 3)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", fontFamily: "var(--font-sans)" }}>
                <ChevronLeft className="size-4" />
                {bookingStep === 1 ? "Cancel" : "Back"}
              </button>

              {bookingStep < 3 ? (
                <button
                  disabled={bookingStep === 1 && (!bookingDate || !bookingTimeSlot)}
                  onClick={() => setBookingStep((s) => (s + 1) as 2 | 3)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition"
                  style={bookingStep === 1 && (!bookingDate || !bookingTimeSlot)
                    ? { background: "var(--muted)", color: "var(--muted-foreground)", cursor: "not-allowed", fontFamily: "var(--font-sans)" }
                    : { background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)" }}>
                  Continue <ChevronRight className="size-4" />
                </button>
              ) : (
                <button onClick={handleConfirmBooking}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-sans)", boxShadow: "0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent)" }}>
                  <CheckCircle2 className="size-4" /> Confirm Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOGIN PAGE OVERLAY */}
      {showLoginPage && (
        <div className="fixed inset-0 z-50">
          <LoginPage
            onLogin={handleLogin}
            onRegister={handleRegister}
            onGuestAccess={handleGuestAccess}
          />
        </div>
      )}

      {/* BILL MODAL */}
      {billOrder && (
        <BillModal order={billOrder} onClose={() => setBillOrder(null)} />
      )}

      {/* CHAT PANEL — floating, available to all roles */}
      <ChatPanel
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        currentRole={currentRole}
        messages={chatMessages}
        onSend={handleChatSend}
        onRequestLogin={() => setShowLoginPage(true)}
      />
    </div>
  );
}
