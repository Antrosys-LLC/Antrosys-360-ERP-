'use client';

import { useState } from 'react';
import { Plus, Loader2, Square, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClientTask } from '../lib/clients-api';

const priorityColor: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-blue-500/10 text-blue-600',
  HIGH: 'bg-amber-500/10 text-amber-600',
  URGENT: 'bg-rose-500/10 text-rose-600',
};

interface ClientTasksProps {
  tasks: ClientTask[];
  onUpdate: () => void;
  clientId: string;
}

export function ClientTasks({ tasks, onUpdate, clientId }: ClientTasksProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueAt, setDueAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const { createTask } = await import('../lib/clients-api');
      await createTask(clientId, {
        title: title.trim(),
        priority,
        dueAt: dueAt || null,
      });
      setTitle('');
      setPriority('MEDIUM');
      setDueAt('');
      setShowForm(false);
      onUpdate();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const toggleComplete = async (task: ClientTask) => {
    try {
      const { updateTask } = await import('../lib/clients-api');
      await updateTask(clientId, task.id, {
        status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
        completedAt: task.status === 'COMPLETED' ? null : new Date().toISOString(),
      });
      onUpdate();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
          Upcoming Tasks ({tasks.length})
        </span>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
          <input
            placeholder="Task title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <div className="flex gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="text-xs px-2 py-1.5 bg-background border border-border rounded-md"
            >
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="flex-1 text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-7 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!title.trim() || submitting} className="h-7 text-xs">
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
          No tasks yet
        </div>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start gap-2.5 p-2 rounded-lg border transition cursor-pointer ${
                task.status === 'COMPLETED' ? 'bg-muted/40 border-border/60 opacity-60' : 'bg-card border-border hover:border-muted-foreground/30'
              }`}
              onClick={() => toggleComplete(task)}
            >
              <button className="mt-0.5 shrink-0">
                {task.status === 'COMPLETED' ? (
                  <CheckSquare className="h-4 w-4 text-primary fill-primary/10" />
                ) : (
                  <Square className={`h-4 w-4 ${task.priority === 'URGENT' ? 'text-destructive' : 'text-muted-foreground/60'}`} />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold truncate ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground mt-0.5">
                  {task.dueAt && <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>}
                  <span className={`text-[9px] font-bold px-1 rounded ${priorityColor[task.priority] || ''}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
