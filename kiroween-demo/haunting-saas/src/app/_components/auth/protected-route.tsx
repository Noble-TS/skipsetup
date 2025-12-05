"use client";
import React from "react";
import { usePermissions } from "~/server/better-auth/use-permissions";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: keyof ReturnType<typeof usePermissions>["can"];
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  permission,
  fallback = null,
}: ProtectedRouteProps) {
  const { can, session, status, isAdmin } = usePermissions();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#8B0000]"></div>
      </div>
    );
  }

  if (!session) {
    return <>{fallback}</>;
  }

  if (!permission) {
    return <>{children}</>;
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  const [hasPermission, setHasPermission] = React.useState<boolean | null>(
    null,
  );

  React.useEffect(() => {
    const checkPermission = async () => {
      const result = await can[permission]();
      setHasPermission(result);
    };
    checkPermission();
  }, [permission, can]);

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#8B0000]"></div>
      </div>
    );
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
