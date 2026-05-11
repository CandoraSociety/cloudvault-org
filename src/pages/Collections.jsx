import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderHeart, Trash2, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { canAccessFile } from "@/lib/fileHelpers";
import CreateCollectionDialog from "@/components/collections/CreateCollectionDialog";
import CollectionDetail from "@/components/collections/CollectionDetail";
import { format } from "date-fns";

const COLORS = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

export default function Collections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: () => base44.entities.Collection.filter({ owner_email: user?.email }),
  });

  const { data: allFiles = [] } = useQuery({
    queryKey: ["files"],
    queryFn: () => base44.entities.File.list("-created_date", 500),
  });

  const accessibleFiles = allFiles.filter((f) => canAccessFile(f, user));

  const handleDelete = async (col) => {
    if (!confirm(`Delete collection "${col.name}"?`)) return;
    await base44.entities.Collection.delete(col.id);
    queryClient.invalidateQueries({ queryKey: ["collections"] });
    toast.success("Collection deleted");
  };

  if (selectedCollection) {
    return (
      <CollectionDetail
        collection={selectedCollection}
        allFiles={accessibleFiles}
        onBack={() => { setSelectedCollection(null); queryClient.invalidateQueries({ queryKey: ["collections"] }); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">File Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">Group files together for submissions, projects, or tasks</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Collection
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-20">
          <FolderHeart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No collections yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create a collection to group files for a grant, project, or submission</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create First Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col, i) => {
            const colorClass = col.color || COLORS[i % COLORS.length];
            const fileCount = col.file_ids?.length || 0;
            return (
              <Card
                key={col.id}
                className="p-5 hover:shadow-md transition-all cursor-pointer group border-border/60 hover:border-primary/20"
                onClick={() => setSelectedCollection(col)}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-11 w-11 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}>
                    <FolderHeart className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">{col.name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(col); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {col.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{col.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <FileText className="h-3 w-3" /> {fileCount} {fileCount === 1 ? "file" : "files"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {col.created_date ? format(new Date(col.created_date), "MMM d, yyyy") : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-3 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                  Open <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCollectionDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        allFiles={accessibleFiles}
        userEmail={user?.email}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["collections"] })}
      />
    </div>
  );
}