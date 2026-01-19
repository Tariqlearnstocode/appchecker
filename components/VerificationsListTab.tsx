'use client';

import { VerificationsTable, Verification } from './VerificationsTable';

type FilterType = 'all' | 'pending' | 'completed' | 'canceled';

interface VerificationsListTabProps {
  verifications: Verification[];
  selectedVerification: Verification | null;
  onSelect: (verification: Verification) => void;
  onCopyLink?: (token: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (verification: Verification) => void;
  loading: boolean;
  filter: FilterType;
}

const filterTitles: Record<FilterType, string> = {
  all: 'All Verifications',
  pending: 'Pending Verifications',
  completed: 'Completed Verifications',
  canceled: 'Canceled Verifications',
};

export function VerificationsListTab({
  verifications,
  selectedVerification,
  onSelect,
  onCopyLink,
  onDelete,
  onEdit,
  loading,
  filter,
}: VerificationsListTabProps) {
  // Filter verifications based on filter type
  const filteredVerifications =
    filter === 'all'
      ? verifications
      : verifications.filter((v) => v.status === filter);

  return (
    <VerificationsTable
      verifications={filteredVerifications}
      selectedVerification={selectedVerification}
      onSelect={onSelect}
      onCopyLink={onCopyLink}
      onDelete={onDelete}
      onEdit={onEdit}
      loading={loading}
      title={filterTitles[filter]}
      showPagination={true}
    />
  );
}

