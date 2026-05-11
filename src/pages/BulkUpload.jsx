import React, { useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, FolderOpen, Cpu, GitMerge, ChevronRight, ChevronLeft,
  CheckCircle2, Loader2, AlertTriangle, RefreshCw, Inbox
} from "lucide-react";
import { toast } from "sonner";
import { ACCESS_LEVELS, CATEGORIES, getFileExtension, generateStandardizedName } from "@/lib/fileHelpers";
import BulkFileRow from "@/components/bulk/BulkFileRow";

// Which access levels a given role can upload to
const ALLOWED_ACCESS = {
  admin:   ["personal", "universal", "manager", "finance", "corporate"],
  manager: ["personal", "universal", "manager"],
  finance: ["personal", "universal", "finance"],
  user:    ["personal", "universal"],
};

const MODES = [
  {
    id: "manual",
    icon: FolderOpen,
    label: "To Be Sorted",
    description: "All files land in a holding folder. You sort them into categories manually afterwards.",
  },
  {
    id: "auto",
    icon: Cpu,
    label: "Auto-Categorize",
    description: "The app analyses each file and assigns the best category automatically. Fast, hands-off.",
  },
  {
    id: "hybrid",
    icon: GitMerge,
    label: "Review & Approve",
    description: "AI suggests a category for every file — you review and approve before anything is saved.",
  },
];

let idSeq = 0;
function makeItem(file) {
  return { id: ++idSeq, file, category: "to_be_sorted", status: "pending", error: null };
}

export default function BulkUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=config, 2=drop, 3=review, 4=uploading, 5=done
  const [mode, setMode] = useState(null);
  const [accessLevel, setAccessLevel] = useState("universal");
  const [items, setItems] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const fileInputRef = useRef();

  const role = user?.role || "user";
  const allowedLevels = ALLOWED_ACCESS[role] || ALLOWED_ACCESS.user;

  // ── Step 1: select mode & access level ──────────────────────────────────────
  const handleConfigure = () => {
    if (!mode) return toast.error("Please select an import mode");
    setStep(2);
  };

  // ── Step 2: drop / select files ─────────────────────────────────────────────
  const addFiles = (fileList) => {
    const newItems = Array.from(fileList).map(makeItem);
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }, []);

  const handleProceed = async () => {
    if (items.length === 0) return toast.error("Please add at least one file");
    if (mode === "manual") {
      // All stay as "to_be_sorted" — go straight to review
      setStep(3);
    } else {
      // Auto or hybrid — run AI analysis
      setAnalyzing(true);
      setStep(3);
      const updated = [...items];
      for (let i = 0; i < updated.length; i++) {
        updated[i] = { ...updated[i], status: "analyzing" };
        setItems([...updated]);

        const suggested = await analyzeFile(updated[i].file);
        updated[i] = { ...updated[i], category: suggested, status: "ready" };
        setItems([...updated]);
      }
      setAnalyzing(false);
    }
  };

  const analyzeFile = async (file) => {
    const ext = getFileExtension(file.name);
    const categoryValues = CATEGORIES.map(c => c.value).join(", ");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a document classifier. Given a filename and extension, return the single best category slug from this list: ${categoryValues}, to_be_sorted.
File name: "${file.name}"
Extension: "${ext}"
Respond with ONLY the category slug, nothing else. If you cannot determine the category, respond with "to_be_sorted".`,
    });
    const slug = (typeof result === "string" ? result : "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const valid = [...CATEGORIES.map(c => c.value), "to_be_sorted"];
    return valid.includes(slug) ? slug : "to_be_sorted";
  };

  const handleCategoryChange = (id, category) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, category } : it));
  };

  const handleRemove = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // ── Step 4/5: upload ─────────────────────────────────────────────────────────
  const handleUpload = async () => {
    setStep(4);
    const total = items.length;
    let done = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: "uploading" } : it));

      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });

        // Quick summary via LLM (non-blocking, best-effort)
        let summary = "";
        try {
          summary = await base44.integrations.Core.InvokeLLM({
            prompt: `Give a 1-2 sentence summary for a file named "${item.file.name}" in the "${item.category}" category.`,
          });
        } catch (_) {}

        const standardizedName = generateStandardizedName(item.file.name, item.category, accessLevel);

        await base44.entities.File.create({
          original_name: item.file.name,
          standardized_name: standardizedName,
          display_name: item.file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          summary: typeof summary === "string" ? summary : "",
          keywords: [],
          file_url,
          file_type: getFileExtension(item.file.name),
          file_size: item.file.size,
          category: item.category,
          access_level: accessLevel,
          finance_authorized_emails: [],
          owner_email: user?.email,
          owner_name: user?.full_name,
        });

        done++;
        setDoneCount(done);
        setProgress(Math.round((done / total) * 100));
        setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: "done" } : it));
      } catch (err) {
        done++;
        setDoneCount(done);
        setProgress(Math.round((done / total) * 100));
        setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: "error", error: err.message } : it));
      }
    }

    queryClient.invalidateQueries({ queryKey: ["files"] });
    setStep(5);
  };

  const failedItems = items.filter((i) => i.status === "error");
  const successCount = items.filter((i) => i.status === "done").length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk Import</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload many files at once with automatic naming and categorization</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <span className={`h-6 w-6 rounded-full flex items-center justify-center font-semibold text-xs border ${
                step > s ? "bg-primary text-primary-foreground border-primary" :
                step === s ? "border-primary text-primary" : "border-border text-muted-foreground"
              }`}>{step > s ? "✓" : s}</span>
              {s < 4 && <ChevronRight className="h-3 w-3" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Configure ── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Mode selection */}
          <div>
            <h2 className="text-base font-semibold mb-3">Choose import mode</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {MODES.map(({ id, icon: Icon, label, description }) => (
                <Card
                  key={id}
                  onClick={() => setMode(id)}
                  className={`p-4 cursor-pointer transition-all ${mode === id ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:border-primary/30"}`}
                >
                  <Icon className={`h-6 w-6 mb-2 ${mode === id ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Access level */}
          <div>
            <h2 className="text-base font-semibold mb-3">Access level for all files</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACCESS_LEVELS.filter(al => allowedLevels.includes(al.value)).map((al) => (
                <Card
                  key={al.value}
                  onClick={() => setAccessLevel(al.value)}
                  className={`p-3 cursor-pointer text-center transition-all ${accessLevel === al.value ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:border-primary/30"}`}
                >
                  <p className="text-sm font-medium">{al.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{al.description}</p>
                </Card>
              ))}
            </div>
          </div>

          <Button className="w-full h-11 gap-2" onClick={handleConfigure}>
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── STEP 2: Select Files ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <Badge variant="outline">{MODES.find(m => m.id === mode)?.label}</Badge>
            <Badge variant="outline">{ACCESS_LEVELS.find(al => al.value === accessLevel)?.label}</Badge>
            <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline ml-auto flex items-center gap-1">
              <ChevronLeft className="h-3 w-3" /> Change settings
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/40 transition-colors cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Select as many files as you need — all file types supported</p>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{items.length} file{items.length !== 1 ? "s" : ""} selected</span>
                <button onClick={() => setItems([])} className="text-xs text-destructive hover:underline">Clear all</button>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <BulkFileRow
                    key={item.id}
                    item={item}
                    onCategoryChange={handleCategoryChange}
                    onRemove={handleRemove}
                    showCategoryEdit={false}
                  />
                ))}
              </div>
            </div>
          )}

          <Button className="w-full h-11 gap-2" onClick={handleProceed} disabled={items.length === 0}>
            {mode === "manual" ? "Review & Import" : "Analyse & Continue"} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── STEP 3: Review ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {mode === "manual" ? "Review files — all go to \"To Be Sorted\"" :
               mode === "auto"   ? "AI is categorizing your files…" :
               "Review AI suggestions — adjust any category before importing"}
            </h2>
            {analyzing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>

          {analyzing && (
            <div className="text-xs text-muted-foreground flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              Analysing file names and types to suggest categories… this may take a moment.
            </div>
          )}

          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {items.map((item) => (
              <BulkFileRow
                key={item.id}
                item={item}
                onCategoryChange={handleCategoryChange}
                onRemove={handleRemove}
                showCategoryEdit={mode !== "auto" || !analyzing}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              className="flex-1 h-11 gap-2"
              onClick={handleUpload}
              disabled={analyzing || items.length === 0}
            >
              <Upload className="h-4 w-4" /> Import {items.length} File{items.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Uploading ── */}
      {step === 4 && (
        <div className="space-y-6">
          <Card className="p-6 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <div>
              <p className="font-semibold">Importing files…</p>
              <p className="text-sm text-muted-foreground mt-1">{doneCount} of {items.length} complete</p>
            </div>
            <Progress value={progress} className="h-2" />
          </Card>
          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
            {items.map((item) => (
              <BulkFileRow key={item.id} item={item} onCategoryChange={() => {}} onRemove={() => {}} showCategoryEdit={false} />
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 5: Done ── */}
      {step === 5 && (
        <div className="space-y-4">
          <Card className="p-6 text-center space-y-4">
            {failedItems.length === 0 ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <p className="text-lg font-semibold">Import complete!</p>
                  <p className="text-sm text-muted-foreground mt-1">{successCount} file{successCount !== 1 ? "s" : ""} successfully added to the vault.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
                <div>
                  <p className="text-lg font-semibold">{successCount} imported, {failedItems.length} failed</p>
                  <p className="text-sm text-muted-foreground mt-1">Review the errors below. You can retry the failed files.</p>
                </div>
              </>
            )}
          </Card>

          {failedItems.length > 0 && (
            <div className="space-y-1.5">
              {failedItems.map((item) => (
                <BulkFileRow key={item.id} item={item} onCategoryChange={() => {}} onRemove={() => {}} showCategoryEdit={false} />
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => { setItems([]); setStep(1); setProgress(0); setDoneCount(0); }}>
              <RefreshCw className="h-4 w-4" /> New Import
            </Button>
            <Button className="flex-1 gap-2" onClick={() => navigate("/files")}>
              <Inbox className="h-4 w-4" /> View Files
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}