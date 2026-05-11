import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, FileText } from "lucide-react";
import FileCard from "@/components/files/FileCard";
import { canAccessFile, CATEGORIES, getFileExtension } from "@/lib/fileHelpers";
import { toast } from "sonner";

export default function SearchPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [suggestions] = useState(["policy", "report", "invoice", "contract", "template", "budget"]);

  const { data: allFiles = [] } = useQuery({
    queryKey: ["files"],
    queryFn: () => base44.entities.File.list("-created_date", 500),
  });

  const results = useMemo(() => {
    if (!query.trim() && typeFilter === "all" && categoryFilter === "all") return [];

    let files = allFiles.filter((f) => canAccessFile(f, user));

    if (categoryFilter !== "all") files = files.filter((f) => f.category === categoryFilter);
    if (typeFilter !== "all") files = files.filter((f) => getFileExtension(f.original_name) === typeFilter);

    if (query.trim()) {
      const q = query.toLowerCase();
      const terms = q.split(/\s+/);

      files = files.filter((f) => {
        const searchable = [
          f.display_name, f.original_name, f.description, f.summary,
          f.standardized_name, f.file_type, f.category, f.owner_name,
          ...(f.keywords || []),
        ].filter(Boolean).join(" ").toLowerCase();

        return terms.every((term) => searchable.includes(term));
      });

      // Score by relevance
      files.sort((a, b) => {
        const scoreFile = (f) => {
          let score = 0;
          if (f.display_name?.toLowerCase().includes(q)) score += 10;
          if (f.original_name?.toLowerCase().includes(q)) score += 8;
          if (f.keywords?.some((kw) => kw.toLowerCase().includes(q))) score += 6;
          if (f.description?.toLowerCase().includes(q)) score += 4;
          if (f.summary?.toLowerCase().includes(q)) score += 2;
          return score;
        };
        return scoreFile(b) - scoreFile(a);
      });
    }

    return files;
  }, [allFiles, user, query, typeFilter, categoryFilter]);

  const handleDelete = async (file) => {
    if (!confirm(`Delete "${file.display_name || file.original_name}"?`)) return;
    await base44.entities.File.delete(file.id);
    queryClient.invalidateQueries({ queryKey: ["files"] });
    toast.success("File deleted");
  };

  const uniqueTypes = [...new Set(allFiles.map((f) => getFileExtension(f.original_name)))].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search Files</h1>
        <p className="text-sm text-muted-foreground mt-1">Find files by name, description, keywords, type, and more</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file name, description, keywords, content..."
            className="pl-12 h-12 text-base"
          />
          {query && (
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setQuery("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="File Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((t) => (
                <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
        </div>

        {!query.trim() && typeFilter === "all" && categoryFilter === "all" && (
          <div className="py-8">
            <p className="text-sm text-muted-foreground mb-3">Try searching for:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors px-3 py-1"
                  onClick={() => setQuery(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {(query.trim() || typeFilter !== "all" || categoryFilter !== "all") && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
          {results.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No files match your search</p>
              <p className="text-sm text-muted-foreground mt-1">Try different keywords or adjust filters</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {results.map((file, i) => (
                <FileCard key={file.id} file={file} index={i} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}