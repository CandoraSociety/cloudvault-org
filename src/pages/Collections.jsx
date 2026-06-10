import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Loader2, Trash2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import CreateCollectionDialog from "@/components/collections/CreateCollectionDialog";
import CollectionDetail from "@/components/collections/CollectionDetail";
import { useAuth } from "@/lib/AuthContext";

export default function Collections() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: () => base44.entities.Collection.list("-created_date"),
  });

  const { data: files = [] } = useQuery({
    queryKey: ["files"],
    queryFn: () => base44.entities.File.list("-created_date", 1000),
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id) => base44.entities.Collection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted");
      setSelectedCollection(null);
    },
  });

  const handleDelete = (collection) => {
    if (window.confirm(`Delete collection "${collection.name}"? This won't delete the files themselves.`)) {
      deleteCollectionMutation.mutate(collection.id);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedCollection) {
    return (
      <CollectionDetail
        collection={selectedCollection}
        files={files}
        onBack={() => setSelectedCollection(null)}
        onDelete={() => handleDelete(selectedCollection)}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize files into groups for easy access
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Collection
        </Button>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No collections yet. Create your first collection!</p>
          <Button onClick={() => setShowCreateDialog(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Create Collection
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const fileCount = collection.file_ids?.length || 0;
            return (
              <Card
                key={collection.id}
                className="p-5 cursor-pointer hover:shadow-md transition-all group"
                onClick={() => setSelectedCollection(collection)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: collection.color || "#e2e8f0" }}
                    >
                      <FolderOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {collection.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fileCount} file{fileCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(collection);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {collection.description && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{collection.description}</p>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className="text-xs">
                    {collection.status}
                  </Badge>
                  {collection.owner_email === user?.email && (
                    <Badge variant="secondary" className="text-xs">Owner</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreateCollectionDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={(newCollection) => {
            queryClient.invalidateQueries({ queryKey: ["collections"] });
            setShowCreateDialog(false);
          }}
        />
      )}
    </div>
  );
}