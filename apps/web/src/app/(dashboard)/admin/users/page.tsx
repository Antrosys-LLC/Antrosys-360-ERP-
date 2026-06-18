import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Shield, UserPlus } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage system users, roles, and access"
        actions={<Button><UserPlus className="mr-2 h-4 w-4" />Add User</Button>}
      />
      <div className="mt-8">
        <EmptyState
          icon={Shield}
          title="No users to display"
          description="System users and their roles will be managed from this section."
        />
      </div>
    </div>
  );
}
