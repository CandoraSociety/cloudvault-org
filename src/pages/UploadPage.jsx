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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload File</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new file to your organization's cloud vault</p>
      </div>
      <FileUploader onUploadComplete={handleComplete} />
    </div>
  );
}