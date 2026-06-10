import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function CreateCollectionDialog({ onClose, onCreate }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const handleCreate = async () => {
    if (!name.trim()) return;

    const newCollection = await base44.entities.Collection.create({
      name: name.trim(),
      description,
      color,
      owner_email: user?.email,
      status: "active",
      file_ids: [],
    });

    toast.success("Collection created!");
    onCreate?.(newCollection);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">New Collection</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Grant Submission 2024" />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Purpose of this collection..." rows={3} />
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex gap-2">
            {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-primary scale-110" : "border-border"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create Collection</Button>
        </div>
      </div>
    </div>
  );
}