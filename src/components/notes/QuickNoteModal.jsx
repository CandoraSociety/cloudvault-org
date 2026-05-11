import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, X } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function QuickNoteModal({ isOpen, onClose }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [tags, setTags] = useState("");
  const [formatting, setFormatting] = useState(null);
  const [loadingFormat, setLoadingFormat] = useState(false);
  const queryClient = useQueryClient();

  // Fetch collections
  const { data: collections = [] } = useQuery({
    queryKey: ["collections"],
    queryFn: () => base44.entities.Collection.list(),
    enabled: isOpen,
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData) => {
      return await base44.entities.Note.create(noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      reset();
      onClose();
    },
  });

  const handleFormatContent = async () => {
    if (!content.trim()) return;
    
    setLoadingFormat(true);
    try {
      const res = await base44.functions.invoke("formatNoteContent", { content });
      setFormatting(res.data);
      // Apply the formatted HTML
      setContent(res.data.formatted_html);
    } catch (error) {
      console.error("Formatting error:", error);
    } finally {
      setLoadingFormat(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    const noteData = {
      title,
      content,
      owner_email: (await base44.auth.me()).email,
      ...(collectionId && { collection_id: collectionId }),
      ...(tags.trim() && { tags: tags.split(",").map(t => t.trim()).filter(Boolean) }),
    };

    createNoteMutation.mutate(noteData);
  };

  const reset = () => {
    setTitle("");
    setContent("");
    setCollectionId("");
    setTags("");
    setFormatting(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Save Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              placeholder="Give your note a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Content</Label>
            <ReactQuill
              value={content}
              onChange={setContent}
              theme="snow"
              placeholder="Start typing your note..."
              modules={{
                toolbar: [
                  [{ header: [2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["blockquote", "code-block"],
                  [{ align: [] }],
                  ["link"],
                  ["clean"],
                ],
              }}
              className="bg-white rounded-md"
            />
          </div>

          {/* AI Format Suggestion */}
          {content.trim() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFormatContent}
              disabled={loadingFormat}
              className="gap-2 w-full"
            >
              {loadingFormat ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Improve Formatting with AI
            </Button>
          )}

          {/* Formatting suggestions */}
          {formatting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-2">Improvements applied:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                {formatting.suggestions.map((suggestion, idx) => (
                  <li key={idx}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Collection (optional) */}
          <div className="space-y-2">
            <Label htmlFor="collection">Collection (optional)</Label>
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger id="collection">
                <SelectValue placeholder="Select collection or leave blank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No collection</SelectItem>
                {collections.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g. urgent, project-x, review"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || createNoteMutation.isPending}
          >
            {createNoteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}