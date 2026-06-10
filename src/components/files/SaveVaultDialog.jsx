import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function SaveVaultDialog({ fileData, open, onOpenChange, onSuccess }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(fileData?.displayName || "");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!fileData?.file_url) throw new Error("No file to save");

      await base44.entities.File.create({
        original_name: fileData.originalName || "edited-file.png",
        standardized_name: `${category}_${displayName || "edited"}`.toLowerCase().replace(/\s+/g, "_"),
        display_name: displayName || fileData.originalName?.replace(/\.[^/.]+$/, ""),
        description,
        file_url: fileData.file_url,
        file_type: fileData.fileType || "png",
        file_size: fileData.fileSize || 0,
        category,
        access_level: "personal",
        owner_email: user?.email,
        owner_name: user?.full_name,
      });

      await queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onSuccess: () => {
      toast.success("File saved to vault");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save file");
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Save to Vault</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter a name for this file"
            />
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>

          <div>
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="general">General</option>
              <option value="photo">Photo</option>
              <option value="document">Document</option>
              <option value="spreadsheet">Spreadsheet</option>
              <option value="presentation">Presentation</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}