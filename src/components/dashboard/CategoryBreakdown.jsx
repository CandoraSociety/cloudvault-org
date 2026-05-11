import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/fileHelpers";
import { Link } from "react-router-dom";

export default function CategoryBreakdown({ files }) {
  const counts = {};
  files.forEach((f) => {
    counts[f.category] = (counts[f.category] || 0) + 1;
  });

  const sorted = CATEGORIES
    .map((c) => ({ ...c, count: counts[c.value] || 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...sorted.map((c) => c.count), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Files by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No files uploaded yet</p>
        ) : (
          sorted.map((c) => (
            <Link key={c.value} to={`/files?category=${c.value}`} className="block group">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium group-hover:text-primary transition-colors">{c.label}</span>
                <span className="text-muted-foreground">{c.count}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded-full transition-all"
                  style={{ width: `${(c.count / maxCount) * 100}%` }}
                />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}