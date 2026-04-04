import SubmitEntryClient from '@/components/layout/admin/editor/submit-entry-client';
import { getCurrentUser, multiRoleGuard } from '@/lib/auth';
import { getCategories, getMaxOrder } from '@/lib/db';

const SubmitEntryPage = async () => {
  await multiRoleGuard(['SUPERADMIN', 'MODERATOR', 'GUEST']);

  const curUser = await getCurrentUser();
  const curMaxOrder = await getMaxOrder();
  const categories = await getCategories();

  const authorId = 'error' in curUser ? 'unknown' : curUser.user.id;

  return (
    <SubmitEntryClient
      authorId={authorId}
      maxOrder={curMaxOrder}
      categories={categories}
    />
  );
};

export default SubmitEntryPage;
