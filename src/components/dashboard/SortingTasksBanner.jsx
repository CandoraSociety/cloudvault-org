import React, { useState } from "react";
import { SortAsc, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileSortingDialog from "@/components/files/FileSortingDialog";

export default function SortingTasksBanner({ count, files = [] }) {
  const [showSorting, setShowSorting] = useState(false);

  if (!count || count === 0) return null;

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setShowSorting(true)}
        className="w-full justify-start h-auto p-4 hover:bg-amber-100"
      >
        <div className="flex items-center gap-3 w-full">
          <div className="h-9 w-9 rounded-lg bg-amber-200 flex items-center justify-center shrink-0">
            <SortAsc className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm text-amber-900">
              {count} file{count !== 1 ? "s" : ""} pending sorting
            </p>
            <p className="text-xs text-amber-700">
              You have unsorted files waiting to be categorized — click to sort them.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-600 shrink-0" />
        </div>
      </Button>

      <FileSortingDialog files={files} open={showSorting} onOpenChange={setShowSorting} />
    </>
  );
}