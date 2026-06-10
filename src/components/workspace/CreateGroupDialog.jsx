import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export default function CreateGroupDialog({ onClose, onCreate }) {
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">New Workspace Group</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="space-y-2">
          <Label>Group Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Grant Submission 2024" />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create Group</Button>
        </div>
      </div>
    </div>
  );
}