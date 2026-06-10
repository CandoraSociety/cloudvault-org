import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, FileText, Check } from "lucide-react";
import { getFileExtension, getFileTypeStyle } from "@/lib/fileHelpers";
import { toast } from "sonner";

export default function PinFromVaultDialog({ files, onClose, onPin }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [groupName, setGroupName] = useState("");

  const filteredFiles = files.filter(
    (f) => f.display_name?.toLowerCase().includes(search.toLowerCase()) || f.original_name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFile = (file) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handlePin = async () => {
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      await base44.entities.WorkspaceItem.create({
        owner_email: user?.email,
        workspace_group: groupName.trim() || "Default",
        file_id: file.id,
        file_url: file.file_url,
        original_name: file.original_name,
        file_type: file.file_type,
        file_size: file.file_size,
        pinned_from_vault: true,
        label: file.display_name || file.original_name,
      });
    }

    toast.success(`Pinned ${selectedFiles.length} file${selectedFiles.length !== 1 ? "s" : ""} to workspace`);
    onPin(selectedFiles, groupName);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
          <h3 className="font-semibold">Pin Files from Vault</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="p-4 space-y-3 border-b">
          <div className="space-y-2">
            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Workspace group name (optional)" />
          </div>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vault files..." className="pl-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredFiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No files found</p>
          ) : (
            <div className="grid gap-2">
              {filteredFiles.map((file) => {
                const isSelected = selectedFiles.some((f) => f.id === file.id);
                const ext = getFileExtension(file.original_name);
                const style = getFileTypeStyle(ext);
                return (
                  <button
                    key={file.id}
                    onClick={() => toggleFile(file)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                      <FileText className={`h-4 w-4 ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.display_name || file.original_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{file.standardized_name}</p>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t">
          <p className="text-sm text-muted-foreground">{selectedFiles.length} selected</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handlePin} disabled={selectedFiles.length === 0}>
              Pin {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}