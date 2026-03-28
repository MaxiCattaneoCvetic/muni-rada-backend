import { UserRole } from '../users/user.entity';

/** Emails de usuarios demo (seed + POST /auth/demo). */
export const DEMO_EMAIL_BY_ROLE: Record<UserRole, string> = {
  [UserRole.SECRETARIA]: 'demo-secretaria@demo.local',
  [UserRole.COMPRAS]: 'demo-compras@demo.local',
  [UserRole.TESORERIA]: 'demo-tesoreria@demo.local',
  [UserRole.ADMIN]: 'demo-admin@demo.local',
};
