import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Trash2, CheckCircle2, Circle, ArrowUpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function DevTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    category: "feature",
    due_date: "",
    assigned_to: "",
    blocked_by: "",
    notes: "",
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["dev-tasks"],
    queryFn: () => base44.entities.DevelopmentTask.list("-created_date"),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.DevelopmentTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-tasks"] });
      resetForm();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DevelopmentTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-tasks"] });
      resetForm();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.DevelopmentTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-tasks"] });
      resetForm();
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      category: "feature",
      due_date: "",
      assigned_to: "",
      blocked_by: "",
      notes: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, owner_email: user?.email };
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
      category: task.category || "feature",
      due_date: task.due_date || "",
      assigned_to: task.assigned_to || "",
      blocked_by: task.blocked_by || "",
      notes: task.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = (task) => {
    if (window.confirm(`Delete task "${task.title}"?`)) {
      deleteTaskMutation.mutate(task.id);
    }
  };

  const handleStatusChange = (task, newStatus) => {
    updateTaskMutation.mutate({ id: task.id, data: { ...task, status: newStatus } });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Development Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track integration progress and blockers
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">{editingTask ? "Edit Task" : "Create Task"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Authorize OneDrive"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="bug_fix">Bug Fix</SelectItem>
                    <SelectItem value="refactor">Refactor</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned To</label>
                <Input
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  placeholder="email@example.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Blocked By</label>
                <Input
                  value={formData.blocked_by}
                  onChange={(e) => setFormData({ ...formData, blocked_by: e.target.value })}
                  placeholder="What's blocking this?"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional context..."
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit">{editingTask ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Create Task
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => handleEdit(task)}
              onDelete={() => handleDelete(task)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const statusIcons = {
    pending: <Circle className="h-4 w-4 text-muted-foreground" />,
    in_progress: <ArrowUpCircle className="h-4 w-4 text-primary" />,
    blocked: <Circle className="h-4 w-4 text-destructive" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  };

  const priorityColors = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <Card className="p-4 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {statusIcons[task.status]}
            <h3 className="font-semibold">{task.title}</h3>
            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
            <Badge variant="outline">{task.category}</Badge>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {task.due_date && <span>Due: {task.due_date}</span>}
            {task.assigned_to && <span>Assigned: {task.assigned_to}</span>}
            {task.blocked_by && <span className="text-destructive">Blocked: {task.blocked_by}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== "completed" && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onStatusChange(task, "completed")}>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <span className="sr-only">Edit</span>✏️
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}