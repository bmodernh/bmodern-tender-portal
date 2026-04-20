import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortalMessages({ projectId }: { projectId: number }) {
  const { data: messages, isLoading } = trpc.chat.listMessages.useQuery({ projectId });
  const utils = trpc.useUtils();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMut = trpc.chat.sendMessage.useMutation({
    onSuccess: () => { utils.chat.listMessages.invalidate({ projectId }); setText(""); },
    onError: (e: any) => toast.error(e.message),
  });
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const handleSend = () => { const t = text.trim(); if (!t) return; sendMut.mutate({ projectId, message: t }); };
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="max-w-2xl flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {!messages?.length ? (
          <div className="text-center py-16"><MessageSquare size={40} className="mx-auto mb-3 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No messages yet</p><p className="text-xs text-muted-foreground mt-1">Start a conversation with your builder</p></div>
        ) : messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.senderType === "client" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-lg px-3 py-2 ${m.senderType === "client" ? "text-white" : "bg-white border"}`} style={m.senderType === "client" ? { background: "#1a2b3c" } : { borderColor: "#e5e5e3" }}>
              <p className="text-[10px] font-medium mb-0.5" style={{ opacity: 0.7 }}>{m.senderName}</p>
              <p className="text-sm whitespace-pre-wrap">{m.message}</p>
              <p className="text-[9px] mt-1" style={{ opacity: 0.5 }}>{new Date(m.createdAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
            </div></div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "#e5e5e3" }}>
        <input className="flex-1 border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e5e3" }} value={text} onChange={e => setText(e.target.value)}
          placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())} />
        <Button onClick={handleSend} disabled={sendMut.isPending || !text.trim()} style={{ background: "#1a2b3c" }}><Send size={16} /></Button>
      </div>
    </div>
  );
}
