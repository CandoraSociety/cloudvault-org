/**
 * AssetPickerDialog — lets user pick from stored editor assets (logos, templates)
 * or upload a new one, or pull from vault files.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Upload, Loader2, ImageIcon, Check } from "lucide-react";
import { toast } from "sonner";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];

export default function AssetPickerDialog({ assetType, onSelect, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState("");
  const [tab, setTab] = useState("assets");

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["editor-assets"],
    queryFn: () => base44.entities.EditorAsset.list("-created_date", 200),
  });

  const { data: vaultFiles = [] } = useQuery({
    queryKey: ["vault-images"],
    queryFn: () => base44.entities.File.list("-created_date", 500),
    select: (files) => files.filter((f) => {
      const ext = f.original_name?.split(".").pop()?.toLowerCase();
      return IMAGE_EXTS.includes(ext);
    }),
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !newName.trim()) { toast.error("Please enter a name first"); return; }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.EditorAsset.create({
      name: newName.trim(),
      asset_type: assetType.includes("logo") ? "logo" : assetType.includes("watermark") ? "watermark_template" : assetType.includes("cover") ? "cover_template" : assetType.includes("header") ? "header_template" : assetType.includes("footer") ? "footer_template" : "image",
      file_url,
      owner_email: user?.email,
      is_shared: false,
    });
    queryClient.invalidateQueries({ queryKey: ["editor-assets"] });
    setUploading(false);
    toast.success("Asset saved!");
    onSelect(file_url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b shrink-0">
          <h3 className="font-semibold text-sm">Asset Library</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-3 mx-4 mt-3 shrink-0">
            <TabsTrigger value="assets">Saved Assets</TabsTrigger>
            <TabsTrigger value="vault">From Vault</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">

            {/* Saved Assets */}
            <TabsContent value="assets" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : assets.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No saved assets yet. Upload some below.</div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {assets.map((a) => (
                    <button key={a.id} onClick={() => onSelect(a.file_url)}
                      className="group border rounded-lg overflow-hidden hover:border-primary transition-colors text-left">
                      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                        <img src={a.file_url} alt={a.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="p-1.5">
                        <p className="text-xs font-medium truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{a.asset_type?.replace(/_/g, " ")}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Vault images */}
            <TabsContent value="vault" className="mt-0">
              {vaultFiles.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No image files found in vault.</div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {vaultFiles.map((f) => (
                    <button key={f.id} onClick={() => onSelect(f.file_url)}
                      className="group border rounded-lg overflow-hidden hover:border-primary transition-colors text-left">
                      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                        <img src={f.file_url} alt={f.display_name || f.original_name} className="w-full h-full object-contain"
                          onError={(e) => { e.target.style.display = "none"; }} />
                      </div>
                      <div className="p-1.5">
                        <p className="text-xs font-medium truncate">{f.display_name || f.original_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Upload new */}
            <TabsContent value="upload" className="mt-0 space-y-3">
              <div className="space-y-1">
                <Label className="text-sm">Asset Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Company Logo" className="text-sm" />
              </div>
              <label className={`cursor-pointer block ${!newName.trim() ? "opacity-50 pointer-events-none" : ""}`}>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={!newName.trim() || uploading} />
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-2" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  )}
                  <p className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload image"}</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG — logos with transparent BG work best</p>
                </div>
              </label>
              {!newName.trim() && <p className="text-xs text-amber-600">Enter a name above to enable upload.</p>}
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
}