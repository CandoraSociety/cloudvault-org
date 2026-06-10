import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, User, Tag, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import { format } from "date-fns";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
const CANVA_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "pdf"];
const PREVIEWABLE_EXTS = ["pdf", ...IMAGE_EXTS, "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];

export default function FileSummaryDialog({ file, open, onOpenChange }) {
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  if (!file) return null;

  const ext = getFileExtension(file.original_name);
  const canPreview = PREVIEWABLE_EXTS.includes(ext);
  const canOpenInCanva = CANVA_EXTS.includes(ext);
  const isImage = IMAGE_EXTS.includes(ext);
  const isPdf = ext === "pdf";

  const previewUrl = isImage || isPdf
    ? file.file_url
    : `https://docs.google.com/viewer?url=${encodeURIComponent(file.file_url)}&embedded=true`;
  const style = getFileTypeStyle(ext);

  return (
    <Dialog open={open} onOpenChange={(v) => { setShowPreview(false); onOpenChange(v); }}>
      <DialogContent className={showPreview ? "max-w-4xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${style.bg} flex items-center justify-center`}>
              <FileText className={`h-5 w-5 ${style.color}`} />
            </div>
            <div className="min-w-0">
              <p className="truncate">{file.display_name || file.original_name}</p>
              <p className="text-xs font-normal text-muted-foreground">{file.standardized_name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {file.summary && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Summary</h4>
              <p className="text-sm leading-relaxed">{file.summary}</p>
            </div>
          )}

          {file.description && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</h4>
              <p className="text-sm">{file.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{file.created_date ? format(new Date(file.created_date), "MMM d, yyyy") : "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{file.owner_name || "Unknown"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="capitalize">{file.access_level}</Badge>
            <Badge variant="outline" className="capitalize">{file.category?.replace(/_/g, " ")}</Badge>
            <Badge variant="outline">{ext.toUpperCase()}</Badge>
            <Badge variant="outline">{formatFileSize(file.file_size)}</Badge>
          </div>

          {file.keywords?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {file.keywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                ))}
              </div>
            </div>
          )}

          {showPreview && (
            <div className="rounded-lg overflow-hidden border bg-muted/30" style={{ height: "60vh" }}>
              {isImage ? (
                <img src={previewUrl} alt={file.display_name} className="w-full h-full object-contain" />
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title={file.display_name}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              )}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => { onOpenChange(false); navigate(`/view?id=${file.id}`); }}>
              <ExternalLink className="h-4 w-4" /> Open File
            </Button>
            {canPreview && (
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? <><EyeOff className="h-4 w-4" /> Hide Preview</> : <><Eye className="h-4 w-4" /> Quick Preview</>}
              </Button>
            )}
            {canOpenInCanva && (
              <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(`https://www.canva.com/create/import/?url=${encodeURIComponent(file.file_url)}`, "_blank")}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Canva_Logo.svg/24px-Canva_Logo.svg.png" alt="Canva" className="h-4 w-4 object-contain" />
                Edit in Canva
              </Button>
            )}
            <Button className="flex-1 gap-2" onClick={() => window.open(file.file_url, "_blank")}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}