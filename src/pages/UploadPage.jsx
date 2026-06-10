import React from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import FileUploader from "@/components/files/FileUploader";

export default function UploadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["files"] });
    navigate("/files");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Upload File</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new file to the vault</p>
      </div>

      <FileUploader onUploadComplete={handleComplete} />
    </div>
  );
}