import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { CATEGORIES, ACCESS_LEVELS } from "@/lib/fileHelpers";

export default function FileFilters({ filters, onFilterChange }) {
  const hasFilters = filters.category !== "all" || filters.access !== "all" || filters.fileType !== "all";

  const clearFilters = () => {
    onFilterChange({ category: "all", access: "all", fileType: "all", sort: filters.sort });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={filters.category} onValueChange={(v) => onFilterChange({ ...filters, category: v })}>
        <SelectTrigger className="w-40 h-9 text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.access} onValueChange={(v) => onFilterChange({ ...filters, access: v })}>
        <SelectTrigger className="w-40 h-9 text-sm">
          <SelectValue placeholder="Access Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Access Levels</SelectItem>
          {ACCESS_LEVELS.map((a) => (
            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.fileType} onValueChange={(v) => onFilterChange({ ...filters, fileType: v })}>
        <SelectTrigger className="w-36 h-9 text-sm">
          <SelectValue placeholder="File Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="doc">Word</SelectItem>
          <SelectItem value="xls">Excel</SelectItem>
          <SelectItem value="ppt">PowerPoint</SelectItem>
          <SelectItem value="image">Images</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sort} onValueChange={(v) => onFilterChange({ ...filters, sort: v })}>
        <SelectTrigger className="w-36 h-9 text-sm">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="-created_date">Newest First</SelectItem>
          <SelectItem value="created_date">Oldest First</SelectItem>
          <SelectItem value="display_name">Name A-Z</SelectItem>
          <SelectItem value="-display_name">Name Z-A</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-9 text-xs gap-1" onClick={clearFilters}>
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}