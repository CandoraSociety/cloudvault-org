import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pin } from "lucide-react";
import FilePickerGrid from "@/components/collections/FilePickerGrid";

export default function PinFromVaultDialog({ open, onOpenChange, files, onPin, pinnedIds }) {
  const [selectedId, setSelectedId] = React.useState(null);

  const unpinnedFiles = files.filter((f) => !pinnedIds.includes(f.id));

  const handleToggle = (id) => setSelectedId((prev) => prev === id ? null : id);

  const handlePin = () => {
    if (!selectedId) return;
    const file = files.find((f) => f.id === selectedId);
    if (file) { onPin(file); setSelectedId(null); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pin File from Vault</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">Select a vault file to add to your workspace. Vault files remain in their original location — this just gives you quick access.</p>
          <FilePickerGrid files={unpinnedFiles} selectedIds={selectedId ? [selectedId] : []} onToggle={handleToggle} />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!selectedId} onClick={handlePin} className="gap-2">
              <Pin className="h-4 w-4" /> Pin to Workspace
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}