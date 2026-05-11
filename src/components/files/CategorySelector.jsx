import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle2, PlusCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function CategorySelector({ file, fileUrl, categories, value, subcategory, onChange, onSubcategoryChange, onCategoriesUpdated }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null); // { category, subcategory, reason, new_categories }
  const [autoDecide, setAutoDecide] = useState(false);

  const analyzeFile = async () => {
    setAnalyzing(true);
    setRecommendations(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const supportedForReading = ["pdf", "docx", "doc", "xlsx", "xls", "csv", "txt", "png", "jpg", "jpeg", "html"];
      const canRead = supportedForReading.includes(ext);

      const existingCategoryList = categories.map((c) => `${c.value}: ${c.label} — ${c.description || ""}`).join("\n");

      const prompt = `You are a document categorization assistant for a file management system.

File name: "${file.name}"
File size: ${(file.size / 1024).toFixed(1)} KB

Existing categories:
${existingCategoryList}

Task:
1. Recommend the BEST existing category for this file (use its exact value key).
2. Optionally suggest a subcategory label (a more specific label within that category, e.g. "Federal Grants", "Employment Agreements", "Q1 Reports").
3. If this file represents a document type not well covered by existing categories, suggest up to 2 new categories to add to the system. Each new category should have a unique slug value (lowercase, underscores), a short label, and a description.
4. Provide a 1-sentence reason for your recommendation.

Respond as JSON:
{
  "category": "existing_category_value",
  "subcategory": "optional subcategory label or null",
  "reason": "one sentence explanation",
  "new_categories": [
    {"value": "slug_key", "label": "Human Label", "description": "what files belong here", "parent_category": "parent_value_or_null"}
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            category: { type: "string" },
            subcategory: { type: "string" },
            reason: { type: "string" },
            new_categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  value: { type: "string" },
                  label: { type: "string" },
                  description: { type: "string" },
                  parent_category: { type: "string" }
                }
              }
            }
          }
        },
        ...(canRead && fileUrl ? { file_urls: [fileUrl] } : {}),
      });

      // Create any new categories suggested
      if (result.new_categories?.length > 0) {
        const existingValues = categories.map((c) => c.value);
        const toCreate = result.new_categories.filter((nc) => !existingValues.includes(nc.value));
        for (const nc of toCreate) {
          await base44.entities.FileCategory.create({
            value: nc.value,
            label: nc.label,
            description: nc.description || "",
            parent_category: nc.parent_category || null,
            is_system: false,
            usage_count: 0,
          });
        }
        if (toCreate.length > 0) {
          onCategoriesUpdated?.();
        }
      }

      setRecommendations(result);

      if (autoDecide) {
        onChange(result.category);
        onSubcategoryChange?.(result.subcategory || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyRecommendation = () => {
    if (!recommendations) return;
    onChange(recommendations.category);
    onSubcategoryChange?.(recommendations.subcategory || "");
    setAutoDecide(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Category</Label>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
            onClick={analyzeFile}
            disabled={analyzing}
          >
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {analyzing ? "Analyzing..." : "Let the app decide"}
          </Button>
        )}
      </div>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              <span className="flex items-center gap-2">
                {c.label}
                {recommendations?.category === c.value && (
                  <Badge className="text-xs py-0 px-1.5 bg-primary/10 text-primary border-0">Recommended</Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Recommendation banner */}
      {recommendations && !analyzing && (
        <div className={cn(
          "rounded-lg border p-3 text-sm space-y-2",
          autoDecide ? "border-primary/30 bg-primary/5" : "border-amber-200 bg-amber-50"
        )}>
          <div className="flex items-start gap-2">
            {autoDecide
              ? <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              : <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs text-foreground">
                Recommended: <span className="text-primary">{categories.find((c) => c.value === recommendations.category)?.label || recommendations.category}</span>
                {recommendations.subcategory && <span className="text-muted-foreground"> › {recommendations.subcategory}</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{recommendations.reason}</p>
              {recommendations.new_categories?.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <PlusCircle className="h-3 w-3" />
                  Added {recommendations.new_categories.length} new {recommendations.new_categories.length === 1 ? "category" : "categories"}: {recommendations.new_categories.map((nc) => nc.label).join(", ")}
                </p>
              )}
            </div>
          </div>
          {!autoDecide && (
            <Button type="button" size="sm" className="h-7 text-xs w-full" onClick={applyRecommendation}>
              Apply Recommendation
            </Button>
          )}
        </div>
      )}

      {/* Subcategory field if we have one */}
      {subcategory !== undefined && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Subcategory <span className="font-normal">(optional)</span></Label>
          <input
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder={recommendations?.subcategory || "e.g. Federal Grants, Q1 Reports..."}
            value={subcategory}
            onChange={(e) => onSubcategoryChange?.(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}