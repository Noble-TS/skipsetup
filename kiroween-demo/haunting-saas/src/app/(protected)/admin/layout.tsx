"use client";

import React, { useState, useEffect } from "react";
import AdminLayoutClient from "~/app/_components/layout/AdminLayoutClient";
import { SidebarProvider } from "~/app/_components/context/SidebarContext";
import { ThemeProvider } from "~/app/_components/context/ThemeContext";
import AuthGuard from "~/app/_components/auth/AuthGuard";

import "~/styles/globals.css";

function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <ThemeProvider>
        <SidebarProvider>
          <AdminLayoutClient>{children}</AdminLayoutClient>
        </SidebarProvider>
      </ThemeProvider>
    </AuthGuard>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
