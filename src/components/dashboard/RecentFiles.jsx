import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Clock } from "lucide-react";
import { getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function RecentFiles({ files }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Recent Files</CardTitle>
        <Link to="/files">
          <Button variant="ghost" size="sm" className="text-xs">View All</Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No files yet. Upload your first file!</p>
        ) : (
          files.slice(0, 8).map((file) => {
            const ext = getFileExtension(file.original_name);
            const style = getFileTypeStyle(ext);
            return (
              <div key={file.id} className="flex items-center gap-3 group">
                <div className={`h-9 w-9 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                  <FileText className={`h-4 w-4 ${style.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.display_name || file.original_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="uppercase">{ext}</span>
                    <span>·</span>
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>·</span>
                    <span>{file.created_date ? format(new Date(file.created_date), "MMM d") : ""}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => window.open(file.file_url, "_blank")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}