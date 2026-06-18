import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Download } from 'lucide-react';

export default function AttendancePage() {
  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Track employee attendance and work hours"
        actions={<Button><Download className="mr-2 h-4 w-4" />Export</Button>}
      />
      <div className="mt-8">
        <EmptyState
          icon={ClipboardCheck}
          title="No attendance records"
          description="Attendance records will appear here once employees start clocking in."
        />
      </div>
    </div>
  );
}
