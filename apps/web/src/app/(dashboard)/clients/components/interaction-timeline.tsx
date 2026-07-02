'use client';

import { Mail, AlertTriangle, CreditCard, Activity, FileText } from 'lucide-react';
import type { GlobalTimelineEvent } from '../lib/clients-api';
import { formatRelativeTime } from '../lib/client-utils';

const EVENT_ICONS: Record<string, typeof Mail> = {
  EMAIL: Mail,
  ALERT: AlertTriangle,
  PAYMENT: CreditCard,
  STATUS: Activity,
  PROPOSAL: FileText,
  ACTIVITY: Activity,
  CREATED: Activity,
};

interface InteractionTimelineProps {
  events: GlobalTimelineEvent[];
  loading: boolean;
}

export function InteractionTimeline({ events, loading }: InteractionTimelineProps) {
  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-xs h-full">
      <h3 className="font-bold text-sm text-foreground mb-4">Interaction Timeline</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No recent interactions</p>
      ) : (
        <div className="space-y-0">
          {events.map((event, i) => {
            const Icon = EVENT_ICONS[event.eventType] ?? Activity;
            return (
              <div key={event.id} className="flex gap-3 relative">
                {i < events.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                )}
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                  <Icon className="h-3 w-3 text-primary" />
                </div>
                <div className="pb-4 min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground leading-snug">{event.title}</p>
                  {event.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                  )}
                  <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                    {formatRelativeTime(event.eventDate)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
