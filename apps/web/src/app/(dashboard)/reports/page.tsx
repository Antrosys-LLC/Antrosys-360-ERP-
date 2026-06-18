import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { BarChart3, Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="View and generate organizational reports"
        actions={<Button><Download className="mr-2 h-4 w-4" />Generate Report</Button>}
      />
      <div className="mt-8">
        <EmptyState
          icon={BarChart3}
          title="No reports available"
          description="Generate reports to analyze organizational performance and metrics."
        />
      </div>
    </div>
  );
}
