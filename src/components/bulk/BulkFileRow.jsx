import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Image, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { getFileExtension, getFileTypeStyle, formatFileSize, CATEGORIES, PHOTO_CATEGORIES, PHOTO_EXTS } from "@/lib/fileHelpers";

const STATUS_ICONS = {
  pending: null,
  analyzing: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  ready: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  uploading: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
};

export default function BulkFileRow({ item, onCategoryChange, onRemove, showCategoryEdit }) {
  const ext = getFileExtension(item.file.name);
  const style = getFileTypeStyle(ext);
  const isImage = PHOTO_EXTS.includes(ext);
  const ALL_CATS = [...CATEGORIES, ...PHOTO_CATEGORIES];

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
      item.status === "done" ? "bg-green-50 border-green-200" :
      item.status === "error" ? "bg-red-50 border-red-200" : "bg-card"
    }`}>
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}>
        {isImage
          ? <Image className={`h-4 w-4 ${style.color}`} />
          : <FileText className={`h-4 w-4 ${style.color}`} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
      </div>

      {showCategoryEdit && item.status !== "done" && item.status !== "uploading" ? (
        <Select value={item.category} onValueChange={(v) => onCategoryChange(item.id, v)}>
          <SelectTrigger className="w-36 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="to_be_sorted">📁 To Be Sorted</SelectItem>
            {isImage && PHOTO_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>📷 {c.label}</SelectItem>
            ))}
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Badge variant="secondary" className="text-xs shrink-0">
          {item.category === "to_be_sorted" ? "To Be Sorted" : ALL_CATS.find(c => c.value === item.category)?.label || item.category}
        </Badge>
      )}

      <div className="w-5 shrink-0 flex items-center justify-center">
        {STATUS_ICONS[item.status] || null}
      </div>

      {item.status === "error" && (
        <span className="text-xs text-destructive max-w-24 truncate">{item.error}</span>
      )}

      {item.status !== "uploading" && item.status !== "done" && (
        <button onClick={() => onRemove(item.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted shrink-0">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}