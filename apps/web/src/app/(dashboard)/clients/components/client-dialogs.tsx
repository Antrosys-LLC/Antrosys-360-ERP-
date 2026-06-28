'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Client } from '../lib/clients-api';

interface ClientDialogsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSaved: () => void;
}

export function ClientDialog({ open, onOpenChange, client, onSaved }: ClientDialogsProps) {
  const isEdit = !!client;
  const [name, setName] = useState(client?.name ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [pipelineStage, setPipelineStage] = useState(client?.pipelineStage ?? 'PROSPECT');
  const [annualRevenue, setAnnualRevenue] = useState(client?.annualRevenue ? String(client.annualRevenue) : '');
  const [monthlyRevenue, setMonthlyRevenue] = useState(client?.monthlyRevenue ? String(client.monthlyRevenue) : '');
  const [renewalDueAt, setRenewalDueAt] = useState(client?.renewalDueAt ?? '');
  const [isAtRisk, setIsAtRisk] = useState(client?.isAtRisk ?? false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const { createClient, updateClient } = await import('../lib/clients-api');
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        pipelineStage,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        monthlyRevenue: monthlyRevenue ? parseFloat(monthlyRevenue) : null,
        renewalDueAt: renewalDueAt ? new Date(renewalDueAt).toISOString() : null,
        isAtRisk,
      };
      if (isEdit && client) {
        await updateClient(client.id, payload);
      } else {
        await createClient(payload);
      }
      onOpenChange(false);
      onSaved();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'Add Client'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Pipeline Stage</Label>
            <select
              value={pipelineStage}
              onChange={(e) => setPipelineStage(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {['PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'AT_RISK'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Annual Revenue (PKR)</Label>
              <Input value={annualRevenue} onChange={(e) => setAnnualRevenue(e.target.value)} placeholder="50000000" type="number" />
            </div>
            <div className="space-y-2">
              <Label>Monthly Revenue (PKR)</Label>
              <Input value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} placeholder="4200000" type="number" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Renewal Due</Label>
            <Input value={renewalDueAt} onChange={(e) => setRenewalDueAt(e.target.value)} type="datetime-local" className="w-full" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAtRisk}
              onChange={(e) => setIsAtRisk(e.target.checked)}
              className="rounded border-input"
            />
            <span className="text-sm font-medium">Mark as at-risk</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
