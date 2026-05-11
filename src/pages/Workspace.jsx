import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Download, Trash2, FileText, Pin, FolderOpen, Loader2, ExternalLink, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { canAccessFile, getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import { format } from "date-fns";
import PinFromVaultDialog from "@/components/workspace/PinFromVaultDialog";
import WorkspaceNoteDialog from "@/components/workspace/WorkspaceNoteDialog";

export default function Workspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["workspace", user?.email],
    queryFn: () => base44.entities.WorkspaceItem.filter({ owner_email: user?.email }, "-created_date"),
  });

  const { data: allFiles = [] } = useQuery({
    queryKey: ["files"],
    queryFn: () => base44.entities.File.list("-created_date", 500),
  });

  const accessibleFiles = allFiles.filter((f) => canAccessFile(f, user));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.WorkspaceItem.create({
        owner_email: user.email,
        file_url,
        original_name: file.name,
        file_type: getFileExtension(file.name),
        file_size: file.size,
        pinned_from_vault: false,
      });
      queryClient.invalidateQueries({ queryKey: ["workspace", user?.email] });
      toast.success("File added to workspace");
    } finally {
      setUploading(false);
    }
  };

  const handlePinFromVault = async (vaultFile) => {
    const exists = items.find((i) => i.file_id === vaultFile.id);
    if (exists) { toast.info("Already in workspace"); return; }
    await base44.entities.WorkspaceItem.create({
      owner_email: user.email,
      file_id: vaultFile.id,
      file_url: vaultFile.file_url,
      original_name: vaultFile.display_name || vaultFile.original_name,
      file_type: getFileExtension(vaultFile.original_name),
      file_size: vaultFile.file_size,
      pinned_from_vault: true,
      label: vaultFile.display_name || vaultFile.original_name,
    });
    queryClient.invalidateQueries({ queryKey: ["workspace", user?.email] });
    toast.success("File pinned to workspace");
    setShowPinDialog(false);
  };

  const handleRemove = async (item) => {
    await base44.entities.WorkspaceItem.delete(item.id);
    queryClient.invalidateQueries({ queryKey: ["workspace", user?.email] });
    toast.success("Removed from workspace");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Your personal working area — upload, pin, annotate, and manage files for any task</p>
        </div>
        <div className="flex gap-2">
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
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Your workspace is empty</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Upload files or pin items from the vault to get started</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setShowPinDialog(true)} className="gap-2">
              <Pin className="h-4 w-4" /> Pin from Vault
            </Button>
            <label>
              <Button asChild className="gap-2"><span><Upload className="h-4 w-4" /> Upload File</span></Button>
              <input type="file" className="hidden" onChange={handleUpload} />
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingNote(item)} title="Add note">
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
                      {item.file_type && (
                        <span className="text-xs text-muted-foreground uppercase font-medium">{item.file_type}</span>
                      )}
                      {item.file_size && (
                        <span className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}</span>
                      )}
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
        onPin={handlePinFromVault}
        pinnedIds={items.filter((i) => i.file_id).map((i) => i.file_id)}
      />

      {editingNote && (
        <WorkspaceNoteDialog
          item={editingNote}
          open={!!editingNote}
          onOpenChange={(v) => { if (!v) setEditingNote(null); }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["workspace", user?.email] });
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}