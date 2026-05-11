import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, X, Save, Loader2 } from "lucide-react";
import { ACCESS_LEVELS } from "@/lib/fileHelpers";
import { toast } from "sonner";

export default function ShareDialog({ file, onClose, onSave }) {
  const [emails, setEmails] = useState(file?.finance_authorized_emails || []);
  const [emailInput, setEmailInput] = useState("");
  const [accessLevel, setAccessLevel] = useState(file?.access_level || "personal");
  const [saving, setSaving] = useState(false);

  const addEmail = () => {
    const em = emailInput.trim().toLowerCase();
    if (em && !emails.includes(em)) { setEmails([...emails, em]); setEmailInput(""); }
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.File.update(file.id, {
      access_level: accessLevel,
      finance_authorized_emails: emails,
    });
    toast.success("Access settings updated!");
    setSaving(false);
    onSave?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Share2 className="h-4 w-4" /> Share Access</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2">
          <Label>Access Level</Label>
          <Select value={accessLevel} onValueChange={setAccessLevel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACCESS_LEVELS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label} — {a.description}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Share with specific users (email)</Label>
          <p className="text-xs text-muted-foreground">These users will be able to access the file regardless of their role.</p>
          <div className="flex gap-2">
            <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="user@company.com" type="email"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())} />
            <Button variant="outline" onClick={addEmail}>Add</Button>
          </div>
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {emails.map((em) => (
                <Badge key={em} variant="secondary" className="gap-1 pr-1">
                  {em}
                  <button onClick={() => setEmails(emails.filter((e) => e !== em))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
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