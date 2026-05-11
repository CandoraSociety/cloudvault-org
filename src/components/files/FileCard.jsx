import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Eye, Clock, Shield, Globe, User, MoreVertical, Trash2, DollarSign, ExternalLink, Building2, Palette } from "lucide-react";

const CANVA_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "pdf"];
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FileSummaryDialog from "./FileSummaryDialog";

const accessIcons = {
  personal: User,
  universal: Globe,
  manager: Shield,
  finance: DollarSign,
  corporate: Building2,
};

const accessLabels = {
  personal: "Personal",
  universal: "Universal",
  manager: "Manager",
  finance: "Finance",
  corporate: "Corporate",
};

export default function FileCard({ file, onDelete, index = 0 }) {
  const [showSummary, setShowSummary] = useState(false);
  const navigate = useNavigate();
  const ext = getFileExtension(file.original_name);
  const canOpenInCanva = CANVA_EXTS.includes(ext);
  const style = getFileTypeStyle(ext);
  const AccessIcon = accessIcons[file.access_level] || Globe;

  const handleDownload = () => {
    window.open(file.file_url, "_blank");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.3 }}
      >
        <Card className="group p-4 hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/20">
          <div className="flex items-start gap-4">
            <div className={`h-11 w-11 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
              <FileText className={`h-5 w-5 ${style.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-sm truncate">{file.display_name || file.original_name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{file.standardized_name}</p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/view?id=${file.id}`)}>
                      <ExternalLink className="h-4 w-4 mr-2" /> Open File
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/edit?id=${file.id}`)}>
                      <Eye className="h-4 w-4 mr-2" /> Edit Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowSummary(true)}>
                      <Eye className="h-4 w-4 mr-2" /> View Summary
                    </DropdownMenuItem>
                    {canOpenInCanva && (
                      <DropdownMenuItem onClick={() => window.open(`https://www.canva.com/create/import/?url=${encodeURIComponent(file.file_url)}`, "_blank")}>
                        <Palette className="h-4 w-4 mr-2" /> Edit in Canva
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleDownload}>
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

              {file.description && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{file.description}</p>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="secondary" className="text-xs gap-1 px-2 py-0.5">
                  <AccessIcon className="h-3 w-3" />
                  {accessLabels[file.access_level]}
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize">
                  {file.category?.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs text-muted-foreground uppercase font-medium">{ext}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
              </div>

              <div className="flex items-center gap-4 mt-2.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {file.created_date ? format(new Date(file.created_date), "MMM d, yyyy") : "—"}
                </span>
                {file.owner_name && (
                  <span className="text-xs text-muted-foreground">by {file.owner_name}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs gap-1 text-primary hover:text-primary"
                  onClick={handleDownload}
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <FileSummaryDialog file={file} open={showSummary} onOpenChange={setShowSummary} />
    </>
  );
}