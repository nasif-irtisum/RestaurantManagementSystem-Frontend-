import React, { useState } from "react";
import {
  Utensils,
  LogIn,
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  ChefHat,
  ArrowRight,
  Star,
  Zap,
  Clock
} from "lucide-react";
import { toast } from "sonner";

type Role = "Admin" | "Waiter" | "Chef" | "Customer" | "Guest";

interface LoginPageProps {
  onLogin: (name: string, email: string, role: Role) => void;
  onRegister: (name: string, email: string, role: "Customer" | "Waiter" | "Chef") => void;
  onGuestAccess: () => void;
}

const ROLE_CONFIG = [
  {
    role: "Customer" as Role,
    icon: User,
    desc: "Dining & reservations",
    accent: "text-purple-400",
    bg: "bg-purple-500/10"
  },
  {
    role: "Admin" as Role,
    icon: ShieldCheck,
    desc: "Full system control",
    accent: "text-primary",
    bg: "bg-primary/10"
  },
  {
    role: "Waiter" as Role,
    icon: UserCheck,
    desc: "Table & order management",
    accent: "text-blue-400",
    bg: "bg-blue-500/10"
  },
  {
    role: "Chef" as Role,
    icon: ChefHat,
    desc: "Kitchen & recipe hub",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10"
  }
];

const FEATURE_BADGES = [
  { icon: Star, text: "Authentic Bengali cuisine" },
  { icon: Zap, text: "Real-time order tracking" },
  { icon: Clock, text: "Instant table reservations" }
];

const REGISTER_ROLE_CONFIG: { role: "Customer" | "Waiter" | "Chef"; icon: React.ElementType; desc: string; color: string }[] = [
  { role: "Customer", icon: User,      desc: "Dine, reserve tables & order", color: "#a78bfa" },
  { role: "Waiter",   icon: UserCheck, desc: "Manage tables & orders",        color: "#60a5fa" },
  { role: "Chef",     icon: ChefHat,   desc: "Kitchen & recipe management",   color: "#34d399" },
];

export function LoginPage({ onLogin, onRegister, onGuestAccess }: LoginPageProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginRole, setLoginRole] = useState<Role>("Customer");
  const [registerRole, setRegisterRole] = useState<"Customer" | "Waiter" | "Chef">("Customer");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailInput.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (authMode === "login") {
      let displayName = emailInput.split("@")[0];
      if (loginRole === "Admin") displayName = "System Administrator";
      if (loginRole === "Chef") displayName = "Chef Karim Uddin";
      if (loginRole === "Waiter") displayName = "Rahim Chowdhury";
      onLogin(displayName, emailInput, loginRole);
    } else {
      if (!nameInput.trim()) {
        toast.error("Please enter your full name");
        return;
      }
      onRegister(nameInput, emailInput, registerRole);
    }
  };

  return (
    <div
      className="min-h-screen flex items-stretch"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
    >
      {/* LEFT PANEL — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden p-12"
        style={{
          background: "linear-gradient(135deg, var(--background) 0%, var(--sidebar) 40%, color-mix(in srgb, var(--accent) 8%, var(--background)) 100%)",
          borderRight: "1px solid var(--border)"
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: "color-mix(in srgb, var(--primary) 4%, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-2xl pointer-events-none"
          style={{ background: "color-mix(in srgb, var(--accent) 6%, transparent)" }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="size-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)",
              color: "var(--primary-foreground)",
              boxShadow: "0 8px 24px color-mix(in srgb, var(--primary) 25%, transparent)"
            }}
          >
            <Utensils className="size-6" />
          </div>
          <div>
            <p
              className="text-2xl font-bold tracking-wide"
              style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
            >
              Foodখোর Club
            </p>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-5">
            <span
              className="text-xs uppercase tracking-widest px-3 py-1.5 rounded-full inline-block font-semibold"
              style={{
                fontFamily: "var(--font-mono)",
                background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color: "var(--primary)",
                border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)"
              }}
            >
              আসল বাংলার স্বাদ
            </span>

            <h2
              className="text-4xl font-bold leading-tight"
              style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
            >
              The Taste of<br />Real Bengal
            </h2>

            <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7, maxWidth: "26rem" }}>
              Foodখোর Club is where authentic Bengali cuisine meets modern hospitality — from the kitchen to your table, every dish tells a story.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              {FEATURE_BADGES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon
                    className="size-3.5 shrink-0"
                    style={{ color: "var(--primary)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-2 gap-3">
            {ROLE_CONFIG.map(({ role, icon: Icon, desc, accent, bg }) => (
              <div
                key={role}
                className="flex items-center gap-3 rounded-xl p-3.5"
                style={{
                  background: "color-mix(in srgb, var(--card) 80%, transparent)",
                  border: "1px solid var(--border)"
                }}
              >
                <div className={`p-2 rounded-lg ${bg} ${accent} shrink-0`}>
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{role}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs relative z-10" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
          © 2026 Foodখোর Club
        </p>
      </div>

      {/* RIGHT PANEL — Auth Form */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-16"
        style={{ background: "var(--background)" }}
      >
        <div className="w-full max-w-[360px] space-y-7">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div
              className="size-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--primary))",
                color: "var(--primary-foreground)"
              }}
            >
              <Utensils className="size-5" />
            </div>
            <p
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
            >
              Foodখোর Club
            </p>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
            >
              {authMode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
              {authMode === "login"
                ? "Sign in to access your personalized dashboard"
                : "Register as a customer to start dining with us"}
            </p>
          </div>

          {/* Mode Tabs */}
          <div
            className="flex p-1 rounded-xl gap-1"
            style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
          >
            {(["login", "register"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setAuthMode(mode)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={
                  authMode === mode
                    ? {
                        background: "var(--primary)",
                        color: "var(--primary-foreground)",
                        boxShadow: "0 2px 8px color-mix(in srgb, var(--primary) 30%, transparent)"
                      }
                    : { color: "var(--muted-foreground)" }
                }
              >
                {mode === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role Selector (Login only) */}
            {authMode === "login" && (
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold block"
                  style={{ color: "var(--foreground)" }}
                >
                  Sign in as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_CONFIG.map(({ role, icon: Icon, accent }) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setLoginRole(role)}
                      className="p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                      style={
                        loginRole === role
                          ? {
                              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                              border: "1px solid color-mix(in srgb, var(--primary) 50%, transparent)",
                              color: "var(--primary)"
                            }
                          : {
                              background: "var(--muted)",
                              border: "1px solid var(--border)",
                              color: "var(--muted-foreground)"
                            }
                      }
                    >
                      <Icon className={`size-3.5 shrink-0 ${loginRole === role ? accent : ""}`} />
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Register: role selector */}
            {authMode === "register" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold block" style={{ color: "var(--foreground)" }}>
                  I want to join as:
                </label>
                <div className="flex flex-col gap-2">
                  {REGISTER_ROLE_CONFIG.map(({ role, icon: Icon, desc, color }) => {
                    const isSelected = registerRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setRegisterRole(role)}
                        className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={isSelected
                          ? { background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1.5px solid color-mix(in srgb, ${color} 50%, transparent)` }
                          : { background: "var(--muted)", border: "1px solid var(--border)" }}>
                        <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: isSelected ? color : "var(--foreground)", fontFamily: "var(--font-sans)" }}>{role}</p>
                          <p className="text-[11px]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>{desc}</p>
                        </div>
                        {role !== "Customer" && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full shrink-0 font-semibold"
                            style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", fontFamily: "var(--font-mono)", border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}>
                            Needs approval
                          </span>
                        )}
                        {role === "Customer" && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full shrink-0 font-semibold"
                            style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", color: "#22c55e", fontFamily: "var(--font-mono)", border: "1px solid color-mix(in srgb, #22c55e 25%, transparent)" }}>
                            Instant
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {registerRole !== "Customer" && (
                  <p className="text-xs p-3 rounded-xl" style={{ background: "color-mix(in srgb, var(--primary) 6%, transparent)", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)" }}>
                    <span style={{ color: "var(--primary)", fontWeight: 600 }}>Note:</span> {registerRole} accounts require admin approval before you can sign in.
                  </p>
                )}
              </div>
            )}

            {/* Name (Register only) */}
            {authMode === "register" && (
              <div className="space-y-1.5">
                <label
                  className="text-sm font-semibold block"
                  style={{ color: "var(--foreground)" }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "var(--input-background)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)"
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label
                className="text-sm font-semibold block"
                style={{ color: "var(--foreground)" }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@foodkhorclub.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--input-background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className="text-sm font-semibold block"
                style={{ color: "var(--foreground)" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--input-background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                boxShadow: "0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent)"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {authMode === "login" ? (
                <><LogIn className="size-4" /> Sign In as {loginRole}</>
              ) : registerRole === "Customer" ? (
                <><UserPlus className="size-4" /> Create Account & Sign In</>
              ) : (
                <><UserPlus className="size-4" /> Submit {registerRole} Application</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              or
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* Guest Access */}
          <button
            onClick={onGuestAccess}
            className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--muted-foreground)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
            }}
          >
            <ArrowRight className="size-4 rotate-180" />
            Back to Menu
          </button>

          <p
            className="text-center text-[11px]"
            style={{ color: "var(--muted-foreground)", opacity: 0.6 }}
          >
            By signing in you agree to Foodখোর Club's terms of service
          </p>
        </div>
      </div>
    </div>
  );
}
