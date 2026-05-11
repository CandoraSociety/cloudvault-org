import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { CATEGORIES, ACCESS_LEVELS } from "@/lib/fileHelpers";

export default function SaveVaultDialog({ onClose, onSave, defaultName, defaultCategory }) {
  const [saveName, setSaveName] = useState(defaultName || "");
  const [saveCategory, setSaveCategory] = useState(defaultCategory || "general");
  const [saveAccess, setSaveAccess] = useState("personal");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ saveName, saveCategory, saveAccess });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h3 className="font-semibold">Save to Vault</h3>
        <div className="space-y-2">
          <Label>File Name</Label>
          <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="File name" />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={saveCategory} onValueChange={setSaveCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Access Level</Label>
          <Select value={saveAccess} onValueChange={setSaveAccess}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ACCESS_LEVELS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save</>}
          </Button>
        </div>
      </div>
    </div>
  );
}