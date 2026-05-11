import React from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { FileText, Shield, Globe, User, Upload, DollarSign, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatCard from "@/components/dashboard/StatCard";
import RecentFiles from "@/components/dashboard/RecentFiles";
import RecentNotes from "@/components/dashboard/RecentNotes";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import SortingTasksBanner from "@/components/dashboard/SortingTasksBanner";
import { canAccessFile } from "@/lib/fileHelpers";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: allFiles = [], isLoading } = useQuery({
    queryKey: ["files"],
    queryFn: () => base44.entities.File.list("-created_date", 200),
  });

  const { data: allNotes = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: () => base44.entities.Note.list("-updated_date", 10),
  });

  const accessibleFiles = allFiles.filter((f) => canAccessFile(f, user));
  const unsortedFiles = accessibleFiles.filter((f) => f.category === "to_be_sorted");
  const managerFiles = accessibleFiles.filter((f) => f.access_level === "manager");
  const universalFiles = accessibleFiles.filter((f) => f.access_level === "universal");
  const myFiles = accessibleFiles.filter((f) => f.access_level === "personal" && f.owner_email === user?.email);
  const financeFiles = accessibleFiles.filter((f) => f.access_level === "finance");
  const corporateFiles = accessibleFiles.filter((f) => f.access_level === "corporate");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SortingTasksBanner count={unsortedFiles.length} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(" ")[0] || "User"}</h1>
          <p className="text-muted-foreground text-sm mt-1">Your organization's file management hub</p>
        </div>
        <Link to="/upload">
          <Button className="gap-2">
            <Upload className="h-4 w-4" /> Upload File
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Files" value={accessibleFiles.length} icon={FileText} description="Files you can access" href="/files" />
        <StatCard title="Universal Files" value={universalFiles.length} icon={Globe} description="Org-wide access" href="/files?access=universal" />
        <StatCard title="Manager Files" value={managerFiles.length} icon={Shield} description="Restricted access" href="/files?access=manager" />
        <StatCard title="Finance Files" value={financeFiles.length} icon={DollarSign} description="Finance-restricted" href="/files?access=finance" />
        <StatCard title="Corporate Files" value={corporateFiles.length} icon={Building2} description="Official org documents" href="/files?access=corporate" />
        <StatCard title="My Files" value={myFiles.length} icon={User} description="Personal files" href="/files?access=personal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentFiles files={accessibleFiles} />
        </div>
        <div className="space-y-6">
          <RecentNotes notes={allNotes} />
          <CategoryBreakdown files={accessibleFiles} />
        </div>
      </div>
    </div>
  );
}