import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, AlertCircle, Plus, Trash2, Clock, Zap } from "lucide-react";

const STATUS_ICONS = {
  pending: <Circle className="h-4 w-4 text-slate-400" />,
  in_progress: <Zap className="h-4 w-4 text-blue-500 animate-pulse" />,
  blocked: <AlertCircle className="h-4 w-4 text-red-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

const STATUS_COLORS = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  blocked: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

const PRIORITY_COLORS = {
  low: "text-slate-500",
  medium: "text-amber-600",
  high: "text-red-600",
};

export default function DevTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "integration",
    priority: "medium",
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["dev-tasks"],
    queryFn: () => base44.entities.DevelopmentTask.filter({ owner_email: user?.email }, "-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.DevelopmentTask.create({
        ...data,
        status: "pending",
        owner_email: user?.email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-tasks"] });
      setFormData({ title: "", description: "", category: "integration", priority: "medium" });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId) => base44.entities.DevelopmentTask.delete(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dev-tasks"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }) => base44.entities.DevelopmentTask.update(taskId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dev-tasks"] }),
  });

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Development Backlog</h1>
        <p className="text-sm text-muted-foreground mt-1">Track features, integrations, and pending work</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {["pending", "in_progress", "blocked", "completed", "all"].map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s)}
              className="capitalize"
            >
              {s === "in_progress" ? "In Progress" : s}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <Input
            placeholder="Task title (e.g., Authorize OneDrive)"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Textarea
            placeholder="Description (what needs to be done, any blockers, notes)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <div className="flex gap-2">
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="integration">Integration</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
                <SelectItem value="bug_fix">Bug Fix</SelectItem>
                <SelectItem value="refactor">Refactor</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => createMutation.mutate(formData)}>
              Create Task
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No tasks in this status
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="p-4 flex items-start justify-between hover:bg-accent/50 transition-colors">
              <div className="flex-1 flex gap-3">
                <div className="mt-1">{STATUS_ICONS[task.status]}</div>
                <div className="flex-1">
                  <p className="font-medium">{task.title}</p>
                  {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                  {task.blocked_by && (
                    <p className="text-xs text-red-600 mt-2">
                      <span className="font-semibold">Blocked:</span> {task.blocked_by}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant="outline" className="text-xs capitalize">
                      {task.category.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority} priority
                    </Badge>
                    <Badge className={`text-xs ${STATUS_COLORS[task.status]}`}>
                      {task.status.replace(/_/g, " ")}
                    </Badge>
                    {task.due_date && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Clock className="h-3 w-3" /> {new Date(task.due_date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateMutation.mutate({
                      taskId: task.id,
                      data: { status: task.status === "completed" ? "pending" : "completed" },
                    })
                  }
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteMutation.mutate(task.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}