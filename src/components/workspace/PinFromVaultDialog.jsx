import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pin } from "lucide-react";
import FilePickerGrid from "@/components/collections/FilePickerGrid";

export default function PinFromVaultDialog({ open, onOpenChange, files, onPin, pinnedIds }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const unpinnedFiles = files.filter((f) => !pinnedIds.includes(f.id));

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePin = () => {
    if (selectedIds.length === 0) return;
    const selected = files.filter((f) => selectedIds.includes(f.id));
    onPin(selected);
    setSelectedIds([]);
  };

  const handleClose = (val) => {
    if (!val) setSelectedIds([]);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pin Files from Vault</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">Select one or more vault files to add to your workspace. Files remain in their original location — this just gives you quick access.</p>
          <FilePickerGrid files={unpinnedFiles} selectedIds={selectedIds} onToggle={handleToggle} />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {selectedIds.length > 0 ? `${selectedIds.length} file${selectedIds.length !== 1 ? "s" : ""} selected` : "No files selected"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button disabled={selectedIds.length === 0} onClick={handlePin} className="gap-2">
                <Pin className="h-4 w-4" /> Pin {selectedIds.length > 1 ? `${selectedIds.length} Files` : "to Workspace"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}