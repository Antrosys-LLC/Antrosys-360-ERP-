'use client';

import { useState } from 'react';
import { Plus, Loader2, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClientContact } from '../lib/clients-api';

interface ClientContactsProps {
  clientId: string;
  contacts: ClientContact[];
  onUpdate: () => void;
}

export function ClientContacts({ clientId, contacts, onUpdate }: ClientContactsProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const { createContact } = await import('../lib/clients-api');
      await createContact(clientId, {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        role: role.trim() || null,
        isPrimary: contacts.length === 0,
      });
      setName('');
      setEmail('');
      setPhone('');
      setRole('');
      setShowForm(false);
      onUpdate();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
          Contacts ({contacts.length})
        </span>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
          <input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20" />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="text-xs px-2 py-1.5 bg-background border border-border rounded-md" />
            <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="text-xs px-2 py-1.5 bg-background border border-border rounded-md" />
          </div>
          <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded-md" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-7 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || submitting} className="h-7 text-xs">
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">No contacts yet</div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{contact.name}</span>
                  {contact.isPrimary && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">Primary</span>
                  )}
                </div>
                {contact.role && <span className="text-xs text-muted-foreground block">{contact.role}</span>}
                <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-muted-foreground">
                  {contact.email && (
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
