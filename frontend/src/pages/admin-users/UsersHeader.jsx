import React from 'react';
import { UserPlus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

// Title, capacity meter and the Add member button.
const UsersHeader = ({ usersData, isMaxReached, onAdd }) => {
  const max = usersData.max_allowed || 10;
  return (
    <PageHeader
      eyebrow="Admin"
      title="Members"
      subtitle="Add people, set their calorie targets and look at their diaries"
    >
      <div className="h-11 flex items-center gap-3 px-4 rounded-full bg-white border border-gray-100">
        <span className="text-sm text-gray-600">
          <span className="font-extrabold text-gray-900">{usersData.total_users}</span> / {max} seats
        </span>
        <span className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
          <span
            className={`block h-full rounded-full ${isMaxReached ? 'bg-rose-500' : 'bg-amber-400'}`}
            style={{ width: `${Math.min(100, (usersData.total_users / max) * 100)}%` }}
          />
        </span>
      </div>
      <button
        onClick={onAdd}
        disabled={isMaxReached}
        title={isMaxReached ? 'All seats are taken' : undefined}
        className="btn-primary h-11 flex items-center gap-2"
      >
        <UserPlus size={17} /> Add member
      </button>
    </PageHeader>
  );
};

export default UsersHeader;
