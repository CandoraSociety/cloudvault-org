import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CreateGroupDialog({ open, onOpenChange, existingGroups, onCreate }) {
  const [name, setName] = useState("");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Please enter a group name"); return; }
    if (existingGroups.includes(trimmed)) { toast.error("A group with that name already exists"); return; }
    onCreate(trimmed);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Workspace Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Group Name</Label>
            <Input
              placeholder="e.g. Grant Submission 2024, Insurance Docs..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Group</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}