import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2, X, ChevronDown } from "lucide-react";

type Message = {
  id: number;
  projectId: number;
  senderType: string;
  senderName: string;
  message: string;
  createdAt: Date | string;
};

// ─── Chat Panel (shared between admin and client) ────────────────────────────
function ChatPanel({
  messages,
  isLoading,
  onSend,
  isSending,
  senderType,
  senderLabel,
}: {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
  isSending: boolean;
  senderType: "admin" | "client";
  senderLabel: string;
}) {
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 200, maxHeight: 400 }}>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle size={28} className="mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Start a conversation about this project</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderType === senderType;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${
                  isMe
                    ? "rounded-br-sm text-white"
                    : "rounded-bl-sm border"
                }`}
                style={{
                  background: isMe ? "var(--bm-petrol)" : "var(--card)",
                  borderColor: isMe ? undefined : "var(--border)",
                }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: isMe ? "rgba(255,255,255,0.7)" : "var(--bm-petrol)",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    {msg.senderName}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: isMe ? "rgba(255,255,255,0.5)" : "var(--muted-foreground)" }}
                  >
                    {new Date(msg.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    color: isMe ? "#fff" : "var(--foreground)",
                    fontFamily: "Lato, sans-serif",
                  }}
                >
                  {msg.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <div className="border-t p-3 flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message as ${senderLabel}...`}
          className="flex-1 h-9 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isSending}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="h-9 w-9 p-0 text-white shrink-0"
          style={{ background: "var(--bm-petrol)" }}
        >
          {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </Button>
      </div>
    </div>
  );
}

// ─── Admin Chat (uses chat.sendMessage + chat.listMessages) ──────────────────
export function AdminProjectChat({ projectId }: { projectId: number }) {
  const { data: messages, isLoading } = trpc.chat.listMessages.useQuery(
    { projectId },
    { refetchInterval: 5000 }
  );
  const utils = trpc.useUtils();
  const sendMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => utils.chat.listMessages.invalidate({ projectId }),
    onError: (e) => toast.error("Failed to send: " + e.message),
  });

  return (
    <ChatPanel
      messages={(messages as Message[]) ?? []}
      isLoading={isLoading}
      onSend={(text) => sendMutation.mutate({ projectId, message: text })}
      isSending={sendMutation.isPending}
      senderType="admin"
      senderLabel="B Modern Team"
    />
  );
}

// ─── Client Chat (uses portal.listMessages + portal.sendMessage) ─────────────
export function ClientProjectChat({ token }: { token: string }) {
  const { data: messages, isLoading } = trpc.portal.listMessages.useQuery(
    { token },
    { refetchInterval: 5000 }
  );
  const utils = trpc.useUtils();
  const sendMutation = trpc.portal.sendMessage.useMutation({
    onSuccess: () => utils.portal.listMessages.invalidate({ token }),
    onError: (e) => toast.error("Failed to send: " + e.message),
  });

  return (
    <ChatPanel
      messages={(messages as Message[]) ?? []}
      isLoading={isLoading}
      onSend={(text) => sendMutation.mutate({ token, message: text })}
      isSending={sendMutation.isPending}
      senderType="client"
      senderLabel="You"
    />
  );
}

// ─── Floating Chat Button + Drawer (for client portal) ──────────────────────
export function FloatingChatButton({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const { data: messages } = trpc.portal.listMessages.useQuery(
    { token },
    { refetchInterval: 10000 }
  );

  const unreadCount = 0; // Could track last-seen message ID for real unread count

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: "var(--bm-petrol)" }}
      >
        <MessageCircle size={22} className="text-white" />
        {(messages?.length ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {messages?.length ?? 0}
          </span>
        )}
      </button>

      {/* Chat drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div
            className="relative w-full sm:w-96 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              maxHeight: "80vh",
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: "var(--bm-petrol)" }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-white/70" />
                <span className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                  Chat with B Modern
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat content */}
            <ClientProjectChat token={token} />
          </div>
        </div>
      )}
    </>
  );
}
