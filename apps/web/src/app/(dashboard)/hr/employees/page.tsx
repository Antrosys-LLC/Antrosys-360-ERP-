import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Users, UserPlus } from 'lucide-react';

export default function EmployeesPage() {
  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your workforce directory"
        actions={<Button><UserPlus className="mr-2 h-4 w-4" />Add Employee</Button>}
      />
      <div className="mt-8">
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Add employees to build your organization's workforce directory."
        />
      </div>
    </div>
  );
}
