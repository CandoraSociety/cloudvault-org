import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText, Loader2, AlertCircle } from "lucide-react";
import { getFileExtension, getFileTypeStyle } from "@/lib/fileHelpers";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp"];

export default function FileViewer() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get("id");

  const { data: file, isLoading, isError } = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => base44.entities.File.filter({ id: fileId }).then((res) => res[0]),
    enabled: !!fileId,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !file) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">File not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const ext = getFileExtension(file.original_name);
  const style = getFileTypeStyle(ext);
  const isImage = IMAGE_EXTS.includes(ext);
  const isPdf = ext === "pdf";

  const viewerUrl = isImage || isPdf
    ? file.file_url
    : `https://docs.google.com/viewer?url=${encodeURIComponent(file.file_url)}&embedded=true`;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center`}>
          <FileText className={`h-4 w-4 ${style.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{file.display_name || file.original_name}</p>
          <p className="text-xs text-muted-foreground truncate">{file.standardized_name}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => window.open(file.file_url, "_blank")}>
          <Download className="h-4 w-4" /> Download
        </Button>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden">
        {isImage ? (
          <div className="w-full h-full flex items-center justify-center bg-muted/20 p-4">
            <img src={viewerUrl} alt={file.display_name} className="max-w-full max-h-full object-contain rounded-lg shadow" />
          </div>
        ) : (
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title={file.display_name}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}
      </div>
    </div>
  );
}