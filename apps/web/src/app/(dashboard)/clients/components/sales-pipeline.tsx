'use client';

import { Trophy } from 'lucide-react';
import type { SalesPipeline } from '../lib/clients-api';
import { SALES_STAGE_LABELS, formatCurrency } from '../lib/client-utils';

const STAGE_ORDER = ['INITIAL_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CONTRACT_REVIEW', 'CLOSED_WON'] as const;

const STAGE_ACCENT: Record<string, string> = {
  INITIAL_CONTACT: 'border-l-primary',
  PROPOSAL: 'border-l-primary',
  NEGOTIATION: 'border-l-destructive',
  CONTRACT_REVIEW: 'border-l-amber-500',
  CLOSED_WON: 'border-l-emerald-500',
};

interface SalesPipelineBoardProps {
  pipeline: SalesPipeline | null;
  loading: boolean;
  onMoveStage?: (clientId: string, stage: string) => void;
}

export function SalesPipelineBoard({ pipeline, loading }: SalesPipelineBoardProps) {
  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-xs">
      <h3 className="font-bold text-sm text-foreground mb-4">Sales Pipeline</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {STAGE_ORDER.map((stage) => {
            const cards = pipeline?.[stage] ?? [];
            const isClosedWon = stage === 'CLOSED_WON';
            return (
              <div key={stage} className="bg-muted/30 rounded-lg p-3 min-h-[140px] flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {SALES_STAGE_LABELS[stage]}
                </span>
                <div className="flex-1 space-y-2">
                  {cards.length === 0 && isClosedWon ? (
                    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                      <Trophy className="h-6 w-6 text-muted-foreground/40 mb-1.5" />
                      <span className="text-[11px] text-muted-foreground">No wins yet this week</span>
                    </div>
                  ) : cards.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground/60 py-2">Empty</div>
                  ) : (
                    cards.map((card) => (
                      <div
                        key={card.id}
                        className={`bg-card border border-border border-l-[3px] ${STAGE_ACCENT[stage]} rounded-md px-2.5 py-2 shadow-xs`}
                      >
                        <span className="text-xs font-bold text-foreground block truncate">{card.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {formatCurrency(card.annualRevenue, card.currencyCode)}
                        </span>
                      </div>
                    ))
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
