import { readFileSync, writeFileSync } from "fs";

const filePath = "/home/ubuntu/bmodern-tender-portal/client/src/pages/portal/ClientPortal.tsx";
let content = readFileSync(filePath, "utf8");

const TC_GATE_COMPONENT = `
// ─── T&C Gate Screen ──────────────────────────────────────────────────────────
function TcGateScreen({
  token,
  onAccepted,
}: {
  token: string;
  onAccepted: () => void;
}) {
  const { data: terms, isLoading } = trpc.portal.getTerms.useQuery({ token });
  const acknowledgeMutation = trpc.portal.acknowledgeTerms.useMutation({
    onSuccess: onAccepted,
    onError: (e) => toast.error(e.message),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  // If no T&Cs are set, skip the gate
  useEffect(() => {
    if (!isLoading && (!terms || !terms.content)) {
      onAccepted();
    }
  }, [isLoading, terms, onAccepted]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bm-cream)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--bm-petrol)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!terms || !terms.content) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--bm-cream)" }}>
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={LOGO_URL}
            alt="B Modern Homes"
            className="h-8 mx-auto mb-4 object-contain"
            style={{ filter: "brightness(0) saturate(100%) invert(18%) sepia(28%) saturate(700%) hue-rotate(162deg) brightness(95%) contrast(95%)" }}
          />
          <div className="flex items-center justify-center gap-2 mb-2">
            <ScrollText size={20} style={{ color: "var(--bm-petrol)" }} />
            <h1 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
              Terms & Conditions
            </h1>
          </div>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            Please read and accept the terms before viewing your proposal.
          </p>
        </div>

        {/* T&C content */}
        <div
          className="bg-white rounded-xl border shadow-sm mb-6 overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="p-6 overflow-y-auto text-sm leading-relaxed"
            style={{ maxHeight: "380px", fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)", whiteSpace: "pre-wrap" }}
          >
            {terms.content}
          </div>
          {!scrolledToBottom && (
            <div className="px-6 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex items-center gap-1.5" style={{ fontFamily: "Lato, sans-serif" }}>
              <ChevronDown size={13} />
              Scroll to read the full terms
            </div>
          )}
        </div>

        {/* Checkbox + Accept */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              className={\`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors \${checked ? "border-[var(--bm-petrol)] bg-[var(--bm-petrol)]" : "border-gray-300 group-hover:border-[var(--bm-petrol)]"}\`}
              onClick={() => setChecked(!checked)}
            >
              {checked && <Check size={12} className="text-white" />}
            </div>
            <span className="text-sm" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)", lineHeight: "1.6" }}>
              I have read and agree to the Terms & Conditions set out above. I understand this proposal is subject to these terms.
            </span>
          </label>

          <Button
            className="w-full h-11 text-sm font-medium tracking-wide"
            style={{ background: checked ? "var(--bm-petrol)" : undefined, fontFamily: "Lato, sans-serif" }}
            disabled={!checked || acknowledgeMutation.isPending}
            onClick={() => acknowledgeMutation.mutate({ token })}
          >
            {acknowledgeMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-2" />
                Accept & View Proposal
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

`;

// Insert before PackageSelectionScreen
const marker = "// ─── Package Selection Screen (Pricing Engine) ─────────────────────────────────";
if (!content.includes(marker)) {
  console.error("Marker not found!");
  process.exit(1);
}

content = content.replace(marker, TC_GATE_COMPONENT + marker);
writeFileSync(filePath, content, "utf8");
console.log("TcGateScreen inserted successfully.");
