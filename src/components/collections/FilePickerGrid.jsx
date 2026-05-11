import React, { useState } from "react";
import { FileText, Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getFileExtension, getFileTypeStyle } from "@/lib/fileHelpers";
import { Badge } from "@/components/ui/badge";

export default function FilePickerGrid({ files, selectedIds, onToggle }) {
  const [search, setSearch] = useState("");

  const filtered = files.filter((f) => {
    const q = search.toLowerCase();
    return !q || f.display_name?.toLowerCase().includes(q) || f.original_name?.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search files..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="border rounded-lg max-h-64 overflow-y-auto divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No files found</p>
        ) : (
          filtered.map((file) => {
            const ext = getFileExtension(file.original_name);
            const style = getFileTypeStyle(ext);
            const selected = selectedIds.includes(file.id);
            return (
              <button
                key={file.id}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${selected ? "bg-primary/5" : ""}`}
                onClick={() => onToggle(file.id)}
              >
                <div className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                  <FileText className={`h-4 w-4 ${style.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.display_name || file.original_name}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground capitalize">{file.category?.replace(/_/g, " ")}</span>
                    <span className="text-xs text-muted-foreground uppercase">{ext}</span>
                  </div>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "bg-primary border-primary" : "border-border"}`}>
                  {selected && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
            );
          })
        )}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">{selectedIds.length} file{selectedIds.length !== 1 ? "s" : ""} selected</p>
      )}
    </div>
  );
}