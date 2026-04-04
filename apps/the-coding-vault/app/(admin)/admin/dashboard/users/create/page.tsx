import { multiRoleGuard } from '@/lib/auth';

const CreateUserPage = async () => {
  await multiRoleGuard(['SUPERADMIN']);

  return <div>CreateUserPage</div>;
};

export default CreateUserPage;
