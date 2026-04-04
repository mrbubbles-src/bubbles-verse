'use client';

import { useRouter } from 'next/navigation';
import { handleLogout } from '@/lib/utils';

export const LogoutButton = () => {
  const router = useRouter();

  const onLogout = async () => {
    await handleLogout();
    router.push('/');
  };

  return (
    <span onClick={onLogout} className="w-full text-left">
      Logout
    </span>
  );
};
