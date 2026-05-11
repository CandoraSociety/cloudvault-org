import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, FileText, Pin, FolderOpen, Loader2, Plus, ChevronRight, FolderHeart, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { canAccessFile, getFileExtension } from "@/lib/fileHelpers";
import WorkspaceGroup from "@/components/workspace/WorkspaceGroup";
import CreateGroupDialog from "@/components/workspace/CreateGroupDialog";
import PinFromVaultDialog from "@/components/workspace/PinFromVaultDialog";

export default function Workspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["workspace", user?.email],
    queryFn: () => base44.entities.WorkspaceItem.filter({ owner_email: user?.email }, "-created_date"),
  });

  const { data: allFiles = [] } = useQuery({
    queryKey: ["files"],
    queryFn: () => base44.entities.File.list("-created_date", 500),
  });

  const accessibleFiles = allFiles.filter((f) => canAccessFile(f, user));

  // Derive unique group names
  const groups = [...new Set(items.map((i) => i.workspace_group).filter(Boolean))];
  const ungroupedItems = items.filter((i) => !i.workspace_group);

  const handleCreateGroup = async (groupName) => {
    // Just set the active group — items will be added to it
    setActiveGroup(groupName);
    setShowCreateGroup(false);
    toast.success(`Group "${groupName}" created`);
    queryClient.invalidateQueries({ queryKey: ["workspace", user?.email] });
  };

  const handleUpload = async (e, groupName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.WorkspaceItem.create({
        owner_email: user.email,
        workspace_group: groupName || null,
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

  const handlePinFromVault = async (vaultFile, groupName) => {
    const exists = items.find((i) => i.file_id === vaultFile.id && i.workspace_group === groupName);
    if (exists) { toast.info("Already in this group"); return; }
    await base44.entities.WorkspaceItem.create({
      owner_email: user.email,
      workspace_group: groupName || null,
      file_id: vaultFile.id,
      file_url: vaultFile.file_url,
      original_name: vaultFile.display_name || vaultFile.original_name,
      file_type: getFileExtension(vaultFile.original_name),
      file_size: vaultFile.file_size,
      pinned_from_vault: true,
      label: vaultFile.display_name || vaultFile.original_name,
    });
    queryClient.invalidateQueries({ queryKey: ["workspace", user?.email] });
    toast.success("File pinned to group");
    setShowPinDialog(false);
  };

  const handleDeleteGroup = async (groupName) => {
    if (!confirm(`Delete group "${groupName}" and all its files?`)) return;
    const groupItems = items.filter((i) => i.workspace_group === groupName);
    await Promise.all(groupItems.map((i) => base44.entities.WorkspaceItem.delete(i.id)));
    queryClient.invalidateQueries({ queryKey: ["workspace", user?.email] });
    if (activeGroup === groupName) setActiveGroup(null);
    toast.success("Group deleted");
  };

  // When activeGroup is set, show that group's detail view
  if (activeGroup !== null) {
    const groupItems = items.filter((i) => i.workspace_group === activeGroup);
    return (
      <WorkspaceGroup
        groupName={activeGroup}
        items={groupItems}
        accessibleFiles={accessibleFiles}
        uploading={uploading}
        onUpload={(e) => handleUpload(e, activeGroup)}
        onPin={(file) => handlePinFromVault(file, activeGroup)}
        onBack={() => setActiveGroup(null)}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["workspace", user?.email] })}
        pinnedIds={items.filter((i) => i.file_id && i.workspace_group === activeGroup).map((i) => i.file_id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Personal working areas — create named groups for each task, project, or submission</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateGroup(true)}>
          <Plus className="h-4 w-4" /> New Group
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20">
          <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No workspace groups yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create a named group for each task — e.g. "Grant Submission", "Insurance Package", "Q1 Reports"</p>
          <Button onClick={() => setShowCreateGroup(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create First Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((groupName) => {
            const groupItems = items.filter((i) => i.workspace_group === groupName);
            return (
              <Card
                key={groupName}
                className="p-5 hover:shadow-md transition-all cursor-pointer group border-border/60 hover:border-primary/20"
                onClick={() => setActiveGroup(groupName)}
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderHeart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">{groupName}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(groupName); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {groupItems.length} {groupItems.length === 1 ? "file" : "files"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-3 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                  Open <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        existingGroups={groups}
        onCreate={handleCreateGroup}
      />

      <PinFromVaultDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        files={accessibleFiles}
        onPin={(f) => handlePinFromVault(f, activeGroup)}
        pinnedIds={[]}
      />
    </div>
  );
}