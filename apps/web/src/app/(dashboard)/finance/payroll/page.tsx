import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Wallet, Play } from 'lucide-react';

export default function PayrollPage() {
  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Process and manage employee payroll"
        actions={<Button><Play className="mr-2 h-4 w-4" />Run Payroll</Button>}
      />
      <div className="mt-8">
        <EmptyState
          icon={Wallet}
          title="No payroll records"
          description="Run your first payroll cycle to start processing employee salaries."
        />
      </div>
    </div>
  );
}
