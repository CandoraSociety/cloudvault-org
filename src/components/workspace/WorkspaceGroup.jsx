import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Folder, X, ExternalLink, Download, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getFileExtension, getFileTypeStyle } from "@/lib/fileHelpers";
import { toast } from "sonner";
import PinFromVaultDialog from "./PinFromVaultDialog";

export default function WorkspaceGroup({ groupName, items, vaultFiles, onDelete, onUngroup }) {
  const queryClient = useQueryClient();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkspaceItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      toast.success("Item removed");
    },
  });

  const handleRemove = (itemId) => {
    if (window.confirm("Remove this item from your workspace?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  return (
    <>
      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{groupName}</h2>
            </button>
            <Badge variant="secondary">{items.length} items</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPinDialog(true)}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No items in this group</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const ext = getFileExtension(item.original_name);
                  const style = getFileTypeStyle(ext);
                  return (
                    <div key={item.id} className="p-3 border rounded-lg hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center`}>
                          <span className={`text-xs font-bold ${style.color}`}>{ext.toUpperCase()}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(item.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <h3 className="font-medium text-sm truncate">{item.label || item.original_name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.file_type?.toUpperCase()} · {Math.round(item.file_size / 1024)} KB</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => window.open(item.file_url, "_blank")}>
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 w-7" onClick={() => window.open(`/view?id=${item.file_id}`, "_blank")}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showPinDialog && (
        <PinFromVaultDialog
          files={vaultFiles}
          onClose={() => setShowPinDialog(false)}
          onPin={() => {
            queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
            setShowPinDialog(false);
          }}
        />
      )}
    </>
  );
}