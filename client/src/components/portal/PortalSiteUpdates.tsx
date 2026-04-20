import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Camera, MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PortalSiteUpdates({ projectId }: { projectId: number }) {
  const { data: updates, isLoading } = trpc.siteUpdates.list.useQuery({ projectId });
  const utils = trpc.useUtils();
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const commentMut = trpc.siteUpdates.addComment.useMutation({
    onSuccess: () => { utils.siteUpdates.list.invalidate({ projectId }); },
    onError: (e) => toast.error(e.message),
  });
  const handleComment = (updateId: number) => {
    const text = commentText[updateId]?.trim();
    if (!text) return;
    commentMut.mutate({ siteUpdateId: updateId, authorName: "Client", authorType: "client", comment: text });
    setCommentText(prev => ({ ...prev, [updateId]: "" }));
  };
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!updates?.length) return (
    <div className="text-center py-16">
      <Camera size={40} className="mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No site updates yet</p>
      <p className="text-xs text-muted-foreground mt-1">Your builder will post progress photos and updates here</p>
    </div>
  );
  return (
    <div className="space-y-4 max-w-3xl">
      {updates.map((u: any) => (
        <div key={u.id} className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#e5e5e3" }}>
          {u.photos?.length > 0 && (
            <div className={`grid gap-1 ${u.photos.length === 1 ? "grid-cols-1" : u.photos.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {u.photos.map((p: any) => (<img key={p.id} src={p.imageUrl} alt={p.caption || ""} className="w-full h-48 object-cover" />))}
            </div>
          )}
          <div className="p-4">
            <h3 className="text-sm font-semibold" style={{ color: "#1a2b3c" }}>{u.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
              {u.stage && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{u.stage}</span>}
            </div>
            {u.description && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{u.description}</p>}
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "#e5e5e3" }}>
              <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <MessageSquare size={12} /> {u.comments?.length || 0} comment{u.comments?.length !== 1 ? "s" : ""}
              </button>
              {expandedId === u.id && (
                <div className="mt-2 space-y-2">
                  {u.comments?.map((c: any) => (
                    <div key={c.id} className={`text-xs p-2 rounded ${c.authorType === "admin" ? "bg-blue-50" : "bg-gray-50"}`}>
                      <span className="font-medium">{c.authorName}</span>
                      <span className="text-muted-foreground ml-1">{new Date(c.createdAt).toLocaleDateString("en-AU")}</span>
                      <p className="mt-0.5">{c.comment}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input value={commentText[u.id] || ""} onChange={e => setCommentText(prev => ({ ...prev, [u.id]: e.target.value }))}
                      placeholder="Add a comment..." className="text-xs h-8" onKeyDown={e => e.key === "Enter" && handleComment(u.id)} />
                    <Button size="sm" className="h-8 px-2" onClick={() => handleComment(u.id)} disabled={commentMut.isPending} style={{ background: "#1a2b3c" }}>
                      <Send size={12} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
