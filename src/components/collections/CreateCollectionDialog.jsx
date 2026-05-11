import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import FilePickerGrid from "./FilePickerGrid";

const COLORS = [
  { label: "Blue", value: "bg-blue-500" },
  { label: "Purple", value: "bg-purple-500" },
  { label: "Green", value: "bg-green-500" },
  { label: "Orange", value: "bg-orange-500" },
  { label: "Pink", value: "bg-pink-500" },
  { label: "Teal", value: "bg-teal-500" },
];

export default function CreateCollectionDialog({ open, onOpenChange, allFiles, userEmail, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("bg-blue-500");
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Please enter a collection name"); return; }
    setSaving(true);
    try {
      await base44.entities.Collection.create({
        name: name.trim(),
        description: description.trim(),
        color,
        file_ids: selectedIds,
        owner_email: userEmail,
        status: "active",
      });
      toast.success("Collection created");
      onCreated?.();
      onOpenChange(false);
      setName(""); setDescription(""); setSelectedIds([]); setColor("bg-blue-500");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New File Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label>Collection Name</Label>
            <Input placeholder="e.g. Grant Submission 2024, Insurance Package..." value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea placeholder="What is this collection for?" value={description} onChange={(e) => setDescription(e.target.value)} className="h-20" />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`h-7 w-7 rounded-full ${c.value} transition-all ${color === c.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-60 hover:opacity-100"}`}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Select Files <span className="text-muted-foreground">({selectedIds.length} selected)</span></Label>
            <FilePickerGrid files={allFiles} selectedIds={selectedIds} onToggle={(id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Collection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}