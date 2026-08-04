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
  canOnboard?: boolean;
}

const PIPELINE_STAGES = ['PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'ONBOARDING', 'ACTIVE', 'AT_RISK'];

export function ClientDialog({ open, onOpenChange, client, onSaved, canOnboard = false }: ClientDialogsProps) {
  const { toast } = useToast();
  const isEdit = !!client;
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [tier, setTier] = useState('');
  const [pipelineStage, setPipelineStage] = useState('PROSPECT');
  const [startOnboarding, setStartOnboarding] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setName(client?.name ?? '');
      setClientCode(client?.clientCode ?? '');
      setEmail(client?.email ?? '');
      setPhone(client?.phone ?? '');
      setIndustry(client?.industry ?? '');
      setTier(client?.tier ?? '');
      setPipelineStage(client?.pipelineStage ?? 'PROSPECT');
      setStartOnboarding(false);
      setStartDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, client]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const { createClient, updateClient, startClientOnboarding } = await import('../lib/clients-api');
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
        const created = await createClient(payload);
        if (startOnboarding && canOnboard) {
          await startClientOnboarding(created.id, {
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
          });
          toast({ title: 'Client created', description: 'Onboarding started with a default checklist.' });
        } else {
          toast({ title: 'Client created' });
        }
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

  const nextStep = () => (canOnboard && !isEdit ? setStep(2) : handleSubmit());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'Add Client'}</DialogTitle>
        </DialogHeader>

        {canOnboard && !isEdit && (
          <div className="flex items-center gap-2 mb-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={`h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center border transition ${
                    step >= s ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {s}
                </span>
                <span className={`text-xs font-semibold ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Client details' : 'Onboarding'}
                </span>
                {s === 1 && <span className="w-8 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>
        )}

        {step === 1 ? (
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
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:border-primary/40 transition">
              <input
                type="checkbox"
                checked={startOnboarding}
                onChange={(e) => setStartOnboarding(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">Start client onboarding</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Creates a phase checklist (kickoff → setup → handback) with a default list of onboarding tasks.
                </span>
              </span>
            </label>
            {startOnboarding && (
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => (step === 2 ? setStep(1) : onOpenChange(false))}>
            {step === 2 ? 'Back' : 'Cancel'}
          </Button>
          <Button onClick={step === 1 ? nextStep : handleSubmit} disabled={!name.trim() || submitting}>
            {submitting
              ? 'Saving...'
              : isEdit
                ? 'Update'
                : step === 1
                  ? canOnboard
                    ? 'Next'
                    : 'Create'
                  : 'Create client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
