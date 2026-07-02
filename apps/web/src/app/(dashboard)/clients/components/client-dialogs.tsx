'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '../lib/clients-api';

interface ClientDialogsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSaved: () => void;
}

export function ClientDialog({ open, onOpenChange, client, onSaved }: ClientDialogsProps) {
  const { toast } = useToast();
  const isEdit = !!client;
  const [name, setName] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [tier, setTier] = useState('');
  const [pipelineStage, setPipelineStage] = useState('PROSPECT');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(client?.name ?? '');
      setClientCode(client?.clientCode ?? '');
      setEmail(client?.email ?? '');
      setPhone(client?.phone ?? '');
      setIndustry(client?.industry ?? '');
      setTier(client?.tier ?? '');
      setPipelineStage(client?.pipelineStage ?? 'PROSPECT');
    }
  }, [open, client]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const { createClient, updateClient } = await import('../lib/clients-api');
      const payload = {
        name: name.trim(),
        clientCode: clientCode.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        industry: industry.trim() || null,
        tier: tier.trim() || null,
        pipelineStage,
        currencyCode: 'PKR',
      };
      if (isEdit && client) {
        await updateClient(client.id, payload);
        toast({ title: 'Client updated' });
      } else {
        await createClient(payload);
        toast({ title: 'Client created' });
      }
      onOpenChange(false);
      onSaved();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to save client. Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'Add Client'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
            </div>
            <div className="space-y-2">
              <Label>Client Code</Label>
              <Input value={clientCode} onChange={(e) => setClientCode(e.target.value)} placeholder="CLT-001" />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Technology & SaaS" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" />
            </div>
            <div className="space-y-2">
              <Label>Tier</Label>
              <Input value={tier} onChange={(e) => setTier(e.target.value)} placeholder="Enterprise" />
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
          </div>
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
