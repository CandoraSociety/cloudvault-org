import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  FolderOpen, Search, Upload, Home, Shield, Globe, User,
  Menu, X, LogOut, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/files", label: "All Files", icon: FolderOpen },
  { path: "/files?access=manager", label: "Manager Files", icon: Shield },
  { path: "/files?access=universal", label: "Universal Files", icon: Globe },
  { path: "/files?access=personal", label: "My Files", icon: User },
  { path: "/search", label: "Search", icon: Search },
  { path: "/upload", label: "Upload", icon: Upload },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname + location.search === path || location.pathname === path.split("?")[0] && location.search === "?" + path.split("?")[1];
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground text-lg leading-tight">CloudVault</h1>
                <p className="text-xs text-muted-foreground">File Management</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
                {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.full_name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || "user"}</p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => base44.auth.logout()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <div className="p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}