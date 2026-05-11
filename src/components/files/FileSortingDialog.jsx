import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";
import { FILE_CATEGORIES } from "@/lib/fileHelpers";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function FileSortingDialog({ files = [], open, onOpenChange }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categories, setCategories] = useState(() => {
    const m = {};
    files.forEach((f) => {
      m[f.id] = f.category || "to_be_sorted";
    });
    return m;
  });
  const queryClient = useQueryClient();

  const updateFileMutation = useMutation({
    mutationFn: ({ id, category }) => base44.entities.File.update(id, { category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const current = files[currentIndex];
  const total = files.length;
  const currentCategory = categories[current?.id] || "to_be_sorted";

  const handleCategoryChange = (newCategory) => {
    setCategories((prev) => ({ ...prev, [current.id]: newCategory }));
  };

  const handleSave = async () => {
    if (!current) return;
    await updateFileMutation.mutateAsync({ id: current.id, category: currentCategory });
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleBulkApply = async () => {
    const promises = Object.entries(categories).map(([id, category]) => {
      if (category !== "to_be_sorted") {
        return updateFileMutation.mutateAsync({ id, category });
      }
    });
    await Promise.all(promises);
    onOpenChange(false);
  };

  if (!current) return null;

  const ext = current.original_name?.split(".").pop()?.toLowerCase() || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sort Files — {currentIndex + 1} of {total}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Info */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium text-sm">{current.display_name || current.original_name}</p>
            <p className="text-xs text-muted-foreground mt-1">Size: {(current.file_size / 1024 / 1024).toFixed(2)} MB</p>
            {ext && <Badge className="mt-2 text-xs capitalize">{ext}</Badge>}
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Category</label>
            <Select value={currentCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          <div className="flex gap-1">
            {files.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i === currentIndex
                    ? "bg-primary"
                    : categories[files[i].id] !== "to_be_sorted"
                    ? "bg-green-500"
                    : "bg-border"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-between">
            <Button variant="outline" size="sm" onClick={handleSkip} className="gap-1">
              <X className="h-4 w-4" /> Skip
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1">
                <Check className="h-4 w-4" />
                {currentIndex < total - 1 ? "Save & Next" : "Save & Done"}
              </Button>
            </div>
          </div>

          {/* Bulk Apply */}
          {currentIndex === 0 && (
            <div className="pt-4 border-t text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkApply}
                className="text-xs text-muted-foreground"
              >
                Or bulk apply all categorized files
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}