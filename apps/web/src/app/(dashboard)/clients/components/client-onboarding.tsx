'use client';

import { useEffect, useState } from 'react';
import { Check, Plus, Rocket, Trash2 } from 'lucide-react';
import type { ClientOnboarding, ClientOnboardingItem, ClientOnboardingPhase } from '../lib/clients-api';
import {
  startClientOnboarding,
  updateClientOnboarding,
  updateOnboardingItem,
  addOnboardingItem,
  deleteOnboardingItem,
  fetchClientOnboarding,
} from '../lib/clients-api';
import { useToast } from '@/hooks/use-toast';

const PHASES: Array<{ key: ClientOnboardingPhase; label: string; hint: string }> = [
  { key: 'KICKOFF', label: 'Kickoff', hint: 'Intro, stakeholders, goals' },
  { key: 'SETUP', label: 'Setup', hint: 'Access, workspace, billing, docs' },
  { key: 'HANDBACK', label: 'Handback', hint: 'Report, QBR, handover' },
  { key: 'COMPLETED', label: 'Completed', hint: 'Client is live & active' },
];

const CATEGORY_LABELS: Record<string, string> = {
  KICKOFF: 'Kickoff',
  SETUP: 'Setup',
  HANDBACK: 'Handback',
};

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
};

interface ClientOnboardingPanelProps {
  clientId: string;
  onboarding: ClientOnboarding | null;
  canManage?: boolean;
  onUpdate: () => void;
}

export function ClientOnboardingPanel({ clientId, onboarding, canManage = false, onUpdate }: ClientOnboardingPanelProps) {
  const { toast } = useToast();
  const [data, setData] = useState<ClientOnboarding | null>(onboarding);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('KICKOFF');

  useEffect(() => {
    setData(onboarding);
  }, [onboarding]);

  const notify = (title: string, description?: string) => toast({ title, description });

  const fail = () => toast({ title: 'Something went wrong', variant: 'destructive' });

  const handleStart = async () => {
    setBusy(true);
    try {
      const result = await startClientOnboarding(clientId, { startDate: new Date().toISOString() });
      setData(result);
      onUpdate();
      notify('Onboarding started', 'Default checklist created.');
    } catch {
      fail();
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    setBusy(true);
    try {
      const result = await updateClientOnboarding(clientId, { status: 'COMPLETED', currentPhase: 'COMPLETED' });
      setData(result);
      onUpdate();
      notify('Onboarding completed', 'Client promoted to ACTIVE.');
    } catch {
      fail();
    } finally {
      setBusy(false);
    }
  };

  const handleAdvance = async (phase: ClientOnboardingPhase) => {
    setBusy(true);
    try {
      const result = await updateClientOnboarding(clientId, { currentPhase: phase });
      setData(result);
      onUpdate();
      notify(`Moved to ${phase}`);
    } catch {
      fail();
    } finally {
      setBusy(false);
    }
  };

  const toggleItem = async (item: ClientOnboardingItem) => {
    const previous = data;
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) => (i.id === item.id ? { ...i, completedAt: i.completedAt ? null : new Date().toISOString() } : i)),
          }
        : prev,
    );
    try {
      const updated = await updateOnboardingItem(clientId, item.id, { completed: !item.completedAt });
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === 'NOT_STARTED' && updated.completedAt ? 'IN_PROGRESS' : prev.status,
              items: prev.items.map((i) => (i.id === item.id ? updated : i)),
            }
          : prev,
      );
    } catch {
      setData(previous);
      fail();
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setBusy(true);
    try {
      await addOnboardingItem(clientId, { title: newTitle.trim(), category: newCategory });
      const result = await fetchClientOnboarding(clientId);
      setData(result);
      onUpdate();
      setNewTitle('');
      setAdding(false);
      notify('Item added');
    } catch {
      fail();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setBusy(true);
    try {
      await deleteOnboardingItem(clientId, itemId);
      setData((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev));
      onUpdate();
    } catch {
      fail();
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10 text-center">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
          <Rocket className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">No onboarding in progress</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
          Kick off client onboarding to create a phase checklist covering kickoff, setup, and handback.
        </p>
        {canManage && (
          <button
            type="button"
            onClick={handleStart}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition shadow-sm disabled:opacity-50"
          >
            <Rocket className="h-3.5 w-3.5" />
            {busy ? 'Starting...' : 'Start onboarding'}
          </button>
        )}
      </div>
    );
  }

  const items = data.items ?? [];
  const total = items.length;
  const completedCount = items.filter((i) => i.completedAt).length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const currentIdx = PHASES.findIndex((p) => p.key === data.currentPhase);
  const isComplete = data.status === 'COMPLETED' || data.currentPhase === 'COMPLETED';
  const canComplete = !isComplete && completedCount === total && total > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">Onboarding</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-border ${
            isComplete ? 'bg-emerald-500/10 text-emerald-600' : data.status === 'ON_HOLD' ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'
          }`}>
            {STATUS_LABELS[data.status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canManage && !isComplete && (
            <button
              type="button"
              onClick={handleComplete}
              disabled={busy || !canComplete}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-[11px] font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-40"
            >
              <Check className="h-3 w-3" />
              {canComplete ? 'Complete onboarding' : `Complete ${total - completedCount} more item${total - completedCount > 1 ? 's' : ''}`}
            </button>
          )}
          {data.assignedTo && (
            <span className="text-[10px] text-muted-foreground font-medium">
              Owner: <span className="text-foreground">{data.assignedTo.email}</span>
            </span>
          )}
        </div>
      </div>

      {/* Phase stepper */}
      <div className="flex items-center gap-1">
        {PHASES.map((phase, idx) => {
          const active = idx === currentIdx;
          const done = idx < currentIdx || (phase.key === 'COMPLETED' && isComplete);
          return (
            <div key={phase.key} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => canManage && !isComplete && phase.key !== 'COMPLETED' && handleAdvance(phase.key)}
                disabled={!canManage || busy || isComplete || phase.key === 'COMPLETED'}
                title={phase.hint}
                className={`flex-1 text-center rounded-lg border px-2 py-1.5 transition ${
                  active
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : done
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                      : 'bg-muted/30 border-border text-muted-foreground'
                } ${canManage && !isComplete && phase.key !== 'COMPLETED' ? 'hover:bg-primary/20 cursor-pointer' : ''}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  {done ? '✓ ' : ''}{phase.label}
                </span>
              </button>
              {idx < PHASES.length - 1 && <span className="w-1 h-px bg-border shrink-0 mx-0.5" />}
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground mb-1.5">
          <span>{completedCount} of {total} items completed</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Checklist grouped by category */}
      <div className="space-y-4">
        {PHASES.filter((p) => p.key !== 'COMPLETED').map((phase) => {
          const phaseItems = items.filter((i) => i.category === phase.key);
          if (phaseItems.length === 0) return null;
          return (
            <div key={phase.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABELS[phase.key] ?? phase.key}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border rounded-full px-1.5">
                  {phaseItems.filter((i) => i.completedAt).length}/{phaseItems.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {phaseItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 transition ${
                      item.completedAt ? 'bg-muted/30 border-border/60' : 'bg-card border-border'
                    }`}
                  >
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => toggleItem(item)}
                        aria-label={item.completedAt ? 'Mark incomplete' : 'Mark complete'}
                        className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition ${
                          item.completedAt ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border bg-background hover:border-primary'
                        }`}
                      >
                        {item.completedAt && <Check className="h-3 w-3" />}
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold ${item.completedAt ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        aria-label="Delete item"
                        className="text-muted-foreground/50 hover:text-destructive transition shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add item */}
      {canManage && !isComplete && (
        <div className="rounded-lg border border-dashed border-border p-3">
          {adding ? (
            <div className="space-y-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Item title"
                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <div className="flex items-center gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="KICKOFF">Kickoff</option>
                  <option value="SETUP">Setup</option>
                  <option value="HANDBACK">Handback</option>
                </select>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newTitle.trim() || busy}
                  className="px-3 py-2 bg-primary text-primary-foreground text-[11px] font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-40"
                >
                  Add item
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-3 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add checklist item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
