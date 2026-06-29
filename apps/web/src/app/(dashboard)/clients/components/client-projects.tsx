'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClientProject } from '../lib/clients-api';

const statusColor: Record<string, string> = {
  PLANNING: 'bg-blue-500/10 text-blue-600',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  ON_HOLD: 'bg-amber-500/10 text-amber-600',
  COMPLETED: 'bg-violet-500/10 text-violet-600',
  CANCELLED: 'bg-muted text-muted-foreground',
};

interface ClientProjectsProps {
  clientId: string;
  projects: ClientProject[];
  onUpdate: () => void;
}

export function ClientProjects({ clientId, projects, onUpdate }: ClientProjectsProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PLANNING');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const { createProject } = await import('../lib/clients-api');
      await createProject(clientId, {
        name: name.trim(),
        description: description.trim() || null,
        status,
        budget: budget ? parseFloat(budget) : null,
      });
      setName('');
      setDescription('');
      setBudget('');
      setShowForm(false);
      onUpdate();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
          Projects ({projects.length})
        </span>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
          <input
            placeholder="Project name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs px-2 py-1.5 bg-background border border-border rounded-md"
            >
              {['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              placeholder="Budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-24 text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-7 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || submitting} className="h-7 text-xs">
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
          No projects yet
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center justify-between bg-muted/20 border border-border/80 rounded-lg p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground truncate">{project.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor[project.status] || ''}`}>
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{project.description}</p>
                )}
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {project.startDate && <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>}
                  {project.budget != null && <span className="ml-2">Budget: PKR {project.budget.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
