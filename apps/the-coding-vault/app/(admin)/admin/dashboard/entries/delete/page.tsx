import { multiRoleGuard } from '@/lib/auth';

const DeleteEntryPage = async () => {
  await multiRoleGuard(['SUPERADMIN']);

  return <div>DeleteEntryPage</div>;
};

export default DeleteEntryPage;
