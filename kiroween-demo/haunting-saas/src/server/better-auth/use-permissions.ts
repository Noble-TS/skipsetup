"use client";
import { authClient, useSession } from "./client";

export function usePermissions() {
  const { data: session, status } = useSession();

  const userRoles =
    session?.user?.role?.split(",").map((role) => role.trim()) || [];
  const isAdmin =
    userRoles.includes("admin") || userRoles.includes("superAdmin");
  const isSuperAdmin = userRoles.includes("superAdmin");

  const hasPermission = async (permissions: Record<string, string[]>) => {
    // Admin users automatically have all permissions
    if (isAdmin) return true;

    if (!session?.user?.id) return false;

    try {
      const result = await authClient.admin.hasPermission({
        userId: session.user.id,
        permissions,
      });
      return result.data?.hasPermission || false;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  };

  const checkRolePermission = (
    permissions: Record<string, string[]>,
    role: string,
  ) => {
    return authClient.admin.checkRolePermission({
      permissions,
      role,
    });
  };

  const can = {
    // Product permissions
    createProduct: () => hasPermission({ product: ["create"] }),
    readProducts: () => hasPermission({ product: ["read"] }),
    updateProduct: () => hasPermission({ product: ["update"] }),
    deleteProduct: () => hasPermission({ product: ["delete"] }),
    manageProducts: () => hasPermission({ product: ["manage"] }),

    // Order permissions
    createOrder: () => hasPermission({ order: ["create"] }),
    readOrders: () => hasPermission({ order: ["read"] }),
    updateOrder: () => hasPermission({ order: ["update"] }),
    deleteOrder: () => hasPermission({ order: ["delete"] }),
    manageOrders: () => hasPermission({ order: ["manage"] }),
    fulfillOrder: () => hasPermission({ order: ["fulfill"] }),

    // Transaction permissions
    readTransactions: () => hasPermission({ transaction: ["read"] }),
    exportTransactions: () => hasPermission({ transaction: ["export"] }),
    refundTransaction: () => hasPermission({ transaction: ["refund"] }),

    // Customer permissions
    readCustomers: () => hasPermission({ customer: ["read"] }),
    updateCustomer: () => hasPermission({ customer: ["update"] }),
    banCustomer: () => hasPermission({ customer: ["ban"] }),

    // Analytics permissions
    readAnalytics: () => hasPermission({ analytics: ["read"] }),
    exportAnalytics: () => hasPermission({ analytics: ["export"] }),

    // Settings permissions
    readSettings: () => hasPermission({ settings: ["read"] }),
    updateSettings: () => hasPermission({ settings: ["update"] }),
  };

  return {
    session,
    status,
    hasPermission,
    checkRolePermission,
    can,
    isAdmin,
    isSuperAdmin,
    userRole: session?.user?.role,
  };
}
