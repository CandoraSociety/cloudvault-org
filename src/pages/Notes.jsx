import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Trash2, Pin, Copy, Archive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import QuickNoteModal from "@/components/notes/QuickNoteModal";
import { useAuth } from "@/lib/AuthContext";

export default function Notes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const noteIdFromUrl = urlParams.get("id");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => base44.entities.Note.filter({ owner_email: user?.email }, "-created_date"),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
      setEditingNote(null);
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, is_pinned }) =>
      base44.entities.Note.update(id, { is_pinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  useEffect(() => {
    if (noteIdFromUrl && notes.length > 0) {
      const note = notes.find((n) => n.id === noteIdFromUrl);
      if (note) setEditingNote(note);
    }
  }, [noteIdFromUrl, notes]);

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      (n.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const otherNotes = filteredNotes.filter((n) => !n.is_pinned);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (editingNote) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => {
            setEditingNote(null);
            navigate("/notes");
          }}>
            <Archive className="h-4 w-4" />
          </Button>
          <Input
            value={editingNote.title}
            onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
            placeholder="Note title..."
            className="text-lg font-semibold border-0"
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => togglePinMutation.mutate({ id: editingNote.id, is_pinned: !editingNote.is_pinned })}
            >
              <Pin className={`h-4 w-4 mr-1 ${editingNote.is_pinned ? "fill-current" : ""}`} />
              {editingNote.is_pinned ? "Pinned" : "Pin"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(editingNote.content.replace(/<[^>]*>/g, ""));
                toast.success("Content copied");
              }}
            >
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(editingNote)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                await base44.entities.Note.update(editingNote.id, editingNote);
                toast.success("Note saved");
                queryClient.invalidateQueries({ queryKey: ["notes"] });
              }}
            >
              Save
            </Button>
          </div>
        </div>
        <ReactQuill
          value={editingNote.content}
          onChange={(content) => setEditingNote({ ...editingNote, content })}
          theme="snow"
          className="bg-white rounded-lg"
          style={{ minHeight: "60vh" }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowQuickNote(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Note
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="pl-10"
        />
      </div>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Pin className="h-4 w-4" /> Pinned
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setEditingNote(note)}
                onDelete={() => handleDelete(note)}
                onTogglePin={() => togglePinMutation.mutate({ id: note.id, is_pinned: false })}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Notes */}
      {otherNotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            All Notes
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setEditingNote(note)}
                onDelete={() => handleDelete(note)}
                onTogglePin={() => togglePinMutation.mutate({ id: note.id, is_pinned: true })}
              />
            ))}
          </div>
        </div>
      )}

      {filteredNotes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No notes found. Create your first note!</p>
          <Button onClick={() => setShowQuickNote(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Create Note
          </Button>
        </div>
      )}

      {/* Quick Note Modal */}
      {showQuickNote && (
        <QuickNoteModal
          onClose={() => setShowQuickNote(false)}
          onCreate={(newNote) => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
            setShowQuickNote(false);
            setEditingNote(newNote);
          }}
        />
      )}
    </div>
  );

  function handleDelete(note) {
    if (window.confirm(`Delete note "${note.title}"?`)) {
      deleteNoteMutation.mutate(note.id);
    }
  }
}

function NoteCard({ note, onClick, onDelete, onTogglePin }) {
  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {note.is_pinned && <Pin className="h-3 w-3 text-primary" />}
          {note.title}
        </h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onTogglePin(); }} className="text-muted-foreground hover:text-foreground">
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3">
        {note.content.replace(/<[^>]*>/g, "")}
      </p>
      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {note.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}