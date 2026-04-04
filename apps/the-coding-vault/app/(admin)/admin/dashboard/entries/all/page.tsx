import { multiRoleGuard } from '@/lib/auth';

const AllEntriesPage = async () => {
  await multiRoleGuard(['SUPERADMIN', 'MODERATOR']);

  return <div>AllEntriesPage</div>;
};

export default AllEntriesPage;
