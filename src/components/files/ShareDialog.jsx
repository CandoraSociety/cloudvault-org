import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Link as LinkIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function ShareDialog({ file, open, onOpenChange }) {
  const { user } = useAuth();
  const [emails, setEmails] = useState("");
  const [accessLevel, setAccessLevel] = useState("view");
  const [isSharing, setIsSharing] = useState(false);

  const shareMutation = useMutation({
    mutationFn: async () => {
      const emailList = emails.split(",").map((e) => e.trim()).filter(Boolean);
      if (emailList.length === 0) throw new Error("Please enter at least one email");

      for (const email of emailList) {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `${user?.full_name} shared a file with you`,
          body: `Hi,\n\n${user?.full_name} has shared "${file?.display_name || file?.original_name}" with you.\n\nAccess level: ${accessLevel}\n\nBest regards,\nCloudVault Team`,
        });
      }
    },
    onSuccess: () => {
      toast.success(`File shared with ${emails.split(",").length} recipient(s)`);
      setEmails("");
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to share file");
    },
  });

  const handleShare = () => {
    if (!emails.trim()) return;
    setIsSharing(true);
    shareMutation.mutate();
  };

  const copyLink = () => {
    const url = `${window.location.origin}/view?id=${file?.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Share File</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">{file.display_name || file.original_name}</p>
            <p className="text-xs text-muted-foreground">Share this file with others</p>
          </div>

          <div>
            <Label>Send via Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Separate multiple emails with commas</p>
          </div>

          <div>
            <Label>Access Level</Label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="view">View Only</option>
              <option value="edit">Can Edit</option>
              <option value="download">Can Download</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <Label>Or share via link</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input value={`${window.location.origin}/view?id=${file?.id}`} readOnly className="text-xs" />
              <Button variant="outline" size="sm" onClick={copyLink}><LinkIcon className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleShare} disabled={isSharing || !emails.trim()}>
            {isSharing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sharing...</> : "Share"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}