import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Manage and track all invoices"
        actions={<Button><Plus className="mr-2 h-4 w-4" />New Invoice</Button>}
      />
      <div className="mt-8">
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice to start tracking payments and revenue."
          action={<Button variant="outline"><Plus className="mr-2 h-4 w-4" />Create Invoice</Button>}
        />
      </div>
    </div>
  );
}
