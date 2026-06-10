import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import { canAccessFile } from "@/lib/fileHelpers";
import { useAuth } from "@/lib/AuthContext";

export default function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ category: "all", access: "all" });

  const { data: allFiles = [] } = useQuery({
    queryKey: ["all-files-search"],
    queryFn: () => base44.entities.File.list("-created_date", 2000),
  });

  const accessibleFiles = useMemo(() => allFiles.filter((f) => canAccessFile(f, user)), [allFiles, user]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return accessibleFiles.filter((f) => {
      const matchesQuery =
        (f.display_name || f.original_name || "").toLowerCase().includes(q) ||
        (f.description || "").toLowerCase().includes(q) ||
        (f.summary || "").toLowerCase().includes(q) ||
        (f.keywords || []).some((k) => k.toLowerCase().includes(q));

      const matchesCategory = filters.category === "all" || f.category === filters.category;
      const matchesAccess = filters.access === "all" || f.access_level === filters.access;

      return matchesQuery && matchesCategory && matchesAccess;
    });
  }, [query, accessibleFiles, filters]);

  const clearSearch = () => {
    setQuery("");
    setFilters({ category: "all", access: "all" });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Search Files</h1>
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename, description, summary, or keywords..."
            className="pl-12 h-12 text-lg"
            autoFocus
          />
          {query && (
            <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {query && (
        <div className="flex items-center gap-3 justify-center flex-wrap">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Filter className="h-4 w-4" /> Filter by:
          </span>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="text-sm border rounded-md px-3 py-1.5"
          >
            <option value="all">All Categories</option>
            <option value="finance">Finance</option>
            <option value="hr">HR</option>
            <option value="operations">Operations</option>
            <option value="legal">Legal</option>
            <option value="marketing">Marketing</option>
            <option value="general">General</option>
          </select>
          <select
            value={filters.access}
            onChange={(e) => setFilters({ ...filters, access: e.target.value })}
            className="text-sm border rounded-md px-3 py-1.5"
          >
            <option value="all">All Access</option>
            <option value="universal">Universal</option>
            <option value="personal">Personal</option>
            <option value="manager">Manager</option>
            <option value="finance">Finance</option>
          </select>
        </div>
      )}

      {/* Results */}
      {query && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
          </p>

          {results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No files match your search. Try different keywords.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((file) => {
                const ext = getFileExtension(file.original_name);
                const style = getFileTypeStyle(ext);
                return (
                  <div
                    key={file.id}
                    onClick={() => navigate(`/view?id=${file.id}`)}
                    className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all bg-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                        <FileText className={`h-5 w-5 ${style.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{file.display_name || file.original_name}</p>
                        {file.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{file.summary}</p>
                        )}
                        {file.description && !file.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{file.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{ext.toUpperCase()}</Badge>
                          <Badge variant="outline" className="text-xs">{formatFileSize(file.file_size)}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{file.access_level}</Badge>
                          {file.keywords?.slice(0, 3).map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}