import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import SearchBar from "@/components/files/SearchBar";
import FileFilters from "@/components/files/FileFilters";
import FileCard from "@/components/files/FileCard";
import { canAccessFile, getFileExtension } from "@/lib/fileHelpers";
import { toast } from "sonner";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
const DOC_EXTS = ["doc", "docx"];
const SHEET_EXTS = ["xls", "xlsx", "csv"];
const SLIDE_EXTS = ["ppt", "pptx"];

function matchesFileType(file, typeFilter) {
  if (typeFilter === "all") return true;
  const ext = getFileExtension(file.original_name);
  if (typeFilter === "pdf") return ext === "pdf";
  if (typeFilter === "doc") return DOC_EXTS.includes(ext);
  if (typeFilter === "xls") return SHEET_EXTS.includes(ext);
  if (typeFilter === "ppt") return SLIDE_EXTS.includes(ext);
  if (typeFilter === "image") return IMAGE_EXTS.includes(ext);
  return !["pdf", ...DOC_EXTS, ...SHEET_EXTS, ...SLIDE_EXTS, ...IMAGE_EXTS].includes(ext);
}

export default function FileBrowser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: urlParams.get("category") || "all",
    access: urlParams.get("access") || "all",
    fileType: "all",
    sort: "-created_date",
  });

  const { data: allFiles = [], isLoading } = useQuery({
    queryKey: ["files"],
    queryFn: () => base44.entities.File.list("-created_date", 500),
  });

  const filteredFiles = useMemo(() => {
    let files = allFiles.filter((f) => canAccessFile(f, user));

    if (filters.category !== "all") files = files.filter((f) => f.category === filters.category);
    if (filters.access !== "all") files = files.filter((f) => f.access_level === filters.access);
    if (filters.fileType !== "all") files = files.filter((f) => matchesFileType(f, filters.fileType));

    if (search.trim()) {
      const q = search.toLowerCase();
      files = files.filter((f) =>
        f.display_name?.toLowerCase().includes(q) ||
        f.original_name?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.standardized_name?.toLowerCase().includes(q) ||
        f.keywords?.some((kw) => kw.toLowerCase().includes(q)) ||
        f.file_type?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (filters.sort === "display_name") {
      files.sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""));
    } else if (filters.sort === "-display_name") {
      files.sort((a, b) => (b.display_name || "").localeCompare(a.display_name || ""));
    } else if (filters.sort === "created_date") {
      files.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    }
    // default: -created_date (already sorted from API)

    return files;
  }, [allFiles, user, filters, search]);

  const handleDelete = async (file) => {
    if (!confirm(`Delete "${file.display_name || file.original_name}"?`)) return;
    await base44.entities.File.delete(file.id);
    queryClient.invalidateQueries({ queryKey: ["files"] });
    toast.success("File deleted");
  };

  const accessTitle = filters.access === "manager" ? "Manager Files" :
    filters.access === "universal" ? "Universal Files" :
    filters.access === "personal" ? "My Personal Files" :
    filters.access === "finance" ? "Finance Files" : "All Files";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{accessTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{filteredFiles.length} files</p>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, description, keywords, type..." />
      <FileFilters filters={filters} onFilterChange={setFilters} />

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No files found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredFiles.map((file, i) => (
            <FileCard key={file.id} file={file} index={i} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}