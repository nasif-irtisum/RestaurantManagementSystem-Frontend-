import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare, X, Send, ChefHat, User, UserCheck,
  ShieldCheck, Circle, Minimize2
} from "lucide-react";

type Role = "Admin" | "Waiter" | "Chef" | "Customer" | "Guest";

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: Role;
  text: string;
  timestamp: Date;
  room: "general" | "kitchen" | "support";
}

interface ChatPanelProps {
  isLoggedIn: boolean;
  currentUser: { name: string; email: string; role: Role };
  currentRole: Role;
  messages: ChatMessage[];
  onSend: (text: string, room: ChatMessage["room"]) => void;
  onRequestLogin: () => void;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { color: string; label: string; icon: React.ElementType }> = {
  Admin:    { color: "var(--primary)",  label: "Admin",    icon: ShieldCheck },
  Waiter:   { color: "#60a5fa",         label: "Waiter",   icon: UserCheck },
  Chef:     { color: "#34d399",         label: "Chef",     icon: ChefHat },
  Customer: { color: "#a78bfa",         label: "Customer", icon: User },
  Guest:    { color: "var(--muted-foreground)", label: "Guest", icon: User },
};

// Rooms visible per role
const ROOMS_FOR_ROLE: Record<Role, { id: ChatMessage["room"]; label: string }[]> = {
  Admin:    [{ id: "general", label: "General" }, { id: "kitchen", label: "Kitchen" }, { id: "support", label: "Support" }],
  Waiter:   [{ id: "general", label: "General" }, { id: "kitchen", label: "Kitchen" }, { id: "support", label: "Support" }],
  Chef:     [{ id: "general", label: "General" }, { id: "kitchen", label: "Kitchen" }],
  Customer: [{ id: "general", label: "General" }, { id: "support", label: "Support" }],
  Guest:    [{ id: "general", label: "General" }, { id: "support", label: "Support" }],
};

function fmtTime(d: Date) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(d: Date) {
  const now = new Date();
  const date = new Date(d);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDay(messages: ChatMessage[]) {
  const groups: { day: string; messages: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const day = fmtDate(msg.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.messages.push(msg);
    else groups.push({ day, messages: [msg] });
  }
  return groups;
}

// ── component ─────────────────────────────────────────────────────────────────

export function ChatPanel({ isLoggedIn, currentUser, currentRole, messages, onSend, onRequestLogin }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ChatMessage["room"]>("general");
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rooms = ROOMS_FOR_ROLE[currentRole];

  const roomMessages = messages.filter(m => m.room === activeRoom);

  // Unread count — messages not from current user since panel last opened
  const [lastOpenedAt, setLastOpenedAt] = useState<Date>(new Date());
  const unread = messages.filter(
    m => new Date(m.timestamp) > lastOpenedAt && m.senderName !== currentUser.name
  ).length;

  useEffect(() => {
    if (open) {
      setLastOpenedAt(new Date());
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (open && !minimised) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomMessages.length, open, minimised]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    if (!isLoggedIn && currentRole === "Guest") {
      onSend(text, activeRoom);
    } else {
      onSend(text, activeRoom);
    }
    setDraft("");
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const c = {
    bg: "var(--background)", card: "var(--card)", muted: "var(--muted)",
    border: "var(--border)", fg: "var(--foreground)", sub: "var(--muted-foreground)",
    primary: "var(--primary)", pFg: "var(--primary-foreground)",
    secondary: "var(--secondary)", sidebar: "var(--sidebar)",
    sans: "var(--font-sans)", serif: "var(--font-serif)", mono: "var(--font-mono)",
  };

  return (
    <>
      {/* ── FLOATING BUTTON ── */}
      <button
        onClick={() => { setOpen(o => !o); setMinimised(false); }}
        className="fixed bottom-6 right-6 z-40 size-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all"
        style={{
          background: open ? c.secondary : c.primary,
          color: open ? c.fg : c.pFg,
          border: `1.5px solid ${open ? c.border : "transparent"}`,
          boxShadow: open ? "none" : "0 8px 28px color-mix(in srgb, var(--primary) 40%, transparent)",
        }}
        aria-label="Open chat">
        {open ? <X className="size-5" /> : <MessageSquare className="size-5" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: "#ef4444", color: "#fff", fontFamily: c.mono }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── PANEL ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            height: minimised ? "auto" : "520px",
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: c.sidebar, borderBottom: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl flex items-center justify-center"
                style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}>
                <MessageSquare className="size-4" style={{ color: c.primary }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ fontFamily: c.serif, color: c.fg }}>Foodখোর Chat</p>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: c.sub, fontFamily: c.mono }}>
                  <Circle className="size-1.5 fill-current text-green-400" style={{ color: "#22c55e" }} />
                  Live
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimised(m => !m)}
                className="p-1.5 rounded-lg transition"
                style={{ color: c.sub }}
                onMouseEnter={e => (e.currentTarget.style.color = c.fg)}
                onMouseLeave={e => (e.currentTarget.style.color = c.sub)}>
                <Minimize2 className="size-4" />
              </button>
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg transition"
                style={{ color: c.sub }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={e => (e.currentTarget.style.color = c.sub)}>
                <X className="size-4" />
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              {/* Room tabs */}
              <div className="flex gap-1 px-3 py-2 shrink-0"
                style={{ borderBottom: `1px solid ${c.border}`, background: c.muted }}>
                {rooms.map(room => (
                  <button key={room.id} onClick={() => setActiveRoom(room.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={activeRoom === room.id
                      ? { background: c.primary, color: c.pFg, fontFamily: c.sans }
                      : { color: c.sub, fontFamily: c.sans }}>
                    {room.label}
                    {/* Unread badge per room */}
                    {messages.filter(m => m.room === room.id && new Date(m.timestamp) > lastOpenedAt && m.senderName !== currentUser.name).length > 0 && (
                      <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold"
                        style={{ background: "#ef4444", color: "#fff", fontFamily: c.mono }}>
                        {messages.filter(m => m.room === room.id && new Date(m.timestamp) > lastOpenedAt && m.senderName !== currentUser.name).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Room label */}
              <div className="px-4 py-1.5 shrink-0"
                style={{ background: c.secondary, borderBottom: `1px solid ${c.border}` }}>
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: c.sub, fontFamily: c.mono }}>
                  {activeRoom === "general" && "Public · All roles"}
                  {activeRoom === "kitchen" && "Kitchen · Waiter & Chef"}
                  {activeRoom === "support" && "Support · Customer assistance"}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
                style={{ background: c.bg }}>
                {roomMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <MessageSquare className="size-10" style={{ color: c.muted }} />
                    <p className="text-sm text-center" style={{ color: c.sub, fontFamily: c.sans }}>
                      No messages yet.<br />Be the first to say something!
                    </p>
                  </div>
                )}

                {groupByDay(roomMessages).map(({ day, messages: dayMsgs }) => (
                  <div key={day} className="flex flex-col gap-2.5">
                    {/* Day divider */}
                    <div className="flex items-center gap-2 my-1">
                      <div className="flex-1 h-px" style={{ background: c.border }} />
                      <span className="text-[10px] px-2 rounded-full"
                        style={{ fontFamily: c.mono, color: c.sub, background: c.muted }}>
                        {day}
                      </span>
                      <div className="flex-1 h-px" style={{ background: c.border }} />
                    </div>

                    {dayMsgs.map((msg, i) => {
                      const isMine = msg.senderName === currentUser.name && (isLoggedIn || currentRole === "Guest");
                      const meta = ROLE_META[msg.senderRole];
                      const Icon = meta.icon;
                      const prevMsg = i > 0 ? dayMsgs[i - 1] : null;
                      const grouped = prevMsg && prevMsg.senderName === msg.senderName;

                      return (
                        <div key={msg.id}
                          className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} ${grouped ? "mt-0.5" : "mt-1"}`}>
                          {/* Avatar — only for first in group */}
                          {!grouped ? (
                            <div className="size-7 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                              style={{ background: `color-mix(in srgb, ${meta.color} 18%, transparent)`, color: meta.color }}>
                              <Icon className="size-3.5" />
                            </div>
                          ) : (
                            <div className="size-7 shrink-0" />
                          )}

                          {/* Bubble */}
                          <div className={`flex flex-col gap-0.5 max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
                            {!grouped && (
                              <div className={`flex items-center gap-1.5 text-[10px] ${isMine ? "flex-row-reverse" : ""}`}>
                                <span className="font-bold" style={{ fontFamily: c.sans, color: meta.color }}>
                                  {msg.senderName}
                                </span>
                                <span style={{ color: c.sub, fontFamily: c.mono }}>{fmtTime(msg.timestamp)}</span>
                              </div>
                            )}
                            <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                              style={isMine
                                ? { background: c.primary, color: c.pFg, fontFamily: c.sans,
                                    borderBottomRightRadius: "6px",
                                    boxShadow: "0 2px 8px color-mix(in srgb, var(--primary) 25%, transparent)" }
                                : { background: c.card, color: c.fg, fontFamily: c.sans,
                                    border: `1px solid ${c.border}`, borderBottomLeftRadius: "6px" }}>
                              {msg.text}
                            </div>
                            {grouped && (
                              <span className="text-[9px] px-1" style={{ color: c.sub, fontFamily: c.mono }}>
                                {fmtTime(msg.timestamp)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 shrink-0"
                style={{ borderTop: `1px solid ${c.border}`, background: c.card }}>
                {currentRole === "Guest" && !isLoggedIn ? (
                  <div className="flex flex-col gap-2">
                    <input
                      ref={inputRef}
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="Message as Guest…"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: c.muted, border: `1px solid ${c.border}`, color: c.fg, fontFamily: c.sans }}
                      onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={e => (e.target.style.borderColor = c.border)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRequestLogin()}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: c.primary, color: c.pFg, fontFamily: c.sans }}>
                        Sign In for full chat
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={!draft.trim()}
                        className="px-3 py-2 rounded-xl"
                        style={draft.trim()
                          ? { background: c.secondary, color: c.fg, border: `1px solid ${c.border}` }
                          : { background: c.muted, color: c.sub, opacity: 0.5 }}>
                        <Send className="size-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: c.muted, border: `1px solid ${c.border}` }}
                      onFocus={() => {}}
                      onClick={() => inputRef.current?.focus()}>
                      <input
                        ref={inputRef}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder={`Message ${activeRoom === "support" ? "support" : activeRoom === "kitchen" ? "kitchen" : "everyone"}…`}
                        className="flex-1 bg-transparent outline-none text-sm"
                        style={{ color: c.fg, fontFamily: c.sans }}
                      />
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={!draft.trim()}
                      className="size-10 rounded-xl flex items-center justify-center shrink-0 transition"
                      style={draft.trim()
                        ? { background: c.primary, color: c.pFg, boxShadow: "0 4px 12px color-mix(in srgb, var(--primary) 30%, transparent)" }
                        : { background: c.secondary, color: c.sub, opacity: 0.5, cursor: "not-allowed" }}>
                      <Send className="size-4" />
                    </button>
                  </div>
                )}

                {/* Identity indicator */}
                <div className="flex items-center gap-1.5 mt-2 px-1">
                  <div className="size-1.5 rounded-full" style={{ background: ROLE_META[currentRole].color }} />
                  <span className="text-[10px]" style={{ color: c.sub, fontFamily: c.mono }}>
                    Chatting as <span style={{ color: ROLE_META[currentRole].color }}>{currentUser.name}</span>
                    {" · "}{ROLE_META[currentRole].label}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
