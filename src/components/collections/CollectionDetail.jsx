import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Download, Trash2, FileText, FolderHeart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import { format } from "date-fns";
import FilePickerGrid from "./FilePickerGrid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CollectionDetail({ collection, allFiles, onBack }) {
  const queryClient = useQueryClient();
  const [showAddFiles, setShowAddFiles] = useState(false);
  const [addingIds, setAddingIds] = useState([]);

  const collectionFiles = allFiles.filter((f) => collection.file_ids?.includes(f.id));
  const nonCollectionFiles = allFiles.filter((f) => !collection.file_ids?.includes(f.id));

  const handleRemoveFile = async (fileId) => {
    const updated = (collection.file_ids || []).filter((id) => id !== fileId);
    await base44.entities.Collection.update(collection.id, { file_ids: updated });
    queryClient.invalidateQueries({ queryKey: ["collections"] });
    collection.file_ids = updated;
    toast.success("File removed from collection");
  };

  const handleAddFiles = async () => {
    const merged = [...new Set([...(collection.file_ids || []), ...addingIds])];
    await base44.entities.Collection.update(collection.id, { file_ids: merged });
    collection.file_ids = merged;
    queryClient.invalidateQueries({ queryKey: ["collections"] });
    toast.success(`${addingIds.length} file${addingIds.length !== 1 ? "s" : ""} added`);
    setAddingIds([]);
    setShowAddFiles(false);
  };

  const handleDownloadAll = () => {
    collectionFiles.forEach((f) => { if (f.file_url) window.open(f.file_url, "_blank"); });
    toast.success(`Opening ${collectionFiles.length} files for download`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FolderHeart className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold truncate">{collection.name}</h1>
          </div>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{collection.description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {collectionFiles.length > 0 && (
            <Button variant="outline" className="gap-2" onClick={handleDownloadAll}>
              <Package className="h-4 w-4" /> Download All
            </Button>
          )}
          <Button className="gap-2" onClick={() => setShowAddFiles(true)}>
            <Plus className="h-4 w-4" /> Add Files
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary">{collectionFiles.length} {collectionFiles.length === 1 ? "file" : "files"}</Badge>
        {collection.created_date && (
          <span className="text-xs text-muted-foreground">Created {format(new Date(collection.created_date), "MMM d, yyyy")}</span>
        )}
      </div>

      {collectionFiles.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No files in this collection</p>
          <Button className="mt-4 gap-2" onClick={() => setShowAddFiles(true)}>
            <Plus className="h-4 w-4" /> Add Files
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {collectionFiles.map((file) => {
            const ext = getFileExtension(file.original_name);
            const style = getFileTypeStyle(ext);
            return (
              <Card key={file.id} className="p-4 group hover:shadow-md transition-all border-border/60">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                    <FileText className={`h-5 w-5 ${style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.display_name || file.original_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{file.category?.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-muted-foreground uppercase">{ext}</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(file.file_url, "_blank")}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveFile(file.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAddFiles} onOpenChange={setShowAddFiles}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Files to Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <FilePickerGrid files={nonCollectionFiles} selectedIds={addingIds} onToggle={(id) => setAddingIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowAddFiles(false); setAddingIds([]); }}>Cancel</Button>
              <Button onClick={handleAddFiles} disabled={addingIds.length === 0}>
                Add {addingIds.length > 0 ? addingIds.length : ""} Files
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}