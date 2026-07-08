'use client';

import { useEffect, useRef, useState } from 'react';
import { Trophy, GripVertical } from 'lucide-react';
import type { SalesPipeline, SalesPipelineCard } from '../lib/clients-api';
import { SALES_STAGE_LABELS, formatCurrency } from '../lib/client-utils';

const STAGE_ORDER = ['INITIAL_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CONTRACT_REVIEW', 'CLOSED_WON'] as const;
type Stage = (typeof STAGE_ORDER)[number];

const STAGE_ACCENT: Record<string, string> = {
  INITIAL_CONTACT: 'border-l-primary',
  PROPOSAL: 'border-l-primary',
  NEGOTIATION: 'border-l-destructive',
  CONTRACT_REVIEW: 'border-l-amber-500',
  CLOSED_WON: 'border-l-emerald-500',
};

const emptyBoard = (): Record<string, SalesPipelineCard[]> =>
  STAGE_ORDER.reduce((acc, s) => ({ ...acc, [s]: [] }), {} as Record<string, SalesPipelineCard[]>);

function normalize(pipeline: SalesPipeline | null): Record<string, SalesPipelineCard[]> {
  const board = emptyBoard();
  if (!pipeline) return board;
  for (const stage of STAGE_ORDER) {
    board[stage] = pipeline[stage] ? [...pipeline[stage]] : [];
  }
  return board;
}

interface SalesPipelineBoardProps {
  pipeline: SalesPipeline | null;
  loading: boolean;
  canWrite?: boolean;
  onMoved?: (clientId: string, stage: string) => Promise<void>;
}

export function SalesPipelineBoard({ pipeline, loading, canWrite = false, onMoved }: SalesPipelineBoardProps) {
  const [board, setBoard] = useState<Record<string, SalesPipelineCard[]>>(() => normalize(pipeline));
  const [dragging, setDragging] = useState<{ clientId: string; from: Stage } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const draggingRef = useRef<{ clientId: string; from: Stage } | null>(null);

  useEffect(() => {
    setBoard(normalize(pipeline));
  }, [pipeline]);

  const handleDragStart = (clientId: string, from: Stage) => {
    const payload = { clientId, from };
    draggingRef.current = payload;
    setDragging(payload);
  };

  const handleDragEnd = () => {
    draggingRef.current = null;
    setDragging(null);
    setDragOverStage(null);
  };

  const handleDrop = async (to: Stage) => {
    const current = draggingRef.current;
    setDragOverStage(null);
    if (!current || current.from === to) {
      handleDragEnd();
      return;
    }

    const { clientId, from } = current;
    const snapshot = board;
    const card = snapshot[from]?.find((c) => c.id === clientId);
    if (!card) {
      handleDragEnd();
      return;
    }

    // Optimistic move
    setBoard((prev) => ({
      ...prev,
      [from]: prev[from].filter((c) => c.id !== clientId),
      [to]: [...prev[to], card],
    }));
    handleDragEnd();

    if (!onMoved) return;
    setSavingIds((prev) => new Set(prev).add(clientId));
    try {
      await onMoved(clientId, to);
    } catch {
      // Revert on failure
      setBoard(snapshot);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(clientId);
        return next;
      });
    }
  };

  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-foreground">Sales Pipeline</h3>
        {canWrite && (
          <span className="text-[10px] text-muted-foreground">Drag cards between stages to update</span>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {STAGE_ORDER.map((stage) => {
            const cards = board[stage] ?? [];
            const isClosedWon = stage === 'CLOSED_WON';
            const isOver = dragOverStage === stage && dragging?.from !== stage;
            return (
              <div
                key={stage}
                onDragOver={(e) => {
                  if (!dragging) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverStage !== stage) setDragOverStage(stage);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverStage((prev) => (prev === stage ? null : prev));
                  }
                }}
                onDrop={() => handleDrop(stage)}
                className={`rounded-lg p-3 min-h-[160px] flex flex-col transition-colors ${
                  isOver ? 'bg-primary/10 ring-2 ring-primary/40' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {SALES_STAGE_LABELS[stage]}
                  </span>
                  {cards.length > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground bg-card border border-border rounded-full px-1.5">
                      {cards.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  {cards.length === 0 && isClosedWon ? (
                    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                      <Trophy className="h-6 w-6 text-muted-foreground/40 mb-1.5" />
                      <span className="text-[11px] text-muted-foreground">No wins yet this week</span>
                    </div>
                  ) : cards.length === 0 ? (
                    <div className={`text-[11px] py-6 text-center rounded-md border border-dashed ${
                      isOver ? 'border-primary/50 text-primary' : 'border-transparent text-muted-foreground/60'
                    }`}>
                      {isOver ? 'Drop here' : 'Empty'}
                    </div>
                  ) : (
                    cards.map((card) => {
                      const isSaving = savingIds.has(card.id);
                      const isBeingDragged = dragging?.clientId === card.id;
                      return (
                        <div
                          key={card.id}
                          draggable={canWrite && !isSaving}
                          onDragStart={() => handleDragStart(card.id, stage)}
                          onDragEnd={handleDragEnd}
                          className={`group bg-card border border-border border-l-[3px] ${STAGE_ACCENT[stage]} rounded-md px-2.5 py-2 shadow-xs transition ${
                            canWrite && !isSaving ? 'cursor-grab active:cursor-grabbing hover:border-primary/40' : ''
                          } ${isBeingDragged ? 'opacity-40' : ''} ${isSaving ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start gap-1.5">
                            {canWrite && (
                              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground" />
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-foreground block truncate">{card.name}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {formatCurrency(card.annualRevenue, card.currencyCode)}
                              </span>
                            </div>
                            {isSaving && (
                              <div className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
