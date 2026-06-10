import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function QuickNoteModal({ onClose, onCreate }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;

    const newNote = await base44.entities.Note.create({
      title,
      content: `<p>${content.replace(/\n/g, "<br/>")}</p>`,
      tags,
      owner_email: user?.email,
      is_pinned: false,
    });

    toast.success("Note created!");
    onCreate(newNote);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
          <h3 className="font-semibold">New Note</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title..." className="text-lg font-semibold" />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              className="w-full min-h-[200px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button variant="outline" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end px-5 py-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || !content.trim()}>Create Note</Button>
        </div>
      </div>
    </div>
  );
}