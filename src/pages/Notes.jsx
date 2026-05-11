import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2, Pin, PinOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => base44.entities.Note.list("-updated_date", 100),
  });

  // Fetch collections
  const { data: collections = [] } = useQuery({
    queryKey: ["collections"],
    queryFn: () => base44.entities.Collection.list(),
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNote(null);
    },
  });

  // Pin/unpin mutation
  const togglePinMutation = useMutation({
    mutationFn: (noteData) => base44.entities.Note.update(noteData.id, { is_pinned: noteData.is_pinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCollection = !collectionFilter || note.collection_id === collectionFilter;

    return matchesSearch && matchesCollection;
  });

  const getCollectionName = (collectionId) => {
    return collections.find((c) => c.id === collectionId)?.name || "No collection";
  };

  if (selectedNote) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="ghost" onClick={() => setSelectedNote(null)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{selectedNote.title}</CardTitle>
              {selectedNote.collection_id && (
                <Badge variant="secondary" className="mb-2">
                  {getCollectionName(selectedNote.collection_id)}
                </Badge>
              )}
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedNote.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  togglePinMutation.mutate({
                    id: selectedNote.id,
                    is_pinned: !selectedNote.is_pinned,
                  })
                }
              >
                {selectedNote.is_pinned ? (
                  <PinOff className="h-4 w-4" />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteNoteMutation.mutate(selectedNote.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedNote.content }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Notes</h1>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={collectionFilter} onValueChange={setCollectionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All collections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All collections</SelectItem>
              {collections.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {notesLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-muted-foreground">No notes found</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedNote(note)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{note.title}</CardTitle>
                  {note.is_pinned && <Pin className="h-4 w-4 text-primary shrink-0" />}
                </div>
                {note.collection_id && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {getCollectionName(note.collection_id)}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div
                  className="text-sm text-muted-foreground line-clamp-3"
                  dangerouslySetInnerHTML={{
                    __html: note.content.replace(/<[^>]*>/g, ""),
                  }}
                />
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {note.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{note.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}