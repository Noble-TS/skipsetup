import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  product: ["create", "read", "update", "delete", "manage"],
  order: ["create", "read", "update", "delete", "manage", "fulfill"],
  transaction: ["read", "export", "refund"],
  customer: ["read", "update", "ban"],
  analytics: ["read", "export"],
  settings: ["read", "update"],
} as const;

export const ac = createAccessControl(statement);

export const customer = ac.newRole({
  order: ["create", "read"],
  transaction: ["read"],
});

export const contentManager = ac.newRole({
  product: ["create", "read", "update"],
  order: ["read", "fulfill"],
  transaction: ["read"],
  customer: ["read"],
  analytics: ["read"],
});

export const orderManager = ac.newRole({
  product: ["read"],
  order: ["read", "update", "manage", "fulfill"],
  transaction: ["read"],
  customer: ["read"],
  analytics: ["read"],
});

export const financeManager = ac.newRole({
  product: ["read"],
  order: ["read"],
  transaction: ["read", "export", "refund"],
  customer: ["read"],
  analytics: ["read", "export"],
});

export const admin = ac.newRole({
  product: ["create", "read", "update", "delete", "manage"],
  order: ["create", "read", "update", "delete", "manage", "fulfill"],
  transaction: ["read", "export", "refund"],
  customer: ["read", "update", "ban"],
  analytics: ["read", "export"],
  settings: ["read", "update"],
  user: defaultStatements.user,
  session: defaultStatements.session,
});

export const superAdmin = ac.newRole({
  product: ["create", "read", "update", "delete", "manage"],
  order: ["create", "read", "update", "delete", "manage", "fulfill"],
  transaction: ["read", "export", "refund"],
  customer: ["read", "update", "ban"],
  analytics: ["read", "export"],
  settings: ["read", "update"],
  user: defaultStatements.user,
  session: defaultStatements.session,
});

// Export all roles for easy access
export const roles = {
  customer,
  contentManager,
  orderManager,
  financeManager,
  admin,
  superAdmin,
} as const;

export type UserRole = keyof typeof roles;
