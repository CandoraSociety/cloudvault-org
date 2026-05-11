import React from "react";
import { Link } from "react-router-dom";
import { SortAsc, ArrowRight } from "lucide-react";

export default function SortingTasksBanner({ count }) {
  if (!count || count === 0) return null;
  return (
    <Link to="/files?category=to_be_sorted" className="block">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors">
        <div className="h-9 w-9 rounded-lg bg-amber-200 flex items-center justify-center shrink-0">
          <SortAsc className="h-5 w-5 text-amber-700" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-amber-900">
            {count} file{count !== 1 ? "s" : ""} pending sorting
          </p>
          <p className="text-xs text-amber-700">
            You have unsorted files waiting to be categorized — click to review them.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-amber-600 shrink-0" />
      </div>
    </Link>
  );
}