"use client";

import { useSession } from "~/server/better-auth/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasChecked, setHasChecked] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      if (pathname !== "/signin") {
        router.push("/signin");
      }
      return;
    }

    const userRole = session.user?.role || "user";

    const roleAllowedRoutes: Record<string, string[]> = {
      admin: ["/admin", "/orders"],
      superAdmin: ["/admin", "/orders"],
      contentManager: ["/admin"],
      orderManager: ["/admin"],
      financeManager: ["/admin"],
      partner: ["/partners", "/orders", "/admin"],
      user: ["/orders"],
      customer: ["/orders"],
    };

    const userRoles = userRole.split(",").map((role) => role.trim());

    let allowedRoutes: string[] = [];
    userRoles.forEach((role) => {
      if (roleAllowedRoutes[role]) {
        allowedRoutes = [...allowedRoutes, ...roleAllowedRoutes[role]];
      }
    });

    allowedRoutes = [...new Set(allowedRoutes)];

    const defaultRoutes: Record<string, string> = {
      admin: "/admin",
      superAdmin: "/admin",
      contentManager: "/admin",
      orderManager: "/admin",
      financeManager: "/admin",
      partner: "/partners",
      user: "/orders",
      customer: "/orders",
    };

    let defaultRoute = "/orders";
    for (const role of userRoles) {
      if (defaultRoutes[role]) {
        defaultRoute = defaultRoutes[role];
        break;
      }
    }

    const isPathAllowed = allowedRoutes.some((route) =>
      pathname.startsWith(route),
    );

    const shouldRedirect =
      !isPathAllowed &&
      !pathname.startsWith("/unauthorized") &&
      pathname !== "/signin";

    if (shouldRedirect) {
      router.push(defaultRoute);
    } else {
      setHasChecked(true);
    }
  }, [session, isPending, router, pathname]);

  const LoadingSpinner = () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#8B0000]"></div>
        <p>Loading...</p>
      </div>
    </div>
  );

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#8B0000]"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <LoadingSpinner />;
  }

  const userRole = session.user?.role || "user";
  const userRoles = userRole.split(",").map((role) => role.trim());

  const roleAllowedRoutes: Record<string, string[]> = {
    admin: ["/admin", "/orders"],
    superAdmin: ["/admin", "/orders"],
    contentManager: ["/admin"],
    orderManager: ["/admin"],
    financeManager: ["/admin"],
    partner: ["/partners", "/orders", "/admin"],
    user: ["/orders"],
    customer: ["/orders"],
  };

  let allowedRoutes: string[] = [];
  userRoles.forEach((role) => {
    if (roleAllowedRoutes[role]) {
      allowedRoutes = [...allowedRoutes, ...roleAllowedRoutes[role]];
    }
  });
  allowedRoutes = [...new Set(allowedRoutes)];

  const isPathAllowed = allowedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (
    !isPathAllowed &&
    !pathname.startsWith("/unauthorized") &&
    pathname !== "/signin"
  ) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
