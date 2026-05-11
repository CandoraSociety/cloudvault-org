/**
 * DocumentOverlayPanel — handles Header, Footer, Watermark, Cover Page,
 * Page Numbers, Page Rotation and Page Resize overlays on the canvas.
 * Receives the active canvas context and dimensions, applies overlays visually.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlignLeft, AlignCenter, AlignRight, RotateCw, Maximize2,
  FileImage, Hash, Plus, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { toast } from "sonner";
import AssetPickerDialog from "./AssetPickerDialog";

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 24];
const PAGE_SIZES = [
  { label: "Letter (8.5×11\")", w: 816, h: 1056 },
  { label: "Legal (8.5×14\")", w: 816, h: 1344 },
  { label: "A4 (210×297mm)", w: 794, h: 1123 },
  { label: "A3 (297×420mm)", w: 1123, h: 1587 },
  { label: "Custom", w: 0, h: 0 },
];

export default function DocumentOverlayPanel({ ctx, canvas, onApply }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("header");
  const [showAssetPicker, setShowAssetPicker] = useState(null); // "header"|"footer"|"watermark"|"cover"

  // Header state
  const [headerText, setHeaderText] = useState("");
  const [headerFontSize, setHeaderFontSize] = useState(12);
  const [headerColor, setHeaderColor] = useState("#000000");
  const [headerAlign, setHeaderAlign] = useState("center");
  const [headerLogoUrl, setHeaderLogoUrl] = useState(null);

  // Footer state
  const [footerText, setFooterText] = useState("");
  const [footerFontSize, setFooterFontSize] = useState(12);
  const [footerColor, setFooterColor] = useState("#000000");
  const [footerAlign, setFooterAlign] = useState("center");
  const [footerLogoUrl, setFooterLogoUrl] = useState(null);

  // Watermark state
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.15);
  const [watermarkColor, setWatermarkColor] = useState("#888888");
  const [watermarkImageUrl, setWatermarkImageUrl] = useState(null);

  // Cover page state
  const [coverTitle, setCoverTitle] = useState("");
  const [coverSubtitle, setCoverSubtitle] = useState("");
  const [coverBg, setCoverBg] = useState("#1e3a5f");
  const [coverTextColor, setCoverTextColor] = useState("#ffffff");
  const [coverLogoUrl, setCoverLogoUrl] = useState(null);

  // Page number state
  const [pageNumPos, setPageNumPos] = useState("bottom-center");
  const [pageNumFormat, setPageNumFormat] = useState("Page {n}");
  const [pageNumSize, setPageNumSize] = useState(10);

  // Page resize state
  const [selectedSize, setSelectedSize] = useState(PAGE_SIZES[0]);
  const [customW, setCustomW] = useState(816);
  const [customH, setCustomH] = useState(1056);

  const applyHeader = () => {
    if (!ctx || !canvas) return;
    const x = headerAlign === "left" ? 20 : headerAlign === "right" ? canvas.width - 20 : canvas.width / 2;
    ctx.save();
    ctx.fillStyle = headerColor;
    ctx.font = `${headerFontSize}px Inter, sans-serif`;
    ctx.textAlign = headerAlign === "left" ? "left" : headerAlign === "right" ? "right" : "center";
    ctx.textBaseline = "top";
    if (headerLogoUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 10, 4, 60, 30);
        ctx.fillText(headerText, x, 8);
        ctx.restore();
        onApply();
      };
      img.src = headerLogoUrl;
    } else {
      ctx.fillText(headerText, x, 8);
      ctx.restore();
      onApply();
    }
    toast.success("Header applied");
  };

  const applyFooter = () => {
    if (!ctx || !canvas) return;
    const y = canvas.height - 20;
    const x = footerAlign === "left" ? 20 : footerAlign === "right" ? canvas.width - 20 : canvas.width / 2;
    ctx.save();
    ctx.fillStyle = footerColor;
    ctx.font = `${footerFontSize}px Inter, sans-serif`;
    ctx.textAlign = footerAlign === "left" ? "left" : footerAlign === "right" ? "right" : "center";
    ctx.textBaseline = "bottom";
    if (footerLogoUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 10, canvas.height - 36, 50, 24);
        ctx.fillText(footerText, x, y);
        ctx.restore();
        onApply();
      };
      img.src = footerLogoUrl;
    } else {
      ctx.fillText(footerText, x, y);
      ctx.restore();
      onApply();
    }
    toast.success("Footer applied");
  };

  const applyWatermark = () => {
    if (!ctx || !canvas) return;
    ctx.save();
    ctx.globalAlpha = watermarkOpacity;
    if (watermarkImageUrl) {
      const img = new Image();
      img.onload = () => {
        const w = canvas.width * 0.5;
        const h = (img.height / img.width) * w;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        ctx.restore();
        onApply();
      };
      img.src = watermarkImageUrl;
    } else {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = watermarkColor;
      ctx.font = `bold ${Math.floor(canvas.width / 10)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
      onApply();
    }
    toast.success("Watermark applied");
  };

  const applyCoverPage = () => {
    if (!ctx || !canvas) return;
    ctx.save();
    // Background
    ctx.fillStyle = coverBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Title
    ctx.fillStyle = coverTextColor;
    ctx.font = `bold ${Math.floor(canvas.width / 18)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(coverTitle, canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = `${Math.floor(canvas.width / 26)}px Inter, sans-serif`;
    ctx.fillText(coverSubtitle, canvas.width / 2, canvas.height / 2 + 20);
    if (coverLogoUrl) {
      const img = new Image();
      img.onload = () => {
        const lw = Math.min(canvas.width * 0.3, 200);
        const lh = (img.height / img.width) * lw;
        ctx.drawImage(img, (canvas.width - lw) / 2, canvas.height / 4 - lh / 2, lw, lh);
        ctx.restore();
        onApply();
      };
      img.src = coverLogoUrl;
    } else {
      ctx.restore();
      onApply();
    }
    toast.success("Cover page applied");
  };

  const applyPageNumbers = () => {
    if (!ctx || !canvas) return;
    const posMap = {
      "bottom-center": { x: canvas.width / 2, y: canvas.height - 10, align: "center" },
      "bottom-left": { x: 20, y: canvas.height - 10, align: "left" },
      "bottom-right": { x: canvas.width - 20, y: canvas.height - 10, align: "right" },
      "top-center": { x: canvas.width / 2, y: pageNumSize + 6, align: "center" },
    };
    const pos = posMap[pageNumPos] || posMap["bottom-center"];
    ctx.save();
    ctx.fillStyle = "#555555";
    ctx.font = `${pageNumSize}px Inter, sans-serif`;
    ctx.textAlign = pos.align;
    ctx.textBaseline = "bottom";
    ctx.fillText(pageNumFormat.replace("{n}", "1"), pos.x, pos.y);
    ctx.restore();
    onApply();
    toast.success("Page number applied");
  };

  const applyPageResize = () => {
    if (!ctx || !canvas) return;
    const w = selectedSize.label === "Custom" ? customW : selectedSize.w;
    const h = selectedSize.label === "Custom" ? customH : selectedSize.h;
    const tmp = document.createElement("canvas");
    tmp.width = w; tmp.height = h;
    const tCtx = tmp.getContext("2d");
    tCtx.drawImage(canvas, 0, 0, w, h);
    canvas.width = w; canvas.height = h;
    ctx.drawImage(tmp, 0, 0);
    onApply();
    toast.success("Page resized");
  };

  const applyPageRotation = () => {
    if (!ctx || !canvas) return;
    const tmp = document.createElement("canvas");
    tmp.width = canvas.height; tmp.height = canvas.width;
    const tCtx = tmp.getContext("2d");
    tCtx.translate(tmp.width / 2, tmp.height / 2);
    tCtx.rotate(Math.PI / 2);
    tCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    canvas.width = tmp.width; canvas.height = tmp.height;
    ctx.drawImage(tmp, 0, 0);
    onApply();
    toast.success("Page rotated");
  };

  const AlignButtons = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]].map(([v, Icon]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`h-7 w-7 rounded border flex items-center justify-center transition-colors ${value === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
        <TabsList className="grid grid-cols-3 mx-2 mt-2 shrink-0 text-xs h-8">
          <TabsTrigger value="header" className="text-xs">Header</TabsTrigger>
          <TabsTrigger value="footer" className="text-xs">Footer</TabsTrigger>
          <TabsTrigger value="watermark" className="text-xs">Watermark</TabsTrigger>
        </TabsList>
        <TabsList className="grid grid-cols-3 mx-2 mt-1 shrink-0 text-xs h-8">
          <TabsTrigger value="cover" className="text-xs">Cover</TabsTrigger>
          <TabsTrigger value="pagenums" className="text-xs">Pg #</TabsTrigger>
          <TabsTrigger value="pageops" className="text-xs">Page Ops</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* HEADER */}
          <TabsContent value="header" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Header</p>
              <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => setShowAssetPicker("header")}>
                <FileImage className="h-3 w-3" /> Templates
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Header Text</Label>
              <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Company Name" className="text-sm h-8" />
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Font Size</Label>
                <Select value={String(headerFontSize)} onValueChange={(v) => setHeaderFontSize(Number(v))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{FONT_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}px</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <input type="color" value={headerColor} onChange={(e) => setHeaderColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border border-border" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Alignment</Label>
              <AlignButtons value={headerAlign} onChange={setHeaderAlign} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Logo / Image</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setShowAssetPicker("header-logo")}>
                  Pick from Assets
                </Button>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setHeaderLogoUrl(ev.target.result);
                    reader.readAsDataURL(f);
                  }} />
                  <span className="h-7 px-2 text-xs border border-border rounded-md flex items-center hover:bg-muted cursor-pointer">Upload</span>
                </label>
                {headerLogoUrl && <button onClick={() => setHeaderLogoUrl(null)} className="text-xs text-destructive">✕</button>}
              </div>
              {headerLogoUrl && <img src={headerLogoUrl} className="h-8 rounded border" alt="header logo" />}
            </div>
            <Button size="sm" className="w-full" onClick={applyHeader}>Apply Header</Button>
          </TabsContent>

          {/* FOOTER */}
          <TabsContent value="footer" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Footer</p>
              <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => setShowAssetPicker("footer")}>
                <FileImage className="h-3 w-3" /> Templates
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Footer Text</Label>
              <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="© 2026 Organization" className="text-sm h-8" />
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Font Size</Label>
                <Select value={String(footerFontSize)} onValueChange={(v) => setFooterFontSize(Number(v))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{FONT_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}px</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <input type="color" value={footerColor} onChange={(e) => setFooterColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border border-border" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Alignment</Label>
              <AlignButtons value={footerAlign} onChange={setFooterAlign} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Logo / Image</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setShowAssetPicker("footer-logo")}>
                  Pick from Assets
                </Button>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setFooterLogoUrl(ev.target.result);
                    reader.readAsDataURL(f);
                  }} />
                  <span className="h-7 px-2 text-xs border border-border rounded-md flex items-center hover:bg-muted cursor-pointer">Upload</span>
                </label>
                {footerLogoUrl && <button onClick={() => setFooterLogoUrl(null)} className="text-xs text-destructive">✕</button>}
              </div>
              {footerLogoUrl && <img src={footerLogoUrl} className="h-8 rounded border" alt="footer logo" />}
            </div>
            <Button size="sm" className="w-full" onClick={applyFooter}>Apply Footer</Button>
          </TabsContent>

          {/* WATERMARK */}
          <TabsContent value="watermark" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Watermark</p>
              <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => setShowAssetPicker("watermark")}>
                <FileImage className="h-3 w-3" /> Templates
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Text Watermark</Label>
              <Input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="CONFIDENTIAL" className="text-sm h-8" />
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Opacity ({Math.round(watermarkOpacity * 100)}%)</Label>
                <input type="range" min="5" max="80" value={Math.round(watermarkOpacity * 100)}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value) / 100)}
                  className="w-full h-2 rounded" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <input type="color" value={watermarkColor} onChange={(e) => setWatermarkColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border border-border" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Image Watermark (overrides text)</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setShowAssetPicker("watermark-img")}>
                  Pick from Assets
                </Button>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setWatermarkImageUrl(ev.target.result);
                    reader.readAsDataURL(f);
                  }} />
                  <span className="h-7 px-2 text-xs border border-border rounded-md flex items-center hover:bg-muted cursor-pointer">Upload</span>
                </label>
                {watermarkImageUrl && <button onClick={() => setWatermarkImageUrl(null)} className="text-xs text-destructive">✕</button>}
              </div>
              {watermarkImageUrl && <img src={watermarkImageUrl} className="h-8 rounded border" alt="watermark" />}
            </div>
            <Button size="sm" className="w-full" onClick={applyWatermark}>Apply Watermark</Button>
          </TabsContent>

          {/* COVER PAGE */}
          <TabsContent value="cover" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cover Page</p>
              <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => setShowAssetPicker("cover")}>
                <FileImage className="h-3 w-3" /> Templates
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Title</Label>
              <Input value={coverTitle} onChange={(e) => setCoverTitle(e.target.value)} placeholder="Document Title" className="text-sm h-8" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Subtitle / Date</Label>
              <Input value={coverSubtitle} onChange={(e) => setCoverSubtitle(e.target.value)} placeholder="Prepared by..." className="text-sm h-8" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Background</Label>
                <input type="color" value={coverBg} onChange={(e) => setCoverBg(e.target.value)} className="h-8 w-full rounded cursor-pointer border border-border" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Text Color</Label>
                <input type="color" value={coverTextColor} onChange={(e) => setCoverTextColor(e.target.value)} className="h-8 w-full rounded cursor-pointer border border-border" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Logo</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setShowAssetPicker("cover-logo")}>
                  Pick from Assets
                </Button>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setCoverLogoUrl(ev.target.result);
                    reader.readAsDataURL(f);
                  }} />
                  <span className="h-7 px-2 text-xs border border-border rounded-md flex items-center hover:bg-muted cursor-pointer">Upload</span>
                </label>
                {coverLogoUrl && <button onClick={() => setCoverLogoUrl(null)} className="text-xs text-destructive">✕</button>}
              </div>
              {coverLogoUrl && <img src={coverLogoUrl} className="h-8 rounded border" alt="cover logo" />}
            </div>
            <Button size="sm" className="w-full" onClick={applyCoverPage}>Apply Cover Page</Button>
          </TabsContent>

          {/* PAGE NUMBERS */}
          <TabsContent value="pagenums" className="space-y-3 mt-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Page Numbers</p>
            <div className="space-y-2">
              <Label className="text-xs">Format (use {"{n}"} for number)</Label>
              <Input value={pageNumFormat} onChange={(e) => setPageNumFormat(e.target.value)} placeholder="Page {n}" className="text-sm h-8" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Position</Label>
              <Select value={pageNumPos} onValueChange={setPageNumPos}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-center">Bottom Center</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="top-center">Top Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Font Size</Label>
              <Select value={String(pageNumSize)} onValueChange={(v) => setPageNumSize(Number(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{FONT_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}px</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button size="sm" className="w-full gap-1" onClick={applyPageNumbers}>
              <Hash className="h-3.5 w-3.5" /> Apply Page Numbers
            </Button>
          </TabsContent>

          {/* PAGE OPERATIONS */}
          <TabsContent value="pageops" className="space-y-4 mt-0">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rotate Page</p>
              <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={applyPageRotation}>
                <RotateCw className="h-3.5 w-3.5" /> Rotate 90° Clockwise
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resize Page</p>
              <Select value={selectedSize.label} onValueChange={(v) => setSelectedSize(PAGE_SIZES.find((s) => s.label === v) || PAGE_SIZES[0])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_SIZES.map((s) => <SelectItem key={s.label} value={s.label}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              {selectedSize.label === "Custom" && (
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Width (px)</Label>
                    <Input type="number" value={customW} onChange={(e) => setCustomW(Number(e.target.value))} className="h-8 text-xs" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Height (px)</Label>
                    <Input type="number" value={customH} onChange={(e) => setCustomH(Number(e.target.value))} className="h-8 text-xs" />
                  </div>
                </div>
              )}
              <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={applyPageResize}>
                <Maximize2 className="h-3.5 w-3.5" /> Apply Resize
              </Button>
            </div>
          </TabsContent>

        </div>
      </Tabs>

      {showAssetPicker && (
        <AssetPickerDialog
          assetType={showAssetPicker}
          onSelect={(url) => {
            if (showAssetPicker === "header" || showAssetPicker === "header-logo") setHeaderLogoUrl(url);
            else if (showAssetPicker === "footer" || showAssetPicker === "footer-logo") setFooterLogoUrl(url);
            else if (showAssetPicker === "watermark" || showAssetPicker === "watermark-img") setWatermarkImageUrl(url);
            else if (showAssetPicker === "cover" || showAssetPicker === "cover-logo") setCoverLogoUrl(url);
            setShowAssetPicker(null);
          }}
          onClose={() => setShowAssetPicker(null)}
        />
      )}
    </div>
  );
}