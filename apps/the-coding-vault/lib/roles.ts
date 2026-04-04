const canDeleteEntry = (role: string) => {
  return role === 'SUPERADMIN';
};

const canManageUsers = (role: string) => {
  return role === 'SUPERADMIN';
};

const canSubmitEntry = (role: string) => {
  return ['SUPERADMIN', 'MODERATOR', 'GUEST'].includes(role);
};

const canViewEntries = (role: string) => {
  return ['SUPERADMIN', 'MODERATOR', 'GUEST'].includes(role);
};

export { canDeleteEntry, canManageUsers, canSubmitEntry, canViewEntries };
