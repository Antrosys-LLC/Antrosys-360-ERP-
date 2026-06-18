import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { UserPlus, Plus } from 'lucide-react';

export default function RecruitmentPage() {
  return (
    <div>
      <PageHeader
        title="Recruitment"
        subtitle="Track job openings and candidates"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Post Job</Button>}
      />
      <div className="mt-8">
        <EmptyState
          icon={UserPlus}
          title="No open positions"
          description="Post job openings and manage your recruitment pipeline."
        />
      </div>
    </div>
  );
}
