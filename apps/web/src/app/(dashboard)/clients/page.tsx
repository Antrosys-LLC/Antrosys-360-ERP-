import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';

export default function ClientsPage() {
  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Manage client accounts and contracts"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Add Client</Button>}
      />
      <div className="mt-8">
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Add your first client to start managing accounts and projects."
        />
      </div>
    </div>
  );
}
