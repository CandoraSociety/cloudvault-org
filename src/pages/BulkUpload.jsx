import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import BulkFileRow from "@/components/bulk/BulkFileRow";
import PhotoSorterDialog from "@/components/bulk/PhotoSorterDialog";
import { PHOTO_EXTS, generateStandardizedName } from "@/lib/fileHelpers";

export default function BulkUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showPhotoSorter, setShowPhotoSorter] = useState(false);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const newItems = files.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      category: "to_be_sorted",
      status: "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const newItems = files.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      category: "to_be_sorted",
      status: "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleCategoryChange = (id, category) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, category } : item));
  };

  const handleRemove = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpload = async () => {
    setUploading(true);
    const photosToSort = items.filter((item) => PHOTO_EXTS.includes(item.file.name.split(".").pop()?.toLowerCase()));

    if (photosToSort.length > 0) {
      setShowPhotoSorter(true);
      return;
    }

    await performUpload();
  };

  const performUpload = async (photoAssignments = []) => {
    let uploadItems = items;
    if (photoAssignments.length > 0) {
      uploadItems = items.map((item) => {
        const assignment = photoAssignments.find((a) => a.id === item.id);
        return assignment ? { ...item, category: assignment.category } : item;
      });
    }

    setUploading(true);

    for (const item of uploadItems) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });
        const standardizedName = generateStandardizedName(item.file.name, item.category, "universal");

        await base44.entities.File.create({
          original_name: item.file.name,
          standardized_name: standardizedName,
          display_name: item.file.name.replace(/\.[^/.]+$/, ""),
          file_url,
          file_type: item.file.name.split(".").pop()?.toLowerCase(),
          file_size: item.file.size,
          category: item.category,
          access_level: "universal",
          owner_email: user?.email,
          owner_name: user?.full_name,
        });

        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "done" } : i));
      } catch (err) {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "error", error: err.message } : i));
      }
    }

    setUploading(false);
    toast.success("Bulk upload complete!");
    queryClient.invalidateQueries({ queryKey: ["files"] });
    setItems([]);
  };

  const handlePhotoSortDone = (assignments) => {
    performUpload(assignments);
  };

  const unsortedCount = items.filter((i) => i.category === "to_be_sorted").length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Upload</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload multiple files at once</p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer"
        onClick={() => document.getElementById("bulk-file-input").click()}
      >
        <input id="bulk-file-input" type="file" multiple className="hidden" onChange={handleFileSelect} />
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm font-medium">Drop multiple files here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">All files will be uploaded with universal access</p>
      </div>

      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{items.length} file{items.length !== 1 ? "s" : ""} selected</p>
            {unsortedCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowPhotoSorter(true)} className="gap-1">
                <Camera className="h-4 w-4" /> Sort {unsortedCount} photo{unsortedCount !== 1 ? "s" : ""}
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <BulkFileRow
                key={item.id}
                item={item}
                onCategoryChange={handleCategoryChange}
                onRemove={handleRemove}
                showCategoryEdit={true}
              />
            ))}
          </div>

          <Button className="w-full gap-2" onClick={handleUpload} disabled={uploading || unsortedCount > 0}>
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload All</>}
          </Button>
        </div>
      )}

      {showPhotoSorter && (
        <PhotoSorterDialog
          photos={items.filter((i) => PHOTO_EXTS.includes(i.file.name.split(".").pop()?.toLowerCase()))}
          onDone={handlePhotoSortDone}
          onCancel={() => setShowPhotoSorter(false)}
        />
      )}
    </div>
  );
}