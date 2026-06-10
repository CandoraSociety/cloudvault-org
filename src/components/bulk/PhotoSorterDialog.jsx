import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Camera, Check, X } from "lucide-react";

export const PHOTO_CATEGORIES = [
  { value: "photo_event", label: "Event / Gathering" },
  { value: "photo_people", label: "People / Portraits" },
  { value: "photo_facility", label: "Facility / Building" },
  { value: "photo_product", label: "Product / Equipment" },
  { value: "photo_project", label: "Project / Site" },
  { value: "photo_marketing", label: "Marketing / Promo" },
  { value: "photo_training", label: "Training / Workshop" },
  { value: "photo_document", label: "Document / Receipt" },
  { value: "photo_misc", label: "Miscellaneous" },
  { value: "to_be_sorted", label: "Sort Later" },
];

export default function PhotoSorterDialog({ photos, onDone, onCancel }) {
  const [index, setIndex] = useState(0);
  const [assignments, setAssignments] = useState(() => {
    const m = {};
    photos.forEach((p) => { m[p.id] = p.category || "to_be_sorted"; });
    return m;
  });
  const [previewUrls] = useState(() => {
    const m = {};
    photos.forEach((p) => { m[p.id] = URL.createObjectURL(p.file); });
    return m;
  });

  const current = photos[index];
  const total = photos.length;
  const selectedCat = assignments[current?.id] || "to_be_sorted";

  const setCategory = (id, cat) => {
    setAssignments((prev) => ({ ...prev, [id]: cat }));
  };

  const handleCategoryClick = (catValue) => {
    setCategory(current.id, catValue);
    handleNext();
  };

  const handleNext = () => {
    if (index < total - 1) setIndex(index + 1);
    else finish();
  };

  const handleBack = () => {
    if (index > 0) setIndex(index - 1);
  };

  const finish = () => {
    onDone(photos.map((p) => ({ id: p.id, category: assignments[p.id] || "to_be_sorted" })));
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <Camera className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Sort Photos</p>
            <p className="text-xs text-muted-foreground">{index + 1} of {total} — {current.file.name}</p>
          </div>
          <div className="flex gap-1 flex-wrap max-w-40 justify-end">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-primary" : assignments[photos[i].id] && assignments[photos[i].id] !== "to_be_sorted" ? "bg-green-400" : "bg-border"}`} />
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 bg-black flex items-center justify-center shrink-0">
            <img src={previewUrls[current.id]} alt={current.file.name} className="max-w-full max-h-64 object-contain" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Select a category</p>
            {PHOTO_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 ${
                  selectedCat === cat.value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-muted"
                }`}
              >
                {selectedCat === cat.value && <Check className="h-3.5 w-3.5 shrink-0" />}
                <span>{cat.label}</span>
                {cat.value === "to_be_sorted" && (
                  <Badge variant="outline" className="ml-auto text-xs">Sort Later</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t">
          <Button variant="outline" size="sm" onClick={handleBack} disabled={index === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => {
            setAssignments(prev => ({ ...prev, [current.id]: "to_be_sorted" }));
            handleNext();
          }}>
            <ChevronRight className="h-4 w-4" /> Skip
          </Button>
          <Button size="sm" className="ml-auto gap-1" onClick={handleNext}>
            {index < total - 1 ? <><ChevronRight className="h-4 w-4" /> Next</> : <><Check className="h-4 w-4" /> Done</>}
          </Button>
        </div>
      </div>
    </div>
  );
}