'use client';

import { useState } from 'react';
import { Square, CheckSquare, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { GlobalTask } from '../lib/clients-api';
import { formatTaskDue } from '../lib/client-utils';
import { updateTask, createTask } from '../lib/clients-api';

interface ClientOption {
  id: string;
  name: string;
}

interface UpcomingTasksPanelProps {
  tasks: GlobalTask[];
  loading: boolean;
  onUpdate: () => void;
  clients?: ClientOption[];
  canWrite?: boolean;
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export function UpcomingTasksPanel({ tasks, loading, onUpdate, clients = [], canWrite = false }: UpcomingTasksPanelProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueAt, setDueAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openDialog = () => {
    setClientId(clients[0]?.id ?? '');
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setDueAt('');
    setDialogOpen(true);
  };

  const toggleComplete = async (task: GlobalTask) => {
    try {
      await updateTask(task.clientId, task.id, {
        status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
        completedAt: task.status === 'COMPLETED' ? null : new Date().toISOString(),
      });
      onUpdate();
    } catch { /* ignore */ }
  };

  const handleCreateTask = async () => {
    if (!clientId || !title.trim()) return;
    setSubmitting(true);
    try {
      await createTask(clientId, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      });
      setDialogOpen(false);
      onUpdate();
      toast({ title: 'Task created' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create task. Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-xs h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-foreground">Upcoming Tasks</h3>
        {canWrite && (
          <Button variant="outline" size="sm" onClick={openDialog} className="h-7 text-xs gap-1" disabled={clients.length === 0}>
            <Plus className="h-3 w-3" /> New task
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No upcoming tasks</p>
      ) : (
        <div className="space-y-1">
          {tasks.map((task) => {
            const isUrgent = task.priority === 'URGENT' || task.priority === 'HIGH';
            const isDone = task.status === 'COMPLETED';
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleComplete(task)}
                className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition hover:bg-muted/40 ${
                  isDone ? 'opacity-50' : ''
                }`}
              >
                {isDone ? (
                  <CheckSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Square className={`h-4 w-4 shrink-0 mt-0.5 ${isUrgent ? 'text-destructive' : 'text-muted-foreground/50'}`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold leading-snug ${isUrgent && !isDone ? 'text-destructive' : 'text-foreground'} ${isDone ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground truncate">{task.clientName}</span>
                    {task.dueAt && (
                      <span className={`text-[10px] ${isUrgent && !isDone ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                        · {formatTaskDue(task.dueAt)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {clients.length === 0 && <option value="">No clients available</option>}
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Send Q3 invoice" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={!clientId || !title.trim() || submitting}>
              {submitting ? 'Saving...' : 'Create task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
