import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Upload, Download, Save, Pen, Eraser, Type, Square,
  Circle, Minus, Undo, Redo, Trash2, Loader2, ImageIcon, FileText, ZoomIn, ZoomOut, RotateCw
} from "lucide-react";
import { getFileExtension, getFileTypeStyle, CATEGORIES, ACCESS_LEVELS } from "@/lib/fileHelpers";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"];
const COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ffffff"];
const SIZES = [2, 4, 8, 14, 20];

export default function FileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get("id");

  // Source selection
  const [mode, setMode] = useState(fileId ? "loading" : "select"); // select | loading | editing
  const [sourceFile, setSourceFile] = useState(null); // loaded file metadata

  // Canvas state
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imageRef = useRef(null);

  // Save state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveCategory, setSaveCategory] = useState("general");
  const [saveAccess, setSaveAccess] = useState("personal");
  const [saving, setSaving] = useState(false);

  // Load file from vault
  const { data: vaultFile, isLoading: vaultLoading } = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => base44.entities.File.filter({ id: fileId }).then((r) => r[0]),
    enabled: !!fileId,
  });

  const { data: allFiles = [] } = useQuery({
    queryKey: ["files"],
    queryFn: () => base44.entities.File.list("-created_date", 500),
    enabled: mode === "select",
  });

  const imageFiles = allFiles.filter((f) => IMAGE_EXTS.includes(getFileExtension(f.original_name)));

  useEffect(() => {
    if (vaultFile && mode === "loading") {
      loadImageFromUrl(vaultFile.file_url, vaultFile);
    }
  }, [vaultFile, mode]);

  const initCanvas = useCallback((img, fileMeta) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    setCtx(context);
    saveToHistory(context, canvas);
    setSourceFile(fileMeta);
    setSaveName((fileMeta?.display_name || fileMeta?.original_name || "edited-image") + " (edited)");
    setSaveCategory(fileMeta?.category || "general");
    setMode("editing");
  }, []);

  const loadImageFromUrl = useCallback((url, fileMeta) => {
    setMode("loading");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imageRef.current = img; initCanvas(img, fileMeta); };
    img.onerror = () => { toast.error("Could not load image. Try downloading and uploading locally."); setMode("select"); };
    img.src = url;
  }, [initCanvas]);

  const loadLocalFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Only image files can be edited. For PDFs, use the annotation tools."); return; }
    const url = URL.createObjectURL(f);
    loadImageFromUrl(url, { original_name: f.name, display_name: f.name.replace(/\.[^/.]+$/, ""), category: "general" });
  };

  const saveToHistory = (context, canvas) => {
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const newH = prev.slice(0, historyIndex + 1);
      newH.push(data);
      setHistoryIndex(newH.length - 1);
      return newH;
    });
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    ctx.putImageData(history[newIdx], 0, 0);
    setHistoryIndex(newIdx);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    ctx.putImageData(history[newIdx], 0, 0);
    setHistoryIndex(newIdx);
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    if (imageRef.current) ctx.drawImage(imageRef.current, 0, 0);
    else ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveToHistory(ctx, canvasRef.current);
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const onMouseDown = (e) => {
    if (!ctx) return;
    const pos = getPos(e);
    setDrawing(true);
    setStartPos(pos);

    if (tool === "text") {
      setTextPos(pos);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const onMouseMove = (e) => {
    if (!drawing || !ctx) return;
    const pos = getPos(e);

    if (tool === "pen" || tool === "eraser") {
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const onMouseUp = (e) => {
    if (!drawing || !ctx || !canvasRef.current) return;
    setDrawing(false);
    ctx.globalCompositeOperation = "source-over";

    if (tool === "rect") {
      const pos = getPos(e);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    } else if (tool === "circle") {
      const pos = getPos(e);
      const rx = Math.abs(pos.x - startPos.x) / 2;
      const ry = Math.abs(pos.y - startPos.y) / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.ellipse(startPos.x + (pos.x - startPos.x) / 2, startPos.y + (pos.y - startPos.y) / 2, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === "line") {
      const pos = getPos(e);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    saveToHistory(ctx, canvasRef.current);
  };

  const addText = () => {
    if (!ctx || !textInput || !textPos) return;
    ctx.fillStyle = color;
    ctx.font = `${size * 4 + 12}px Inter, sans-serif`;
    ctx.fillText(textInput, textPos.x, textPos.y);
    saveToHistory(ctx, canvasRef.current);
    setTextInput("");
    setTextPos(null);
  };

  const rotateImage = () => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.height;
    tempCanvas.height = canvas.width;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate(Math.PI / 2);
    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
    saveToHistory(ctx, canvas);
  };

  const downloadEdited = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = (saveName || "edited-image") + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const saveToVault = async () => {
    setSaving(true);
    const canvas = canvasRef.current;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], `${saveName || "edited-image"}.png`, { type: "image/png" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.File.create({
      original_name: file.name,
      display_name: saveName || file.name,
      standardized_name: file.name,
      file_url,
      file_type: "png",
      file_size: file.size,
      category: saveCategory,
      access_level: saveAccess,
      owner_email: user?.email,
      owner_name: user?.full_name,
      description: `Edited version${sourceFile ? " of: " + sourceFile.display_name : ""}`,
      keywords: ["edited"],
    });
    toast.success("Saved to vault!");
    setSaving(false);
    setSaveDialogOpen(false);
  };

  if (mode === "loading" || vaultLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">Image Editor</span>
        {sourceFile && <span className="text-xs text-muted-foreground truncate hidden sm:block">— {sourceFile.display_name || sourceFile.original_name}</span>}
        <div className="ml-auto flex items-center gap-2">
          {mode === "editing" && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex" onClick={downloadEdited}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setSaveDialogOpen(true)}>
                <Save className="h-3.5 w-3.5" /> Save to Vault
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Select source */}
      {mode === "select" && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">Open an Image to Edit</h2>
              <p className="text-sm text-muted-foreground">Choose from your vault or upload from your device</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={loadLocalFile} />
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium text-sm">Upload from Device</p>
                  <p className="text-xs text-muted-foreground mt-1">Any image file</p>
                </div>
              </label>

              <div className="border rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Vault</p>
                {imageFiles.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No images in vault</p>
                ) : (
                  imageFiles.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => loadImageFromUrl(f.file_url, f)}
                      className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{f.display_name || f.original_name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      {mode === "editing" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="w-14 border-r bg-card flex flex-col items-center py-3 gap-2 shrink-0">
            {[
              { id: "pen", icon: Pen, label: "Draw" },
              { id: "eraser", icon: Eraser, label: "Erase" },
              { id: "text", icon: Type, label: "Text" },
              { id: "line", icon: Minus, label: "Line" },
              { id: "rect", icon: Square, label: "Rectangle" },
              { id: "circle", icon: Circle, label: "Circle" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                title={label}
                onClick={() => setTool(id)}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${tool === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}

            <div className="h-px w-8 bg-border my-1" />

            <button title="Undo" onClick={undo} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted">
              <Undo className="h-4 w-4" />
            </button>
            <button title="Redo" onClick={redo} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted">
              <Redo className="h-4 w-4" />
            </button>
            <button title="Rotate" onClick={rotateImage} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted">
              <RotateCw className="h-4 w-4" />
            </button>
            <button title="Clear Edits" onClick={clearCanvas} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Canvas area */}
          <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.15s" }}>
              <canvas
                ref={canvasRef}
                className="shadow-lg rounded cursor-crosshair max-w-full"
                style={{ touchAction: "none" }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onMouseDown}
                onTouchMove={onMouseMove}
                onTouchEnd={onMouseUp}
              />
            </div>
          </div>

          {/* Right panel */}
          <div className="w-52 border-l bg-card p-3 space-y-4 shrink-0 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-primary" : "border-border"}`}
                    style={{ background: c }}
                  />
                ))}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-6 w-6 rounded cursor-pointer border border-border" title="Custom color" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Brush Size</p>
              <div className="flex gap-1.5 flex-wrap">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`h-7 w-7 rounded-lg border flex items-center justify-center text-xs font-medium transition-colors ${size === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Zoom</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs flex-1 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {tool === "text" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Text</p>
                <p className="text-xs text-muted-foreground">Click canvas to place, then type below.</p>
                <Input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Your text..." className="text-sm" />
                <Button size="sm" className="w-full" onClick={addText} disabled={!textInput || !textPos}>Place Text</Button>
                {textPos && <p className="text-xs text-muted-foreground">Position: {Math.round(textPos.x)}, {Math.round(textPos.y)}</p>}
              </div>
            )}

            <div className="pt-2 border-t space-y-2">
              <Button variant="outline" className="w-full gap-1.5 text-xs" size="sm" onClick={downloadEdited}>
                <Download className="h-3.5 w-3.5" /> Download PNG
              </Button>
              <Button className="w-full gap-1.5 text-xs" size="sm" onClick={() => setSaveDialogOpen(true)}>
                <Save className="h-3.5 w-3.5" /> Save to Vault
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save to Vault dialog */}
      {saveDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold">Save to Vault</h3>
            <div className="space-y-2">
              <Label>File Name</Label>
              <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Edited image name" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={saveCategory} onValueChange={setSaveCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select value={saveAccess} onValueChange={setSaveAccess}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 gap-1.5" onClick={saveToVault} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}