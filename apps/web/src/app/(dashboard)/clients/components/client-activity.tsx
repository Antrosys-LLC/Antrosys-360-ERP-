'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClientActivity as TActivity } from '../lib/clients-api';

const typeColors: Record<string, string> = {
  NOTE: 'bg-blue-500/10 text-blue-600',
  CALL: 'bg-emerald-500/10 text-emerald-600',
  EMAIL: 'bg-violet-500/10 text-violet-600',
  MEETING: 'bg-amber-500/10 text-amber-600',
  TASK: 'bg-rose-500/10 text-rose-600',
  PROJECT: 'bg-cyan-500/10 text-cyan-600',
  STATUS_CHANGE: 'bg-purple-500/10 text-purple-600',
  RENEWAL: 'bg-orange-500/10 text-orange-600',
};

interface ClientActivityProps {
  clientId: string;
  activities: TActivity[];
  onUpdate: () => void;
}

export function ClientActivity({ clientId, activities, onUpdate }: ClientActivityProps) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('NOTE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const { createActivity } = await import('../lib/clients-api');
      await createActivity(clientId, {
        type,
        title: title.trim(),
        description: description.trim() || null,
      });
      setTitle('');
      setDescription('');
      setShowForm(false);
      onUpdate();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
          Activity Log ({activities.length})
        </span>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Log
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md"
          >
            {['NOTE', 'CALL', 'EMAIL', 'MEETING', 'TASK'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-7 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!title.trim() || submitting} className="h-7 text-xs">
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
          No activity logged yet
        </div>
      ) : (
        <div className="space-y-1.5">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start gap-2.5 border-b border-border/40 pb-2 last:border-0">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${typeColors[act.type] || 'bg-muted text-muted-foreground'}`}>
                {act.type}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{act.title}</p>
                {act.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{act.description}</p>
                )}
                <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
