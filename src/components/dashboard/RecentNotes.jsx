import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StickyNote, ArrowRight, Pin } from "lucide-react";

export default function RecentNotes({ notes = [] }) {
  if (!notes || notes.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            Recent Notes
          </CardTitle>
          <Link to="/notes" className="text-primary hover:underline text-sm font-medium">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">No notes yet. Start taking notes!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-primary" />
          Recent Notes
        </CardTitle>
        <Link to="/notes" className="text-primary hover:underline text-sm font-medium">
          View All
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notes.slice(0, 5).map((note) => (
            <Link
              key={note.id}
              to="/notes"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/notes?id=${note.id}`;
              }}
              className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors truncate flex items-center gap-2">
                    {note.is_pinned && <Pin className="h-3 w-3 shrink-0" />}
                    {note.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {note.content.replace(/<[^>]*>/g, "")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}