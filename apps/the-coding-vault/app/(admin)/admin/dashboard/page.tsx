import { multiRoleGuard } from '@/lib/auth';

const AdminDashboard = async () => {
  await multiRoleGuard(['SUPERADMIN', 'MODERATOR', 'GUEST']);

  return <div>AdminDashboard</div>;
};

export default AdminDashboard;
