import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Folder, Loader2, Upload, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import WorkspaceGroup from "@/components/workspace/WorkspaceGroup";
import CreateGroupDialog from "@/components/workspace/CreateGroupDialog";
import PinFromVaultDialog from "@/components/workspace/PinFromVaultDialog";
import { useAuth } from "@/lib/AuthContext";

export default function Workspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const { data: workspaceItems = [], isLoading } = useQuery({
    queryKey: ["workspace-items", user?.email],
    queryFn: () => base44.entities.WorkspaceItem.filter({ owner_email: user?.email }, "-created_date"),
  });

  const { data: vaultFiles = [] } = useQuery({
    queryKey: ["vault-files"],
    queryFn: () => base44.entities.File.list("-created_date", 1000),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkspaceItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      toast.success("Item removed from workspace");
    },
  });

  const handleDelete = (item) => {
    if (window.confirm(`Remove "${item.original_name}" from your workspace?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  // Group items by workspace_group
  const groupedItems = workspaceItems.reduce((acc, item) => {
    const group = item.workspace_group || "Ungrouped";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personal workspace for active projects and frequently accessed files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPinDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Pin from Vault
          </Button>
          <Button onClick={() => setShowCreateGroup(true)} className="gap-2">
            <Folder className="h-4 w-4" /> New Group
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {workspaceItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <p className="text-muted-foreground mb-6">
              Your workspace is empty. Pin files from the vault or upload new ones to get started.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setShowPinDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Pin from Vault
              </Button>
              <a href="/upload">
                <Button className="gap-2">
                  <Upload className="h-4 w-4" /> Upload File
                </Button>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([groupName, items]) => (
            <WorkspaceGroup
              key={groupName}
              groupName={groupName}
              items={items}
              vaultFiles={vaultFiles}
              onDelete={handleDelete}
              onUngroup={() => {
                // Ungroup logic would go here
              }}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showCreateGroup && (
        <CreateGroupDialog
          onClose={() => setShowCreateGroup(false)}
          onCreate={(groupName) => {
            toast.success(`Group "${groupName}" created`);
            setShowCreateGroup(false);
          }}
        />
      )}

      {showPinDialog && (
        <PinFromVaultDialog
          files={vaultFiles}
          onClose={() => setShowPinDialog(false)}
          onPin={(file, groupName) => {
            // Pin logic handled in component
            queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
            setShowPinDialog(false);
          }}
        />
      )}
    </div>
  );
}