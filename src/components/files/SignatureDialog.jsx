import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pen, Type, Upload, Trash2, Check, Droplets } from "lucide-react";

const SIGNATURE_FONTS = [
  { label: "Cursive", value: "cursive" },
  { label: "Script", value: "'Dancing Script', cursive" },
  { label: "Formal", value: "'Great Vibes', cursive" },
  { label: "Simple", value: "Georgia, serif" },
];

const COLORS = ["#000000", "#1a237e", "#1b5e20", "#b71c1c"];

export default function SignatureDialog({ open, onOpenChange, onApply }) {
  const [tab, setTab] = useState("draw");
  const [color, setColor] = useState("#000000");
  const [wetFilter, setWetFilter] = useState(false);

  // Draw tab
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(2);
  const lastPos = useRef(null);

  // Type tab
  const [typedName, setTypedName] = useState("");
  const [fontChoice, setFontChoice] = useState(SIGNATURE_FONTS[0].value);

  // Upload tab
  const [uploadedSrc, setUploadedSrc] = useState(null);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  }, []);

  useEffect(() => {
    if (open && tab === "draw") {
      setTimeout(() => clearCanvas(), 50);
    }
  }, [open, tab, clearCanvas]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    setDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Pen-like pressure variation based on speed
    const speed = Math.sqrt(
      Math.pow(pos.x - lastPos.current.x, 2) + Math.pow(pos.y - lastPos.current.y, 2)
    );
    ctx.lineWidth = Math.max(brushSize * 0.5, brushSize * (1 - speed / 80));
    ctx.stroke();

    lastPos.current = pos;
    setHasDrawing(true);
  };

  const endDraw = () => setDrawing(false);

  const applyWetFilter = (srcCanvas) => {
    const out = document.createElement("canvas");
    out.width = srcCanvas.width;
    out.height = srcCanvas.height;
    const ctx = out.getContext("2d");
    ctx.drawImage(srcCanvas, 0, 0);
    const imageData = ctx.getImageData(0, 0, out.width, out.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 10) {
        // Slight blue shift and variable opacity — wet ink look
        d[i] = Math.max(0, d[i] - 20);
        d[i + 2] = Math.min(255, d[i + 2] + 30);
        d[i + 3] = Math.min(255, d[i + 3] * (0.7 + Math.random() * 0.3));
      }
    }
    ctx.putImageData(imageData, 0, 0);
    // Slight blur for ink spread
    ctx.filter = "blur(0.4px)";
    ctx.drawImage(out, 0, 0);
    return out;
  };

  const getDrawnDataUrl = () => {
    const canvas = canvasRef.current;
    if (wetFilter) return applyWetFilter(canvas).toDataURL("image/png");
    return canvas.toDataURL("image/png");
  };

  const getTypedDataUrl = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    ctx.font = `56px ${fontChoice}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, 12, 64);
    if (wetFilter) return applyWetFilter(canvas).toDataURL("image/png");
    return canvas.toDataURL("image/png");
  };

  const handleApply = () => {
    let dataUrl = null;
    if (tab === "draw" && hasDrawing) dataUrl = getDrawnDataUrl();
    else if (tab === "type" && typedName.trim()) dataUrl = getTypedDataUrl();
    else if (tab === "upload" && uploadedSrc) {
      if (wetFilter) {
        const img = new window.Image();
        img.onload = () => {
          const tmp = document.createElement("canvas");
          tmp.width = img.width; tmp.height = img.height;
          tmp.getContext("2d").drawImage(img, 0, 0);
          onApply(applyWetFilter(tmp).toDataURL("image/png"));
        };
        img.src = uploadedSrc;
        onOpenChange(false);
        return;
      }
      dataUrl = uploadedSrc;
    }
    if (dataUrl) {
      onApply(dataUrl);
      onOpenChange(false);
    }
  };

  const canApply =
    (tab === "draw" && hasDrawing) ||
    (tab === "type" && typedName.trim().length > 0) ||
    (tab === "upload" && uploadedSrc);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pen className="h-4 w-4" /> Add Signature
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-1">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="draw" className="gap-1.5"><Pen className="h-3.5 w-3.5" /> Draw</TabsTrigger>
            <TabsTrigger value="type" className="gap-1.5"><Type className="h-3.5 w-3.5" /> Type</TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload</TabsTrigger>
          </TabsList>

          {/* Draw Tab */}
          <TabsContent value="draw" className="space-y-3 mt-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-primary" : "border-border"}`}
                    style={{ background: c }} />
                ))}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="h-6 w-6 rounded cursor-pointer border border-border" />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Label className="text-xs text-muted-foreground">Size</Label>
                {[1, 2, 3, 4].map((s) => (
                  <button key={s} onClick={() => setBrushSize(s)}
                    className={`h-6 w-6 rounded border flex items-center justify-center text-xs transition-colors ${brushSize === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-2 border-dashed border-border rounded-xl bg-white overflow-hidden relative" style={{ height: 140 }}>
              <canvas ref={canvasRef} width={460} height={132}
                className="w-full h-full cursor-crosshair"
                style={{ touchAction: "none" }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
              {!hasDrawing && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="text-muted-foreground/50 text-sm select-none">Sign here</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clearCanvas}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </TabsContent>

          {/* Type Tab */}
          <TabsContent value="type" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label>Your name</Label>
              <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Sign your name..." className="text-base" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SIGNATURE_FONTS.map((f) => (
                <button key={f.value} onClick={() => setFontChoice(f.value)}
                  className={`border rounded-lg p-3 text-left transition-colors ${fontChoice === f.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                  <span className="text-xs text-muted-foreground block mb-1">{f.label}</span>
                  <span style={{ fontFamily: f.value, fontSize: 24, color }} className="leading-none block truncate">
                    {typedName || "Preview"}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-primary" : "border-border"}`}
                  style={{ background: c }} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="h-6 w-6 rounded cursor-pointer border border-border" />
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-3 mt-3">
            {uploadedSrc ? (
              <div className="space-y-2">
                <div className="border rounded-xl bg-white p-4 flex items-center justify-center" style={{ minHeight: 120 }}>
                  <img src={uploadedSrc} alt="Signature" className="max-h-28 max-w-full object-contain" />
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setUploadedSrc(null)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setUploadedSrc(ev.target.result);
                    reader.readAsDataURL(f);
                  }} />
                <div className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/40 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Upload signature image</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG with transparent background works best</p>
                </div>
              </label>
            )}
          </TabsContent>
        </Tabs>

        {/* Wet filter toggle */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setWetFilter((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${wetFilter ? "bg-blue-50 border-blue-300 text-blue-700" : "border-border text-muted-foreground hover:bg-muted"}`}>
            <Droplets className="h-3.5 w-3.5" />
            Wet Signature Filter
          </button>
          <span className="text-xs text-muted-foreground">Adds natural ink variation</span>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canApply} onClick={handleApply} className="gap-2">
            <Check className="h-4 w-4" /> Apply Signature
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}