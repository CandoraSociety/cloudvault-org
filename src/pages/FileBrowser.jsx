import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Grid, List, Upload, Loader2, SortAsc } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import FileCard from "@/components/files/FileCard";
import FileListItem from "@/components/files/FileListItem";
import FileFilters from "@/components/files/FileFilters";
import SearchBar from "@/components/files/SearchBar";
import FileSortingDialog from "@/components/files/FileSortingDialog";
import { canAccessFile } from "@/lib/fileHelpers";
import { useAuth } from "@/lib/AuthContext";

export default function FileBrowser() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    access: "all",
    fileType: "all",
    sort: "-created_date",
  });
  const [showSorting, setShowSorting] = useState(false);
  const [filesToSort, setFilesToSort] = useState([]);

  const queryClient = useQueryClient();

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ["files", filters, search],
    queryFn: async () => {
      const allFiles = await base44.entities.File.list("-created_date", 1000);
      return allFiles.filter((f) => canAccessFile(f, user));
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id) => base44.entities.File.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File deleted");
    },
  });

  const handleDelete = (file) => {
    if (window.confirm(`Delete "${file.display_name || file.original_name}"?`)) {
      deleteFileMutation.mutate(file.id);
    }
  };

  const unsortedFiles = useMemo(() => files.filter((f) => f.category === "to_be_sorted"), [files]);

  const filteredFiles = useMemo(() => {
    let result = [...files];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          (f.display_name || f.original_name || "").toLowerCase().includes(q) ||
          (f.description || "").toLowerCase().includes(q) ||
          (f.keywords || []).some((k) => k.toLowerCase().includes(q))
      );
    }

    if (filters.category !== "all") {
      result = result.filter((f) => f.category === filters.category);
    }

    if (filters.access !== "all") {
      result = result.filter((f) => f.access_level === filters.access);
    }

    if (filters.fileType !== "all") {
      result = result.filter((f) => {
        const ext = (f.file_type || "").toLowerCase();
        if (filters.fileType === "image") return ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
        if (filters.fileType === "pdf") return ext === "pdf";
        if (filters.fileType === "doc") return ["doc", "docx"].includes(ext);
        if (filters.fileType === "xls") return ["xls", "xlsx", "csv"].includes(ext);
        if (filters.fileType === "ppt") return ["ppt", "pptx"].includes(ext);
        return true;
      });
    }

    const sortKey = filters.sort.replace("-", "");
    const desc = filters.sort.startsWith("-");
    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (sortKey === "display_name" || sortKey === "original_name") {
        aVal = (a.display_name || a.original_name || "").toLowerCase();
        bVal = (b.display_name || b.original_name || "").toLowerCase();
        return desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      if (sortKey === "created_date") {
        return desc ? new Date(bVal) - new Date(aVal) : new Date(aVal) - new Date(bVal);
      }
      return 0;
    });

    return result;
  }, [files, search, filters]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">File Browser</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
            {unsortedFiles.length > 0 && (
              <span className="ml-2 text-amber-600">
                · {unsortedFiles.length} need sorting
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unsortedFiles.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => {
              setFilesToSort(unsortedFiles);
              setShowSorting(true);
            }}>
              <SortAsc className="h-4 w-4" /> Sort {unsortedFiles.length}
            </Button>
          )}
          <Link to="/upload">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Upload File
            </Button>
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search files by name, description, or keywords..." />
        <FileFilters filters={filters} onFilterChange={setFilters} />
        <div className="ml-auto flex items-center gap-1 border rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`h-8 px-3 rounded-md text-sm font-medium transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`h-8 px-3 rounded-md text-sm font-medium transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Files */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No files found. Upload your first file!</p>
          <Link to="/upload">
            <Button className="mt-4 gap-2">
              <Upload className="h-4 w-4" /> Upload File
            </Button>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file, i) => (
            <FileCard key={file.id} file={file} onDelete={handleDelete} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file, i) => (
            <FileListItem key={file.id} file={file} onDelete={handleDelete} index={i} />
          ))}
        </div>
      )}

      {/* Sorting Dialog */}
      <FileSortingDialog
        files={filesToSort}
        open={showSorting}
        onOpenChange={(v) => {
          setShowSorting(v);
          if (!v) {
            refetch();
          }
        }}
      />
    </div>
  );
}