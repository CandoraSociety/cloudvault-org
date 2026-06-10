import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Eye, Clock, Shield, Globe, User, MoreVertical, Trash2, DollarSign, Building2, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import FileSummaryDialog from "./FileSummaryDialog";

const accessIcons = {
  personal: User,
  universal: Globe,
  manager: Shield,
  finance: DollarSign,
  corporate: Building2,
};

const accessColors = {
  personal: "text-blue-500",
  universal: "text-green-500",
  manager: "text-orange-500",
  finance: "text-purple-500",
  corporate: "text-slate-500",
};

export default function FileListItem({ file, onDelete, index = 0 }) {
  const [showSummary, setShowSummary] = useState(false);
  const navigate = useNavigate();
  const ext = getFileExtension(file.original_name);
  const style = getFileTypeStyle(ext);
  const AccessIcon = accessIcons[file.access_level] || Globe;

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/60 bg-card hover:shadow-sm hover:border-primary/20 transition-all group">
        <div className={`h-9 w-9 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
          <FileText className={`h-4 w-4 ${style.color}`} />
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-1 md:gap-4 items-center">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{file.display_name || file.original_name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground uppercase font-medium">{ext}</span>
              <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">{file.category?.replace(/_/g, " ")}</Badge>
              <span className={`text-xs flex items-center gap-0.5 ${accessColors[file.access_level] || "text-muted-foreground"}`}>
                <AccessIcon className="h-3 w-3" />
                {file.access_level}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground hidden md:flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {file.created_date ? format(new Date(file.created_date), "MMM d, yyyy") : "—"}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/view?id=${file.id}`)}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(file.file_url, "_blank")}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/view?id=${file.id}`)}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Open File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSummary(true)}>
                    <Eye className="h-4 w-4 mr-2" /> View Summary
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(file.file_url, "_blank")}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(file)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      <FileSummaryDialog file={file} open={showSummary} onOpenChange={setShowSummary} />
    </>
  );
}