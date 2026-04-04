import { multiRoleGuard } from '@/lib/auth';

const AllUsersPage = async () => {
  await multiRoleGuard(['SUPERADMIN']);

  return <div>AllUsersPage</div>;
};

export default AllUsersPage;
