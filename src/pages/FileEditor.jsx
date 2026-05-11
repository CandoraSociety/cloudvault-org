import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Upload, Download, Save, Pen, Eraser, Type, Square,
  Circle, Minus, Undo, Redo, Trash2, Loader2, ImageIcon, ZoomIn, ZoomOut,
  RotateCw, Share2, X, FileText, ExternalLink
} from "lucide-react";
import { getFileExtension, CATEGORIES, ACCESS_LEVELS } from "@/lib/fileHelpers";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];
const DOC_EXTS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];
const COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ffffff"];
const SIZES = [2, 4, 8, 14, 20];

function ShareDialog({ file, onClose, onSave }) {
  const [emails, setEmails] = useState(file?.finance_authorized_emails || []);
  const [emailInput, setEmailInput] = useState("");
  const [accessLevel, setAccessLevel] = useState(file?.access_level || "personal");
  const [saving, setSaving] = useState(false);

  const addEmail = () => {
    const em = emailInput.trim().toLowerCase();
    if (em && !emails.includes(em)) { setEmails([...emails, em]); setEmailInput(""); }
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.File.update(file.id, {
      access_level: accessLevel,
      finance_authorized_emails: emails,
    });
    toast.success("Access settings updated!");
    setSaving(false);
    onSave?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Share2 className="h-4 w-4" /> Share Access</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2">
          <Label>Access Level</Label>
          <Select value={accessLevel} onValueChange={setAccessLevel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACCESS_LEVELS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label} — {a.description}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Share with specific users (email)</Label>
          <p className="text-xs text-muted-foreground">These users will be able to access the file regardless of their role.</p>
          <div className="flex gap-2">
            <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="user@company.com" type="email"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())} />
            <Button variant="outline" onClick={addEmail}>Add</Button>
          </div>
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {emails.map((em) => (
                <Badge key={em} variant="secondary" className="gap-1 pr-1">
                  {em}
                  <button onClick={() => setEmails(emails.filter((e) => e !== em))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SaveVaultDialog({ onClose, onSave, defaultName, defaultCategory }) {
  const [saveName, setSaveName] = useState(defaultName || "");
  const [saveCategory, setSaveCategory] = useState(defaultCategory || "general");
  const [saveAccess, setSaveAccess] = useState("personal");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ saveName, saveCategory, saveAccess });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h3 className="font-semibold">Save to Vault</h3>
        <div className="space-y-2">
          <Label>File Name</Label>
          <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="File name" />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={saveCategory} onValueChange={setSaveCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Access Level</Label>
          <Select value={saveAccess} onValueChange={setSaveAccess}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ACCESS_LEVELS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get("id");

  const [mode, setMode] = useState(fileId ? "loading" : "select");
  const [sourceFile, setSourceFile] = useState(null);
  const [fileKind, setFileKind] = useState(null); // "image" | "document"
  const [docUrl, setDocUrl] = useState(null);

  // Canvas / image editor state
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
  const imageRef = useRef(null);

  // Dialogs
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

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

  const saveToHistory = useCallback((context, canvas) => {
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const newH = prev.slice(0, historyIndex + 1);
      newH.push(data);
      setHistoryIndex(newH.length - 1);
      return newH;
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
    saveToHistory(context, canvas);
    setSourceFile(fileMeta);
    setFileKind("image");
    setMode("editing");
  }, [saveToHistory]);

  const openFile = useCallback((url, fileMeta) => {
    const ext = getFileExtension(fileMeta?.original_name || url);
    if (IMAGE_EXTS.includes(ext)) {
      setMode("loading");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { imageRef.current = img; initCanvas(img, fileMeta); };
      img.onerror = () => { toast.error("Could not load image for editing."); setMode("select"); };
      img.src = url;
    } else {
      // Document viewer
      setDocUrl(url);
      setSourceFile(fileMeta);
      setFileKind("document");
      setMode("editing");
    }
  }, [initCanvas]);

  const loadLocalFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    openFile(url, { original_name: f.name, display_name: f.name.replace(/\.[^/.]+$/, ""), category: "general" });
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
    if (tool === "text") { setTextPos(pos); return; }
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
      ctx.strokeStyle = color; ctx.lineWidth = size;
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    } else if (tool === "circle") {
      const pos = getPos(e);
      const rx = Math.abs(pos.x - startPos.x) / 2;
      const ry = Math.abs(pos.y - startPos.y) / 2;
      ctx.strokeStyle = color; ctx.lineWidth = size;
      ctx.beginPath();
      ctx.ellipse(startPos.x + (pos.x - startPos.x) / 2, startPos.y + (pos.y - startPos.y) / 2, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === "line") {
      const pos = getPos(e);
      ctx.strokeStyle = color; ctx.lineWidth = size;
      ctx.beginPath(); ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    }
    saveToHistory(ctx, canvasRef.current);
  };

  const addText = () => {
    if (!ctx || !textInput || !textPos) return;
    ctx.fillStyle = color;
    ctx.font = `${size * 4 + 12}px Inter, sans-serif`;
    ctx.fillText(textInput, textPos.x, textPos.y);
    saveToHistory(ctx, canvasRef.current);
    setTextInput(""); setTextPos(null);
  };

  const rotateImage = () => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const tmp = document.createElement("canvas");
    tmp.width = canvas.height; tmp.height = canvas.width;
    const tCtx = tmp.getContext("2d");
    tCtx.translate(tmp.width / 2, tmp.height / 2);
    tCtx.rotate(Math.PI / 2);
    tCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    canvas.width = tmp.width; canvas.height = tmp.height;
    ctx.drawImage(tmp, 0, 0);
    saveToHistory(ctx, canvas);
  };

  const downloadEdited = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    const name = sourceFile?.display_name || sourceFile?.original_name || "edited-image";
    link.download = name + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleSaveToVault = async ({ saveName, saveCategory, saveAccess }) => {
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
      description: `Edited version${sourceFile ? " of: " + (sourceFile.display_name || sourceFile.original_name) : ""}`,
      keywords: ["edited"],
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

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">File Editor</span>
        {sourceFile && <span className="text-xs text-muted-foreground truncate hidden sm:block">— {sourceFile.display_name || sourceFile.original_name}</span>}
        <div className="ml-auto flex items-center gap-2">
          {mode === "editing" && sourceFile?.id && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowShareDialog(true)}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
          )}
          {mode === "editing" && fileKind === "image" && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex" onClick={downloadEdited}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setShowSaveDialog(true)}>
                <Save className="h-3.5 w-3.5" /> Save to Vault
              </Button>
            </>
          )}
          {mode === "editing" && fileKind === "document" && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(docUrl, "_blank")}>
              <ExternalLink className="h-3.5 w-3.5" /> Open Original
            </Button>
          )}
        </div>
      </div>

      {/* Select source */}
      {mode === "select" && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">Open a File to Edit</h2>
              <p className="text-sm text-muted-foreground">Choose from your vault or upload from your device. Images are fully editable; documents open in a viewer with annotation support.</p>
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
                ) : (
                  allFiles.map((f) => {
                    const ext = getFileExtension(f.original_name);
                    const isImg = IMAGE_EXTS.includes(ext);
                    return (
                      <button key={f.id} onClick={() => openFile(f.file_url, f)}
                        className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                        {isImg ? <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" /> : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <span className="text-sm truncate">{f.display_name || f.original_name}</span>
                        <span className="text-xs text-muted-foreground uppercase ml-auto">{ext}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor */}
      {mode === "editing" && fileKind === "image" && (
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
              <button key={id} title={label} onClick={() => setTool(id)}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${tool === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="h-px w-8 bg-border my-1" />
            <button title="Undo" onClick={undo} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted"><Undo className="h-4 w-4" /></button>
            <button title="Redo" onClick={redo} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted"><Redo className="h-4 w-4" /></button>
            <button title="Rotate" onClick={rotateImage} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted"><RotateCw className="h-4 w-4" /></button>
            <button title="Clear Edits" onClick={clearCanvas} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.15s" }}>
              <canvas ref={canvasRef} className="shadow-lg rounded cursor-crosshair max-w-full" style={{ touchAction: "none" }}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp} />
            </div>
          </div>
          {/* Right panel */}
          <div className="w-52 border-l bg-card p-3 space-y-4 shrink-0 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-primary" : "border-border"}`}
                    style={{ background: c }} />
                ))}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-6 w-6 rounded cursor-pointer border border-border" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Brush Size</p>
              <div className="flex gap-1.5 flex-wrap">
                {SIZES.map((s) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={`h-7 w-7 rounded-lg border flex items-center justify-center text-xs font-medium transition-colors ${size === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Zoom</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}><ZoomOut className="h-3.5 w-3.5" /></Button>
                <span className="text-xs flex-1 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}><ZoomIn className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            {tool === "text" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Text</p>
                <p className="text-xs text-muted-foreground">Click canvas to place, then type here.</p>
                <Input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Your text..." className="text-sm" />
                <Button size="sm" className="w-full" onClick={addText} disabled={!textInput || !textPos}>Place Text</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Viewer */}
      {mode === "editing" && fileKind === "document" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-muted/30 border-b px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Documents open in a read-only viewer. Use the <strong>"Open Original"</strong> button to download and edit in your desktop app, then re-upload to the vault.
          </div>
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`}
            className="flex-1 w-full border-0"
            title="Document Viewer"
          />
        </div>
      )}

      {showSaveDialog && (
        <SaveVaultDialog
          onClose={() => setShowSaveDialog(false)}
          onSave={handleSaveToVault}
          defaultName={(sourceFile?.display_name || sourceFile?.original_name || "edited-image") + " (edited)"}
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
    </div>
  );
}