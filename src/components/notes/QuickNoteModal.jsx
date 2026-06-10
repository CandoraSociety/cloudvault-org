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
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function QuickNoteModal({ open, onOpenChange, editingNote, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(editingNote?.title || "");
  const [content, setContent] = useState(editingNote?.content || "");
  const [tags, setTags] = useState(editingNote?.tags?.join(", ") || "");
  const [isSaving, setIsSaving] = useState(false);

  const saveNoteMutation = useMutation({
    mutationFn: async () => {
      if (editingNote) {
        await base44.entities.Note.update(editingNote.id, {
          title,
          content,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        });
      } else {
        await base44.entities.Note.create({
          title,
          content,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          owner_email: user?.email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success(editingNote ? "Note updated" : "Note created");
      setTitle("");
      setContent("");
      setTags("");
      onClose();
    },
    onError: () => {
      toast.error("Failed to save note");
    },
  });

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);
    saveNoteMutation.mutate();
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingNote ? "Edit Note" : "New Note"}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
            />
          </div>

          <div>
            <Label>Content</Label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              className="bg-white"
              placeholder="Write your note here..."
            />
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, important, follow-up"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim() || !content.trim()}>
            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save Note"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}