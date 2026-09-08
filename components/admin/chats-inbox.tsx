"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, RefreshCw, CheckCheck, User,
  Send, Loader2, ArrowLeft, Circle, Clock,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type ConversationMeta = {
  nickname: string;
  email: string | null;
  avatar: string | null;
  city?: string;
  country?: string;
};

type Conversation = {
  session_id: string;
  status: number;
  state: "pending" | "unresolved" | "resolved";
  created_at: number;
  updated_at: number;
  last_message: string;
  meta: ConversationMeta;
  unread: { operator: number; visitor: number };
};

type Message = {
  session_id: string;
  type: string;
  content: string;
  from: "user" | "operator";
  timestamp: number;
  user: {
    nickname: string;
    avatar: string | null;
    type: "visitor" | "operator";
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATE_STYLE: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  unresolved: "bg-blue-100 text-blue-700",
  resolved:   "bg-[#f0f2f5] text-[#9ca3af]",
};

// ── Conversation list item ─────────────────────────────────────────────────────

function ConvItem({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full border-b border-[#f0f2f5] px-4 py-3.5 text-left transition last:border-0",
        active ? "bg-[#fff3ee]" : "hover:bg-[#fafafa]",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] text-[#5c5e62]">
            <User size={16} strokeWidth={1.8} />
          </div>
          {conv.unread.operator > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f4511e] text-[0.6rem] font-bold text-white">
              {conv.unread.operator}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-[0.83rem] font-semibold text-[#1a1a1a]">
              {conv.meta.nickname || "Visitor"}
            </p>
            <span className="shrink-0 text-[0.7rem] text-[#9ca3af]">
              {timeAgo(conv.updated_at)}
            </span>
          </div>
          {conv.meta.email && (
            <p className="truncate text-[0.72rem] text-[#9ca3af]">{conv.meta.email}</p>
          )}
          <p className="mt-0.5 truncate text-[0.78rem] text-[#5c5e62]">
            {conv.last_message || "—"}
          </p>
          <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] ${STATE_STYLE[conv.state] ?? STATE_STYLE.unresolved}`}>
            {conv.state}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isOperator = msg.from === "operator";
  return (
    <div className={`flex gap-2 ${isOperator ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold text-white ${isOperator ? "bg-[#f4511e]" : "bg-[#5c5e62]"}`}>
        {isOperator ? "A" : (msg.user.nickname?.[0] ?? "V").toUpperCase()}
      </div>
      <div className={`max-w-[72%] ${isOperator ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        <div className={`rounded-xl px-4 py-2.5 text-[0.85rem] leading-relaxed ${
          isOperator
            ? "rounded-tr-sm bg-[#f4511e] text-white"
            : "rounded-tl-sm bg-[#f0f2f5] text-[#1a1a1a]"
        }`}>
          {msg.content}
        </div>
        <span className="px-1 text-[0.68rem] text-[#9ca3af]">
          {fmtTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ── Main inbox ────────────────────────────────────────────────────────────────

export default function ChatsInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId,      setActiveId]      = useState<string | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [reply,         setReply]         = useState("");
  const [loadingConvs,  setLoadingConvs]  = useState(true);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const [sending,       setSending]       = useState(false);
  const [resolving,     setResolving]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [msgError,      setMsgError]      = useState<string | null>(null);
  const [mobileView,    setMobileView]    = useState<"list" | "thread">("list");

  const threadRef  = useRef<HTMLDivElement>(null);
  const replyRef   = useRef<HTMLTextAreaElement>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeConv = conversations.find((c) => c.session_id === activeId) ?? null;

  // ── Fetch conversations ─────────────────────────────────────────────────────

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/crisp?action=conversations&page=1");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const diagnostic =
          res.status === 404
            ? `404 — Crisp returned "not found" for the conversations endpoint. This usually means your CRISP_WEBSITE_ID is incorrect or the workspace has no conversations. Check your environment variables.`
            : res.status === 503
            ? `503 — Crisp credentials not configured on the server. Add NEXT_PUBLIC_CRISP_WEBSITE_ID, CRISP_IDENTIFIER and CRISP_KEY to the server environment variables, then restart.`
            : res.status === 401
            ? `401 — Admin session expired. Please log out and log back in.`
            : res.status === 502
            ? `502 — Could not reach the Crisp API. Verify your CRISP_IDENTIFIER and CRISP_KEY are correct.`
            : `HTTP ${res.status} — ${json.error ?? "Unexpected error from Crisp proxy."}`;
        setError(diagnostic);
        return;
      }
      const list: Conversation[] = Array.isArray(json.data) ? json.data : [];
      setConversations(list);
    } catch (err) {
      setError(`Network error — could not reach /api/admin/crisp. Detail: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // ── Fetch messages ──────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (sessionId: string, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    setMsgError(null);
    try {
      const res  = await fetch(`/api/admin/crisp?action=messages&session_id=${sessionId}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsgError(json.error ?? "Failed to load messages.");
        return;
      }
      setMessages(Array.isArray(json.data) ? json.data : []);
    } catch {
      setMsgError("Could not load messages.");
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // ── Auto-refresh every 30s ──────────────────────────────────────────────────

  useEffect(() => {
    fetchConversations();
    refreshTimer.current = setInterval(() => {
      fetchConversations(true);
      if (activeId) fetchMessages(activeId, true);
    }, 30000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [fetchConversations, fetchMessages, activeId]);

  // ── Scroll thread to bottom on new messages ──────────────────────────────────

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Open conversation ───────────────────────────────────────────────────────

  const openConversation = (sessionId: string) => {
    setActiveId(sessionId);
    setMessages([]);
    setMobileView("thread");
    fetchMessages(sessionId);
  };

  // ── Send reply ──────────────────────────────────────────────────────────────

  const sendReply = async () => {
    if (!reply.trim() || !activeId || sending) return;
    setSending(true);
    setMsgError(null);
    try {
      const res = await fetch("/api/admin/crisp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", session_id: activeId, content: reply.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setMsgError(json.error ?? "Failed to send."); return; }
      setReply("");
      await fetchMessages(activeId, true);
    } catch {
      setMsgError("Network error. Reply not sent.");
    } finally {
      setSending(false);
      replyRef.current?.focus();
    }
  };

  // ── Resolve conversation ────────────────────────────────────────────────────

  const resolveConversation = async () => {
    if (!activeId || resolving) return;
    setResolving(true);
    setMsgError(null);
    try {
      const res  = await fetch("/api/admin/crisp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", session_id: activeId }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsgError(json.error ?? `Could not resolve conversation (HTTP ${res.status})`);
        return;
      }

      // Optimistic update — flip state immediately so the UI responds at once
      setConversations(prev =>
        prev.map(c =>
          c.session_id === activeId ? { ...c, state: "resolved" as const } : c
        )
      );

      // Confirm with a fresh list from Crisp
      await fetchConversations(true);
    } catch {
      setMsgError("Network error — could not resolve conversation.");
    } finally {
      setResolving(false);
    }
  };

  // ── Handle Enter to send ────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const unreadTotal = conversations.reduce((n, c) => n + c.unread.operator, 0);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">

      {/* ── Conversation list ── */}
      <div className={[
        "flex w-full flex-col border-r border-[#f0f2f5] bg-white lg:w-[320px] lg:flex-none",
        mobileView === "thread" ? "hidden lg:flex" : "flex",
      ].join(" ")}>

        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#f0f2f5] px-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} strokeWidth={1.8} className="text-[#5c5e62]" />
            <span className="text-[0.875rem] font-bold text-[#1a1a1a]">Conversations</span>
            {unreadTotal > 0 && (
              <span className="rounded-full bg-[#f4511e] px-2 py-0.5 text-[0.68rem] font-bold text-white">
                {unreadTotal}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fetchConversations()}
            title="Refresh"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]"
          >
            <RefreshCw size={14} className={loadingConvs ? "animate-spin" : ""} />
          </button>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingConvs && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-[#9ca3af]">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-[0.8rem]">Loading conversations…</span>
            </div>
          ) : error ? (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
              <p className="mb-1 text-[0.78rem] font-bold uppercase tracking-wide text-red-700">Diagnostic Error</p>
              <p className="text-[0.8rem] leading-6 text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => fetchConversations()}
                className="mt-3 rounded-lg bg-red-100 px-3 py-1.5 text-[0.75rem] font-semibold text-red-700 transition hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-[#9ca3af]">
              <MessageSquare size={24} strokeWidth={1.4} />
              <p className="text-[0.83rem]">No conversations yet.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConvItem
                key={conv.session_id}
                conv={conv}
                active={conv.session_id === activeId}
                onClick={() => openConversation(conv.session_id)}
              />
            ))
          )}
        </div>

        {/* Auto-refresh note */}
        <div className="shrink-0 border-t border-[#f0f2f5] px-4 py-2">
          <p className="flex items-center gap-1.5 text-[0.7rem] text-[#9ca3af]">
            <Circle size={6} className="fill-green-400 text-green-400" />
            Auto-refreshes every 30 seconds
          </p>
        </div>
      </div>

      {/* ── Message thread ── */}
      <div className={[
        "min-w-0 flex-1 flex-col bg-[#fafafa]",
        mobileView === "thread" ? "flex" : "hidden lg:flex",
      ].join(" ")}>

        {!activeConv ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[#9ca3af]">
            <MessageSquare size={36} strokeWidth={1.2} />
            <p className="text-[0.9rem] font-medium">Select a conversation to view messages</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#f0f2f5] bg-white px-4">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f0f2f5] lg:hidden"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5]">
                <User size={14} strokeWidth={1.8} className="text-[#5c5e62]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.875rem] font-semibold text-[#1a1a1a]">
                  {activeConv.meta.nickname || "Visitor"}
                </p>
                {activeConv.meta.email && (
                  <p className="truncate text-[0.72rem] text-[#9ca3af]">{activeConv.meta.email}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] ${STATE_STYLE[activeConv.state] ?? STATE_STYLE.unresolved}`}>
                  {activeConv.state}
                </span>
                {activeConv.state !== "resolved" && (
                  <button
                    type="button"
                    onClick={resolveConversation}
                    disabled={resolving}
                    title="Mark as resolved"
                    className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-50"
                  >
                    {resolving
                      ? <Loader2 size={12} className="animate-spin" />
                      : <CheckCheck size={12} />}
                    Resolve
                  </button>
                )}
                <span className="text-[0.72rem] text-[#9ca3af]">
                  {fmtDate(activeConv.created_at)}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-[#9ca3af]" />
                </div>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-[0.83rem] text-[#9ca3af]">No messages yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg, i) => (
                    msg.type === "text" && msg.content
                      ? <Bubble key={i} msg={msg} />
                      : null
                  ))}
                </div>
              )}
              {msgError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[0.8rem] text-red-600">{msgError}</p>
              )}
            </div>

            {/* Reply box */}
            <div className="shrink-0 border-t border-[#f0f2f5] bg-white p-4">
              <div className="flex items-end gap-3">
                <textarea
                  ref={replyRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply… (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  className="min-h-[48px] flex-1 resize-none rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#f4511e] focus:bg-white focus:ring-2 focus:ring-[#f4511e]/10"
                />
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4511e] text-white transition hover:bg-[#d94f14] disabled:opacity-40"
                >
                  {sending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} strokeWidth={2} />}
                </button>
              </div>
              <p className="mt-1.5 text-[0.7rem] text-[#9ca3af]">
                Your replies appear in the visitor&apos;s Crisp chat window in real time.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
