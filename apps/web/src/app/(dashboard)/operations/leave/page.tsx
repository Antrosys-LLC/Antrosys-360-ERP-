import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';

export default function LeavePage() {
  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle="Manage leave requests and balances"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Apply Leave</Button>}
      />
      <div className="mt-8">
        <EmptyState
          icon={Calendar}
          title="No leave requests"
          description="Leave requests from employees will appear here for review and approval."
        />
      </div>
    </div>
  );
}
