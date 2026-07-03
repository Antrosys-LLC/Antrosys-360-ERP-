'use client';

import { Square, CheckSquare } from 'lucide-react';
import type { GlobalTask } from '../lib/clients-api';
import { formatTaskDue } from '../lib/client-utils';
import { updateTask } from '../lib/clients-api';

interface UpcomingTasksPanelProps {
  tasks: GlobalTask[];
  loading: boolean;
  onUpdate: () => void;
}

export function UpcomingTasksPanel({ tasks, loading, onUpdate }: UpcomingTasksPanelProps) {
  const toggleComplete = async (task: GlobalTask) => {
    try {
      await updateTask(task.clientId, task.id, {
        status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
        completedAt: task.status === 'COMPLETED' ? null : new Date().toISOString(),
      });
      onUpdate();
    } catch { /* ignore */ }
  };

  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-xs h-full">
      <h3 className="font-bold text-sm text-foreground mb-4">Upcoming Tasks</h3>
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
                  {task.dueAt && (
                    <span className={`text-[10px] mt-0.5 block ${isUrgent && !isDone ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                      {formatTaskDue(task.dueAt)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
