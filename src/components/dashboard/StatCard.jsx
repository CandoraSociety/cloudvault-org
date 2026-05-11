import React from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function StatCard({ title, value, icon: Icon, description, href }) {
  const content = (
    <Card className={`p-5 ${href ? "hover:shadow-md hover:border-primary/30 transition-all cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );

  return href ? <Link to={href}>{content}</Link> : content;
}