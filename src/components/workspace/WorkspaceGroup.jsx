import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Download, Trash2, FileText, Pin, Loader2, ExternalLink, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import { format } from "date-fns";
import PinFromVaultDialog from "./PinFromVaultDialog";
import WorkspaceNoteDialog from "./WorkspaceNoteDialog";

export default function WorkspaceGroup({ groupName, items, accessibleFiles, uploading, onUpload, onPin, onBack, onRefresh, pinnedIds }) {
  const queryClient = useQueryClient();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const handleRemove = async (item) => {
    await base44.entities.WorkspaceItem.delete(item.id);
    onRefresh();
    toast.success("Removed from group");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{groupName}</h1>
          <p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "file" : "files"}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" className="gap-2" onClick={() => setShowPinDialog(true)}>
            <Pin className="h-4 w-4" /> Pin from Vault
          </Button>
          <label>
            <Button className="gap-2" asChild>
              <span>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload File"}
              </span>
            </Button>
            <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No files in this group yet</p>
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline" onClick={() => setShowPinDialog(true)} className="gap-2">
              <Pin className="h-4 w-4" /> Pin from Vault
            </Button>
            <label>
              <Button asChild className="gap-2"><span><Upload className="h-4 w-4" /> Upload</span></Button>
              <input type="file" className="hidden" onChange={onUpload} />
            </label>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const style = getFileTypeStyle(item.file_type || "");
            return (
              <Card key={item.id} className="p-4 group hover:shadow-md transition-all border-border/60">
                <div className="flex items-start gap-4">
                  <div className={`h-11 w-11 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                    <FileText className={`h-5 w-5 ${style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{item.label || item.original_name}</h3>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 italic">"{item.notes}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingNote(item)} title="Notes">
                          <StickyNote className="h-3.5 w-3.5" />
                        </Button>
                        {item.file_url && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(item.file_url, "_blank")} title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {item.file_id && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`/view?id=${item.file_id}`, "_blank")} title="Open in vault">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemove(item)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {item.pinned_from_vault && (
                        <Badge variant="secondary" className="text-xs gap-1"><Pin className="h-2.5 w-2.5" /> From Vault</Badge>
                      )}
                      {item.file_type && <span className="text-xs text-muted-foreground uppercase font-medium">{item.file_type}</span>}
                      {item.file_size && <span className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}</span>}
                      <span className="text-xs text-muted-foreground">
                        {item.created_date ? format(new Date(item.created_date), "MMM d, yyyy") : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PinFromVaultDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        files={accessibleFiles}
        onPin={onPin}
        pinnedIds={pinnedIds}
      />

      {editingNote && (
        <WorkspaceNoteDialog
          item={editingNote}
          open={!!editingNote}
          onOpenChange={(v) => { if (!v) setEditingNote(null); }}
          onSaved={() => { onRefresh(); setEditingNote(null); }}
        />
      )}
    </div>
  );
}