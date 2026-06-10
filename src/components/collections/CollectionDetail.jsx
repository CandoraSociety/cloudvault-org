import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FolderOpen, Plus, X, ExternalLink, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getFileExtension, getFileTypeStyle } from "@/lib/fileHelpers";
import { toast } from "sonner";

export default function CollectionDetail({ collection, files, onBack, onDelete }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const collectionFiles = files.filter((f) => collection.file_ids?.includes(f.id));
  const filteredFiles = collectionFiles.filter(
    (f) => f.display_name?.toLowerCase().includes(search.toLowerCase()) || f.original_name?.toLowerCase().includes(search.toLowerCase())
  );

  const removeFileMutation = useMutation({
    mutationFn: async (fileId) => {
      const newFileIds = collection.file_ids.filter((id) => id !== fileId);
      await base44.entities.Collection.update(collection.id, { file_ids: newFileIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("File removed from collection");
    },
  });

  const handleRemoveFile = (fileId) => {
    removeFileMutation.mutate(fileId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: collection.color || "#e2e8f0" }}
        >
          <FolderOpen className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{collection.name}</h1>
          <p className="text-sm text-muted-foreground">
            {collectionFiles.length} file{collectionFiles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onDelete}>Delete Collection</Button>
      </div>

      {collection.description && (
        <p className="text-sm text-muted-foreground">{collection.description}</p>
      )}

      <div className="relative">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search in collection..."
          className="pl-10"
        />
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {collectionFiles.length === 0 ? "No files in this collection yet." : "No files match your search."}
          </p>
          {collectionFiles.length === 0 && (
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add Files
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file) => {
            const ext = getFileExtension(file.original_name);
            const style = getFileTypeStyle(ext);
            return (
              <div key={file.id} className="p-4 border rounded-lg bg-card hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`h-10 w-10 rounded-lg ${style.bg} flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${style.color}`}>{ext.toUpperCase()}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveFile(file.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="font-medium text-sm truncate">{file.display_name || file.original_name}</h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">{file.standardized_name}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => window.open(file.file_url, "_blank")}>
                    <Download className="h-3 w-3 mr-1" /> Download
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8" onClick={() => window.open(`/view?id=${file.id}`, "_blank")}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}