import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Upload, Download, Save, Pen, Eraser, Type, Square,
  Circle, Minus, Undo, Redo, Trash2, Loader2, ImageIcon, ZoomIn, ZoomOut,
  Share2, X, FileText, ExternalLink, PenLine, Highlighter, StickyNote, LayoutTemplate
} from "lucide-react";
import SignatureDialog from "@/components/files/SignatureDialog";
import ShareDialog from "@/components/files/ShareDialog";
import SaveVaultDialog from "@/components/files/SaveVaultDialog";
import DocumentOverlayPanel from "@/components/editor/DocumentOverlayPanel";
import { getFileExtension, generateStandardizedName } from "@/lib/fileHelpers";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];
const COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ffffff"];
const HIGHLIGHT_COLORS = ["#fef08a", "#86efac", "#93c5fd", "#fca5a5", "#d8b4fe"];
const SIZES = [2, 4, 8, 14, 20];

const DRAW_TOOLS = [
  { id: "pen", icon: Pen, label: "Freehand Draw" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
  { id: "highlight", icon: Highlighter, label: "Highlight" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "rect", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Ellipse" },
  { id: "text", icon: Type, label: "Add Text" },
  { id: "sticky", icon: StickyNote, label: "Sticky Note" },
  { id: "sign", icon: PenLine, label: "Signature" },
];

export default function FileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get("id");

  const [mode, setMode] = useState(fileId ? "loading" : "select");
  const [sourceFile, setSourceFile] = useState(null);
  const [fileKind, setFileKind] = useState(null);
  const [docUrl, setDocUrl] = useState(null);
  const [rightPanel, setRightPanel] = useState("tools"); // "tools" | "overlays"

  // Canvas
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
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
  const [stickyText, setStickyText] = useState("");
  const imageRef = useRef(null);

  // Dialogs
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

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

  useEffect(() => {
    if (vaultFile && mode === "loading") openFile(vaultFile.file_url, vaultFile);
  }, [vaultFile, mode]);

  // Init overlay canvas for documents
  useEffect(() => {
    if (fileKind === "document" && overlayCanvasRef.current) {
      const canvas = overlayCanvasRef.current;
      const context = canvas.getContext("2d");
      setCtx(context);
      const data = context.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([data]);
      setHistoryIndex(0);
    }
  }, [fileKind]);

  const activeCanvas = useCallback(() =>
    fileKind === "image" ? canvasRef.current : overlayCanvasRef.current,
  [fileKind]);

  const pushHistory = useCallback((context, canvas) => {
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const h = prev.slice(0, historyIndex + 1);
      h.push(data);
      setHistoryIndex(h.length - 1);
      return h;
    });
  }, [historyIndex]);

  const initCanvas = useCallback((img, fileMeta) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    setCtx(context);
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([data]);
    setHistoryIndex(0);
    setSourceFile(fileMeta);
    setFileKind("image");
    setMode("editing");
  }, []);

  const openFile = useCallback((url, fileMeta) => {
    const ext = getFileExtension(fileMeta?.original_name || url);
    if (IMAGE_EXTS.includes(ext)) {
      setMode("loading");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { imageRef.current = img; initCanvas(img, fileMeta); };
      img.onerror = () => { toast.error("Could not load image."); setMode("select"); };
      img.src = url;
    } else {
      setDocUrl(url);
      setSourceFile(fileMeta);
      setFileKind("document");
      setMode("editing");
    }
  }, [initCanvas]);

  const loadLocalFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    openFile(URL.createObjectURL(f), { original_name: f.name, display_name: f.name.replace(/\.[^/.]+$/, ""), category: "general" });
  };

  const undo = () => {
    if (!ctx || historyIndex <= 0) return;
    const ni = historyIndex - 1;
    ctx.putImageData(history[ni], 0, 0);
    setHistoryIndex(ni);
  };

  const redo = () => {
    if (!ctx || historyIndex >= history.length - 1) return;
    const ni = historyIndex + 1;
    ctx.putImageData(history[ni], 0, 0);
    setHistoryIndex(ni);
  };

  const clearCanvas = () => {
    const canvas = activeCanvas();
    if (!ctx || !canvas) return;
    if (fileKind === "image" && imageRef.current) ctx.drawImage(imageRef.current, 0, 0);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
    pushHistory(ctx, canvas);
  };

  const getPos = (e, targetCanvas) => {
    const canvas = targetCanvas || activeCanvas();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches && e.touches.length > 0 ? e.touches[0] :
      (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : null);
    return {
      x: ((touch ? touch.clientX : e.clientX) - rect.left) * scaleX,
      y: ((touch ? touch.clientY : e.clientY) - rect.top) * scaleY,
    };
  };

  const onMouseDown = (e) => {
    if (!ctx) return;
    const pos = getPos(e);
    setDrawing(true);
    setStartPos(pos);
    if (tool === "sign") { setShowSignatureDialog(true); setDrawing(false); return; }
    if (tool === "text") { setTextPos(pos); setDrawing(false); return; }
    if (tool === "sticky") {
      if (stickyText.trim()) {
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(pos.x, pos.y, 160, 64);
        ctx.fillStyle = "#000";
        ctx.font = "13px Inter, sans-serif";
        ctx.fillText(stickyText.slice(0, 28), pos.x + 6, pos.y + 22);
        pushHistory(ctx, activeCanvas());
      }
      setDrawing(false);
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
      ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
    } else if (tool === "highlight") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color + "88"; ctx.lineWidth = size * 4; ctx.lineCap = "square";
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
    }
  };

  const onMouseUp = (e) => {
    if (!drawing || !ctx || !activeCanvas()) return;
    setDrawing(false);
    ctx.globalCompositeOperation = "source-over";
    const pos = getPos(e);
    if (tool === "rect") {
      ctx.strokeStyle = color; ctx.lineWidth = size;
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    } else if (tool === "circle") {
      const rx = Math.abs(pos.x - startPos.x) / 2, ry = Math.abs(pos.y - startPos.y) / 2;
      ctx.strokeStyle = color; ctx.lineWidth = size;
      ctx.beginPath();
      ctx.ellipse(startPos.x + (pos.x - startPos.x) / 2, startPos.y + (pos.y - startPos.y) / 2, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === "line") {
      ctx.strokeStyle = color; ctx.lineWidth = size;
      ctx.beginPath(); ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    }
    pushHistory(ctx, activeCanvas());
  };

  const addText = () => {
    if (!ctx || !textInput || !textPos) return;
    ctx.fillStyle = color;
    ctx.font = `${size * 4 + 12}px Inter, sans-serif`;
    ctx.fillText(textInput, textPos.x, textPos.y);
    pushHistory(ctx, activeCanvas());
    setTextInput(""); setTextPos(null);
  };

  const applySignature = (dataUrl) => {
    const canvas = activeCanvas();
    if (!ctx || !canvas) return;
    const img = new Image();
    img.onload = () => {
      const sigW = Math.min(canvas.width * 0.35, 280);
      const sigH = (img.height / img.width) * sigW;
      ctx.drawImage(img, canvas.width - sigW - 24, canvas.height - sigH - 24, sigW, sigH);
      pushHistory(ctx, canvas);
    };
    img.src = dataUrl;
  };

  const downloadEdited = () => {
    const canvas = activeCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = (sourceFile?.display_name || "edited-file") + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleSaveToVault = async ({ saveName, saveCategory, saveAccess }) => {
    const canvas = activeCanvas();
    if (!canvas) return;
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const file = new File([blob], `${saveName || "edited-file"}.png`, { type: "image/png" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.File.create({
      original_name: file.name,
      display_name: saveName || file.name,
      standardized_name: generateStandardizedName(file.name, saveCategory, saveAccess),
      file_url, file_type: "png", file_size: file.size,
      category: saveCategory, access_level: saveAccess,
      owner_email: user?.email, owner_name: user?.full_name,
      description: `Annotated version${sourceFile ? " of: " + (sourceFile.display_name || sourceFile.original_name) : ""}`,
      keywords: ["edited", "annotated"],
    });
    queryClient.invalidateQueries({ queryKey: ["files"] });
    toast.success("Saved to vault!");
    setShowSaveDialog(false);
  };

  if (mode === "loading" || vaultLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isEditing = mode === "editing";

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">File Editor</span>
        {sourceFile && <span className="text-xs text-muted-foreground truncate hidden sm:block">— {sourceFile.display_name || sourceFile.original_name}</span>}
        <div className="ml-auto flex items-center gap-2">
          {isEditing && sourceFile?.id && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowShareDialog(true)}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex" onClick={downloadEdited}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setShowSaveDialog(true)}>
                <Save className="h-3.5 w-3.5" /> Save to Vault
              </Button>
            </>
          )}
          {isEditing && fileKind === "document" && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(docUrl, "_blank")}>
              <ExternalLink className="h-3.5 w-3.5" /> Open Original
            </Button>
          )}
        </div>
      </div>

      {/* File select */}
      {mode === "select" && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">Open a File to Edit</h2>
              <p className="text-sm text-muted-foreground">All file types support annotations, drawing, text, highlights, watermarks, headers, footers and signatures.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={loadLocalFile} />
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium text-sm">Upload from Device</p>
                  <p className="text-xs text-muted-foreground mt-1">Images & documents</p>
                </div>
              </label>
              <div className="border rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Vault</p>
                {allFiles.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No files in vault</p>
                ) : allFiles.map((f) => {
                  const ext = getFileExtension(f.original_name);
                  return (
                    <button key={f.id} onClick={() => openFile(f.file_url, f)}
                      className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                      {IMAGE_EXTS.includes(ext) ? <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" /> : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className="text-sm truncate">{f.display_name || f.original_name}</span>
                      <span className="text-xs text-muted-foreground uppercase ml-auto">{ext}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      {isEditing && (
        <div className="flex flex-1 overflow-hidden">

          {/* Left toolbar */}
          <div className="w-14 border-r bg-card flex flex-col items-center py-3 gap-1 shrink-0 overflow-y-auto">
            {DRAW_TOOLS.map(({ id, icon: Icon, label }, i) => (
              <React.Fragment key={id}>
                {(i === 3 || i === 6 || i === 8) && <div className="h-px w-8 bg-border my-1" />}
                <button title={label} onClick={() => id === "sign" ? setShowSignatureDialog(true) : setTool(id)}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors
                    ${tool === id && id !== "sign" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                    ${id === "sign" ? "text-primary" : ""}`}>
                  <Icon className="h-4 w-4" />
                </button>
              </React.Fragment>
            ))}
            <div className="h-px w-8 bg-border my-1" />
            <button title="Undo" onClick={undo} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted"><Undo className="h-4 w-4" /></button>
            <button title="Redo" onClick={redo} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted"><Redo className="h-4 w-4" /></button>
            <button title="Clear" onClick={clearCanvas} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>

          {/* Center canvas/viewer */}
          <div className="flex-1 overflow-auto bg-muted/30">
            {fileKind === "image" && (
              <div className="min-h-full flex items-start justify-center p-6">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.15s" }}>
                  <canvas ref={canvasRef}
                    className="shadow-xl rounded cursor-crosshair block"
                    style={{ touchAction: "none" }}
                    onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                    onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp} />
                </div>
              </div>
            )}

            {fileKind === "document" && (
              <div className="relative w-full" style={{ minHeight: "calc(100vh - 52px)" }}>
                {/* Full-height document iframe */}
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`}
                  className="w-full border-0"
                  style={{ height: "calc(100vh - 52px)", display: "block" }}
                  title="Document Viewer"
                />
                {/* Transparent annotation canvas overlay */}
                <canvas
                  ref={overlayCanvasRef}
                  width={1240}
                  height={1754}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    height: "calc(100vh - 52px)",
                    touchAction: "none",
                    cursor: tool === "text" ? "text" : "crosshair",
                    pointerEvents: "auto",
                  }}
                  onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                  onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp}
                />
                <div className="absolute top-3 left-3 z-10 bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs px-2 py-1 rounded-full shadow-sm">
                  Annotation layer — draw on top of document
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="w-56 border-l bg-card shrink-0 flex flex-col overflow-hidden">
            <div className="flex border-b shrink-0">
              <button onClick={() => setRightPanel("tools")}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${rightPanel === "tools" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
                Tools
              </button>
              <button onClick={() => setRightPanel("overlays")}
                className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${rightPanel === "overlays" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
                <LayoutTemplate className="h-3 w-3" /> Page
              </button>
            </div>

            {rightPanel === "tools" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Color */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Color</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(tool === "highlight" ? HIGHLIGHT_COLORS : COLORS).map((c) => (
                      <button key={c} onClick={() => setColor(c)}
                        className={`h-6 w-6 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-primary" : "border-border"}`}
                        style={{ background: c }} />
                    ))}
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-6 w-6 rounded cursor-pointer border border-border" />
                  </div>
                </div>

                {/* Size */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {tool === "highlight" ? "Highlight Width" : "Brush Size"}
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {SIZES.map((s) => (
                      <button key={s} onClick={() => setSize(s)}
                        className={`h-7 w-7 rounded-lg border flex items-center justify-center text-xs font-medium transition-colors ${size === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom (images) */}
                {fileKind === "image" && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Zoom</p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}><ZoomOut className="h-3.5 w-3.5" /></Button>
                      <span className="text-xs flex-1 text-center">{Math.round(zoom * 100)}%</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}><ZoomIn className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                )}

                {/* Text tool */}
                {tool === "text" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Text</p>
                    <p className="text-xs text-muted-foreground">Click canvas to set position, then place.</p>
                    <Input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Your text..." className="text-sm h-8" />
                    <Button size="sm" className="w-full" onClick={addText} disabled={!textInput || !textPos}>Place Text</Button>
                    {textPos && <p className="text-xs text-green-600">Position set ✓</p>}
                  </div>
                )}

                {/* Sticky note */}
                {tool === "sticky" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sticky Note</p>
                    <p className="text-xs text-muted-foreground">Type your note, then click canvas to place.</p>
                    <Input value={stickyText} onChange={(e) => setStickyText(e.target.value)} placeholder="Note text..." className="text-sm h-8" />
                  </div>
                )}

                {/* Tool hint */}
                {!["text", "sticky"].includes(tool) && (
                  <div className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">
                      {tool === "pen" && "Draw freely anywhere on the document"}
                      {tool === "eraser" && "Erase annotations you've added"}
                      {tool === "highlight" && "Drag to highlight text or areas"}
                      {tool === "line" && "Click and drag to draw a straight line"}
                      {tool === "rect" && "Click and drag to draw a rectangle"}
                      {tool === "circle" && "Click and drag to draw an ellipse"}
                      {tool === "sign" && "Click Sign to open the signature pad"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {rightPanel === "overlays" && (
              <div className="flex-1 overflow-hidden">
                <DocumentOverlayPanel
                  ctx={ctx}
                  canvas={activeCanvas()}
                  onApply={() => ctx && activeCanvas() && pushHistory(ctx, activeCanvas())}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      {showSaveDialog && (
        <SaveVaultDialog
          onClose={() => setShowSaveDialog(false)}
          onSave={handleSaveToVault}
          defaultName={(sourceFile?.display_name || sourceFile?.original_name || "edited-file") + " (annotated)"}
          defaultCategory={sourceFile?.category || "general"}
        />
      )}
      {showShareDialog && sourceFile?.id && (
        <ShareDialog
          file={sourceFile}
          onClose={() => setShowShareDialog(false)}
          onSave={() => queryClient.invalidateQueries({ queryKey: ["files"] })}
        />
      )}
      <SignatureDialog
        open={showSignatureDialog}
        onOpenChange={setShowSignatureDialog}
        onApply={applySignature}
      />
    </div>
  );
}