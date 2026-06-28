'use client';

import { Clock, Activity, CheckCircle, FileText } from 'lucide-react';
import type { ClientTimelineEvent } from '../lib/clients-api';

const eventIcons: Record<string, typeof Clock> = {
  CREATED: Activity,
  STATUS_CHANGED: Activity,
  RENEWAL_DUE: Clock,
  RENEWAL_COMPLETED: CheckCircle,
  PROJECT_STARTED: FileText,
  PROJECT_COMPLETED: CheckCircle,
  TASK_COMPLETED: CheckCircle,
  ACTIVITY: Activity,
};

interface ClientTimelineProps {
  clientId: string;
  events: ClientTimelineEvent[];
}

export function ClientTimeline({ clientId, events }: ClientTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-lg">
        <Clock className="h-6 w-6 text-muted-foreground/50 mb-2" />
        <span className="text-xs font-semibold text-muted-foreground">No timeline events yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block">
        Timeline
      </span>
      <div className="space-y-2.5">
        {events.map((event) => {
          const Icon = eventIcons[event.eventType] || Activity;
          return (
            <div key={event.id} className="flex items-start gap-3 border-b border-border/40 pb-2.5 last:border-0">
              <div className="shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{event.title}</p>
                {event.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{event.description}</p>
                )}
                <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                  {new Date(event.eventDate).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
