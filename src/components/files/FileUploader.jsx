import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText, Loader2, Sparkles } from "lucide-react";
import { CATEGORIES, ACCESS_LEVELS, getFileExtension, generateStandardizedName } from "@/lib/fileHelpers";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function FileUploader({ onUploadComplete }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [accessLevel, setAccessLevel] = useState("universal");
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [financeEmails, setFinanceEmails] = useState([]);
  const [financeEmailInput, setFinanceEmailInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleFileSelect = useCallback((e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setDisplayName(f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setDisplayName(f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  }, []);

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const generateSummary = async (fileUrl) => {
    setGenerating(true);
    const ext = getFileExtension(file.name);
    const supportedForExtraction = ["pdf", "docx", "doc", "xlsx", "xls", "csv", "txt", "png", "jpg", "jpeg", "html"];

    let summaryText = "";
    if (supportedForExtraction.includes(ext)) {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a concise 2-3 sentence summary of this file. Focus on the key content, purpose, and any important details. File name: ${file.name}. Description: ${description || "none provided"}.`,
        file_urls: [fileUrl],
      });
      summaryText = result;
    } else {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a concise 2-3 sentence summary/description for a file named "${file.name}" in the "${category}" category. Description provided: "${description || "none"}". Keywords: ${keywords.join(", ") || "none"}. Infer what this file likely contains.`,
      });
      summaryText = result;
    }
    setGenerating(false);
    return summaryText;
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    let summary = "";
    summary = await generateSummary(file_url);

    const standardizedName = generateStandardizedName(file.name, category, accessLevel);

    await base44.entities.File.create({
      original_name: file.name,
      standardized_name: standardizedName,
      display_name: displayName || file.name,
      description,
      summary: typeof summary === "string" ? summary : JSON.stringify(summary),
      keywords,
      file_url,
      file_type: getFileExtension(file.name),
      file_size: file.size,
      category,
      access_level: accessLevel,
      finance_authorized_emails: accessLevel === "finance" ? financeEmails : [],
      owner_email: user?.email,
      owner_name: user?.full_name,
    });

    toast.success("File uploaded successfully!");
    setFile(null);
    setDisplayName("");
    setDescription("");
    setCategory("general");
    setAccessLevel("universal");
    setKeywords([]);
    setFinanceEmails([]);
    setFinanceEmailInput("");
    setUploading(false);
    setGenerating(false);
    onUploadComplete?.();
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
        onClick={() => document.getElementById("file-input").click()}
      >
        <input id="file-input" type="file" className="hidden" onChange={handleFileSelect} />
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drop your file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports all file types</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form fields */}
      <AnimatePresence>
        {file && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Friendly file name" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Access Level</Label>
              <div className="grid grid-cols-3 gap-3">
                {ACCESS_LEVELS.map((al) => {
                  const canSelectManager = user?.role === "admin" || user?.role === "manager";
                  const canSelectFinance = user?.role === "admin" || user?.role === "finance";
                  const canSelectCorporate = user?.role === "admin";
                  const disabled =
                    (al.value === "manager" && !canSelectManager) ||
                    (al.value === "finance" && !canSelectFinance) ||
                    (al.value === "corporate" && !canSelectCorporate);

                  return (
                    <Card
                      key={al.value}
                      className={`p-3 cursor-pointer transition-all text-center ${
                        disabled ? "opacity-40 cursor-not-allowed" :
                        accessLevel === al.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/30"
                      }`}
                      onClick={() => !disabled && setAccessLevel(al.value)}
                    >
                      <p className="text-sm font-medium">{al.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{al.description}</p>
                    </Card>
                  );
                })}
              </div>
            </div>

            {accessLevel === "finance" && (
              <div className="space-y-2">
                <Label>Authorized Emails</Label>
                <p className="text-xs text-muted-foreground">Add specific individuals who can access this finance file (in addition to Finance role users and Admins).</p>
                <div className="flex gap-2">
                  <Input
                    value={financeEmailInput}
                    onChange={(e) => setFinanceEmailInput(e.target.value)}
                    placeholder="user@company.com"
                    type="email"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const em = financeEmailInput.trim().toLowerCase();
                        if (em && !financeEmails.includes(em)) {
                          setFinanceEmails([...financeEmails, em]);
                          setFinanceEmailInput("");
                        }
                      }
                    }}
                  />
                  <Button variant="outline" type="button" onClick={() => {
                    const em = financeEmailInput.trim().toLowerCase();
                    if (em && !financeEmails.includes(em)) {
                      setFinanceEmails([...financeEmails, em]);
                      setFinanceEmailInput("");
                    }
                  }}>Add</Button>
                </div>
                {financeEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {financeEmails.map((em) => (
                      <Badge key={em} variant="secondary" className="gap-1 pr-1">
                        {em}
                        <button onClick={() => setFinanceEmails(financeEmails.filter((e) => e !== em))} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the file contents..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Keywords / Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add a keyword..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                />
                <Button variant="outline" type="button" onClick={addKeyword}>Add</Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Preview standardized name */}
            <Card className="p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground font-medium mb-1">Standardized File Name</p>
              <p className="text-sm font-mono">{generateStandardizedName(file.name, category, accessLevel)}</p>
            </Card>

            <Button className="w-full gap-2 h-11" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  {generating ? (
                    <><Sparkles className="h-4 w-4 animate-pulse" /> Generating Summary...</>
                  ) : (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                  )}
                </>
              ) : (
                <><Upload className="h-4 w-4" /> Upload File</>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}