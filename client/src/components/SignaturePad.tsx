import { useRef, useEffect, useCallback, useState } from "react";
import SignaturePadLib from "signature_pad";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({ onSignatureChange, width = 500, height = 200 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI displays
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(ratio, ratio);

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "#203E4A",
      minWidth: 1.5,
      maxWidth: 3,
    });

    pad.addEventListener("endStroke", () => {
      setIsEmpty(pad.isEmpty());
      onSignatureChange(pad.isEmpty() ? null : pad.toDataURL("image/png"));
    });

    padRef.current = pad;

    return () => {
      pad.off();
    };
  }, [onSignatureChange]);

  const handleClear = useCallback(() => {
    padRef.current?.clear();
    setIsEmpty(true);
    onSignatureChange(null);
  }, [onSignatureChange]);

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-[#203E4A]/20 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: `${height}px`, touchAction: "none" }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[#6D7E94]/40 font-['Lato'] text-sm">Sign here</p>
          </div>
        )}
        <div className="absolute bottom-3 left-4 right-4 border-b border-[#203E4A]/15" />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-xs text-[#6D7E94] hover:text-[#203E4A] font-['Lato']"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Clear Signature
        </Button>
      </div>
    </div>
  );
}
