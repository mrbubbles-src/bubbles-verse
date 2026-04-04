import { multiRoleGuard } from '@/lib/auth';

const DeleteUserPage = async () => {
  await multiRoleGuard(['SUPERADMIN']);

  return <div>DeleteUserPage</div>;
};

export default DeleteUserPage;
