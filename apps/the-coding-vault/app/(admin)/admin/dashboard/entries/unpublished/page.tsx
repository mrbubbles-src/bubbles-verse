import { multiRoleGuard } from '@/lib/auth';

const UnpublishedEntriesPage = async () => {
  await multiRoleGuard(['SUPERADMIN', 'MODERATOR']);

  return <div>UnpublishedEntriesPage</div>;
};

export default UnpublishedEntriesPage;
