'use client';

import { useMemo, useState } from 'react';
import { Plus, Loader2, ArrowUpDown, User, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClientProject } from '../lib/clients-api';
import { formatCurrency } from '../lib/client-utils';

const STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

const CLOSED_STATUSES = ['COMPLETED', 'CANCELLED'];

const statusColor: Record<string, string> = {
  PLANNING: 'bg-blue-500/10 text-blue-600',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  ON_HOLD: 'bg-amber-500/10 text-amber-600',
  COMPLETED: 'bg-violet-500/10 text-violet-600',
  CANCELLED: 'bg-muted text-muted-foreground',
};

const priorityColor: Record<string, string> = {
  HIGH: 'bg-red-500/10 text-red-600',
  MEDIUM: 'bg-amber-500/10 text-amber-600',
  LOW: 'bg-slate-500/10 text-slate-500',
};

const priorityRank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

type SortKey = 'recent' | 'budget' | 'priority' | 'startDate' | 'name';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Newest' },
  { value: 'priority', label: 'Priority (high→low)' },
  { value: 'budget', label: 'Budget (high→low)' },
  { value: 'startDate', label: 'Start date' },
  { value: 'name', label: 'Name (A→Z)' },
];

function toIsoDate(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

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
  const [priority, setPriority] = useState('MEDIUM');
  const [projectManager, setProjectManager] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('PLANNING');
    setPriority('MEDIUM');
    setProjectManager('');
    setStartDate('');
    setEndDate('');
    setBudget('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const { createProject } = await import('../lib/clients-api');
      await createProject(clientId, {
        name: name.trim(),
        description: description.trim() || null,
        status,
        priority,
        projectManager: projectManager.trim() || null,
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
        budget: budget ? parseFloat(budget) : null,
      });
      resetForm();
      setShowForm(false);
      onUpdate();
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (projectId: string, nextStatus: string) => {
    setUpdatingId(projectId);
    try {
      const { updateProject } = await import('../lib/clients-api');
      await updateProject(clientId, projectId, { status: nextStatus });
      onUpdate();
    } catch {
      /* ignore */
    } finally {
      setUpdatingId(null);
    }
  };

  const { currentAll, current, completed } = useMemo(() => {
    const curAll = projects.filter((p) => !CLOSED_STATUSES.includes(p.status));
    const done = projects.filter((p) => CLOSED_STATUSES.includes(p.status));

    const filtered = priorityFilter === 'ALL'
      ? curAll
      : curAll.filter((p) => p.priority === priorityFilter);

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'priority':
          return (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0);
        case 'budget':
          return (b.budget ?? 0) - (a.budget ?? 0);
        case 'startDate': {
          const at = a.startDate ? new Date(a.startDate).getTime() : Infinity;
          const bt = b.startDate ? new Date(b.startDate).getTime() : Infinity;
          return at - bt;
        }
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return { currentAll: curAll, current: sorted, completed: done };
  }, [projects, sortKey, priorityFilter]);

  const renderCard = (project: ClientProject) => (
    <div
      key={project.id}
      className="bg-muted/20 border border-border/80 rounded-lg p-3 space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-foreground truncate">{project.name}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor[project.status] || ''}`}>
              {project.status}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityColor[project.priority] || ''}`}>
              {project.priority}
            </span>
          </div>
          {project.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{project.description}</p>
          )}
        </div>
        {project.budget != null && (
          <span className="text-[11px] font-bold text-foreground shrink-0">
            {formatCurrency(project.budget)}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
        {project.projectManager && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> {project.projectManager}
          </span>
        )}
        {project.startDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(project.startDate).toLocaleDateString()}
            {project.endDate && ` → ${new Date(project.endDate).toLocaleDateString()}`}
          </span>
        )}
      </div>

      {/* Inline status control */}
      <div className="flex items-center justify-between pt-1 border-t border-border/60">
        <span className="text-[10px] text-muted-foreground">Change status</span>
        <div className="flex items-center gap-1.5">
          {updatingId === project.id && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <select
            value={project.status}
            onChange={(e) => changeStatus(project.id, e.target.value)}
            disabled={updatingId === project.id}
            className="text-[10px] px-1.5 py-1 bg-background border border-border rounded-md focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
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
          <input
            placeholder="Project manager"
            value={projectManager}
            onChange={(e) => setProjectManager(e.target.value)}
            className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Budget</label>
              <input
                placeholder="Budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm(); }} className="h-7 text-xs">Cancel</Button>
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
        <div className="space-y-5">
          {/* Current Projects */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Current Projects ({current.length}{priorityFilter !== 'ALL' ? ` of ${currentAll.length}` : ''})
              </span>
              {currentAll.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Filter className="h-3 w-3" />
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="text-[10px] px-1.5 py-1 bg-background border border-border rounded-md focus:outline-none"
                      title="Filter by priority"
                    >
                      <option value="ALL">All priorities</option>
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <ArrowUpDown className="h-3 w-3" />
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="text-[10px] px-1.5 py-1 bg-background border border-border rounded-md focus:outline-none"
                      title="Sort projects"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            {currentAll.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-4 border border-dashed border-border/60 rounded-lg">
                No current projects
              </div>
            ) : current.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-4 border border-dashed border-border/60 rounded-lg">
                No {priorityFilter} priority projects
              </div>
            ) : (
              <div className="space-y-2">{current.map((p) => renderCard(p))}</div>
            )}
          </div>

          {/* Completed Projects */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              Completed &amp; Closed ({completed.length})
            </span>
            {completed.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-4 border border-dashed border-border/60 rounded-lg">
                No completed projects
              </div>
            ) : (
              <div className="space-y-2">{completed.map((p) => renderCard(p))}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
