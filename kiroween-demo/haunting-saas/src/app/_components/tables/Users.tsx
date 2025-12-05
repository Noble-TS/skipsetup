"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Edit,
  Save,
  Ban,
  Trash2,
  Lock,
  LogOut,
  User as UserIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { authClient } from "~/server/better-auth/client";

interface User {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  image: string | null;
  role?: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  banned?: boolean | null;
}

interface EditUserData {
  name: string;
  email: string;
  role: string;
}

type TabType = "all" | "admin" | "partners" | "users";

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditUserData>({
    name: "",
    email: "",
    role: "user",
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const pageSize = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit: 1000,
          offset: 0,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      if (error) {
        setError(`Error: ${error.message}`);
        return;
      }

      if (data && data.users) {
        const formattedUsers: User[] = data.users.map((user: any) => ({
          id: user.id,
          name: user.name || "",
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          email: user.email,
          image: user.image || null,
          role: user.role || "user",
          emailVerified: user.emailVerified || false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt || user.createdAt,
          banned: user.banned || false,
        }));

        setUsers(formattedUsers);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error(" Fetch error:", err);
      setError(
        `Failed to fetch users: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    switch (activeTab) {
      case "admin":
        filtered = filtered.filter((user) => user.role === "admin");
        break;
      case "partners":
        filtered = filtered.filter((user) => user.role === "partner");
        break;
      case "users":
        filtered = filtered.filter(
          (user) => user.role === "user" || !user.role,
        );
        break;
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [users, activeTab, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const startEditing = useCallback((user: User) => {
    setEditingUserId(user.id);
    setEditFormData({
      name: user.name || "",
      email: user.email,
      role: user.role || "user",
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingUserId(null);
    setEditFormData({ name: "", email: "", role: "user" });
  }, []);

  const handleEditChange = useCallback(
    (field: keyof EditUserData, value: string) => {
      setEditFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const saveUser = async (userId: string) => {
    try {
      setActionLoading(`saving-${userId}`);

      const user = users.find((u) => u.id === userId);
      if (user && editFormData.role !== user.role) {
        await authClient.admin.setRole({ userId, role: editFormData.role });
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                name: editFormData.name,
                email: editFormData.email,
                role: editFormData.role,
              }
            : u,
        ),
      );

      setEditingUserId(null);
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user");
    } finally {
      setActionLoading(null);
    }
  };

  const banUser = async (userId: string) => {
    try {
      setActionLoading(`ban-${userId}`);
      const { error } = await authClient.admin.banUser({ userId });

      if (error) {
        setError(`Ban failed: ${error.message}`);
        return;
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, banned: true } : user,
        ),
      );
    } catch (err) {
      console.error("Error banning user:", err);
      setError("Failed to ban user");
    } finally {
      setActionLoading(null);
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      setActionLoading(`unban-${userId}`);
      const { error } = await authClient.admin.unbanUser({ userId });

      if (error) {
        setError(`Unban failed: ${error.message}`);
        return;
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, banned: false } : user,
        ),
      );
    } catch (err) {
      console.error("Error unbanning user:", err);
      setError("Failed to unban user");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setActionLoading(`delete-${userId}`);
      const { error } = await authClient.admin.removeUser({ userId });

      if (error) {
        setError(`Delete failed: ${error.message}`);
        return;
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const impersonateUser = async (userId: string) => {
    try {
      setActionLoading(`impersonate-${userId}`);
      const { data, error } = await authClient.admin.impersonateUser({
        userId,
      });

      if (error) {
        setError(`Impersonation failed: ${error.message}`);
        return;
      }

      if (data) {
        window.location.href = "/admin";
      }
    } catch (err) {
      console.error("Error impersonating user:", err);
      setError("Failed to impersonate user");
    } finally {
      setActionLoading(null);
    }
  };

  const getDisplayName = useCallback((user: User): string => {
    if (user.name && user.name.trim()) return user.name;
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email;
  }, []);

  const getUserInitials = useCallback((user: User): string => {
    if (user.name && user.name.trim()) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.firstName || user.lastName) {
      return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
    }
    return user.email[0].toUpperCase() + (user.email[1] || "").toUpperCase();
  }, []);

  const getTabStats = useCallback(() => {
    const tabUsers = filteredUsers;
    return {
      total: tabUsers.length,
      active: tabUsers.filter((u) => !u.banned).length,
      banned: tabUsers.filter((u) => u.banned).length,
      verified: tabUsers.filter((u) => u.emailVerified).length,
    };
  }, [filteredUsers]);

  const tabStats = getTabStats();

  const tabs = useMemo(
    () => [
      { key: "all" as TabType, label: "All Users", count: users.length },
      {
        key: "admin" as TabType,
        label: "Admins",
        count: users.filter((u) => u.role === "admin").length,
      },
      {
        key: "partners" as TabType,
        label: "Partners",
        count: users.filter((u) => u.role === "partner").length,
      },
      {
        key: "users" as TabType,
        label: "Users",
        count: users.filter((u) => u.role === "user" || !u.role).length,
      },
    ],
    [users],
  );

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-20 shadow-sm">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
        <p className="font-medium text-gray-600">Loading users...</p>
        <p className="mt-1 text-sm text-gray-400">
          Please wait while we fetch user data
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-6 p-2 font-sans duration-500">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage access, roles, and user statuses.
            </p>
          </div>
          <div className="mt-3 flex gap-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers()}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <UserIcon className="h-16 w-16 text-gray-500" />
            </div>
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Total
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {tabStats.total}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-emerald-50/20 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg border border-emerald-100 bg-emerald-100/40 p-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                  Active
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-800">
                {tabStats.active}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-red-100/60 bg-red-50/20 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg border border-red-100 bg-red-100/40 p-2">
                  <Ban className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-red-700 uppercase">
                  Banned
                </span>
              </div>
              <p className="text-2xl font-bold text-red-800">
                {tabStats.banned}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-blue-100/60 bg-blue-50/20 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg border border-blue-100 bg-blue-100/40 p-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-blue-700 uppercase">
                  Verified
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-800">
                {tabStats.verified}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm lg:flex-row">
        <div className="no-scrollbar flex w-full gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-1.5 lg:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                  : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.key ? "bg-gray-100 text-gray-900" : "bg-gray-200 text-gray-500"}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative mb-2 w-full px-2 lg:mb-0 lg:w-80 lg:px-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 lg:pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="border-gray-200 bg-gray-50/50 pl-9 focus:bg-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600"></div>
            <p className="text-gray-500">Loading user data...</p>
          </div>
        ) : (
          <div className="w-full min-w-[1000px]">
            <Table>
              <TableHeader className="border-b border-gray-200 bg-gray-100/70">
                <TableRow className="hover:bg-transparent">
                  <TableCell isHeader className="w-[25%] pl-6">
                    User Details
                  </TableCell>
                  <TableCell isHeader className="w-[15%]">
                    Role
                  </TableCell>
                  <TableCell isHeader className="w-[15%]">
                    Status
                  </TableCell>
                  <TableCell isHeader className="w-[15%]">
                    Verification
                  </TableCell>
                  <TableCell isHeader className="w-[15%]">
                    Joined
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[15%] border-l border-gray-200/80 bg-gray-200/50 pr-6 text-right"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <div className="flex w-full flex-col items-center px-6 py-16 text-center">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        No users found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search or filter criteria.
                      </p>
                    </div>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="group border-b border-gray-100 transition-colors hover:bg-gray-50/60"
                    >
                      <TableCell className="w-[25%] pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B0000] to-red-700 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                            {getUserInitials(user)}
                          </div>
                          <div className="min-w-0 flex-grow">
                            {editingUserId === user.id ? (
                              <div className="space-y-1">
                                <Input
                                  value={editFormData.name}
                                  onChange={(e) =>
                                    handleEditChange("name", e.target.value)
                                  }
                                  className="h-7 w-full text-xs"
                                  placeholder="Name"
                                />
                                <Input
                                  value={editFormData.email}
                                  onChange={(e) =>
                                    handleEditChange("email", e.target.value)
                                  }
                                  className="h-7 w-full text-xs"
                                  placeholder="Email"
                                />
                              </div>
                            ) : (
                              <>
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {getDisplayName(user)}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {user.email}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        {editingUserId === user.id ? (
                          <select
                            value={editFormData.role}
                            onChange={(e) =>
                              handleEditChange("role", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 bg-white p-1.5 text-xs outline-none focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="partner">Partner</option>
                          </select>
                        ) : (
                          <Badge
                            size="sm"
                            color={
                              user.role === "admin"
                                ? "error"
                                : user.role === "partner"
                                  ? "info"
                                  : "default"
                            }
                            className="border font-medium capitalize shadow-sm"
                          >
                            {user.role || "user"}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <Badge
                          size="sm"
                          color={user.banned ? "error" : "success"}
                          className="gap-1.5 border pr-2.5 pl-1.5 font-medium shadow-sm"
                        >
                          {user.banned ? (
                            <Ban className="h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5" />
                          )}
                          {user.banned ? "Banned" : "Active"}
                        </Badge>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <div className="flex items-center gap-2">
                          {user.emailVerified ? (
                            <div className="flex items-center rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />{" "}
                              Verified
                            </div>
                          ) : (
                            <div className="flex items-center rounded-md border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />{" "}
                              Pending
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(user.createdAt).toLocaleTimeString(
                              undefined,
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%] border-l border-gray-100 bg-gray-50/50 pr-6 text-right transition-colors group-hover:bg-gray-100/70">
                        <div className="flex items-center justify-end gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                          {editingUserId === user.id ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="maroon"
                                onClick={() => saveUser(user.id)}
                                disabled={actionLoading === `saving-${user.id}`}
                                className="flex h-8 items-center gap-1.5 border-transparent bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
                              >
                                {actionLoading === `saving-${user.id}` ? (
                                  "..."
                                ) : (
                                  <>
                                    <Save className="h-4 w-4" />
                                    Save
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                className="flex h-8 items-center gap-1.5 border-gray-200 bg-white px-3 text-xs text-gray-600"
                              >
                                <XCircle className="h-4 w-4" />
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(user)}
                                className="h-9 w-9 rounded-lg border border-gray-200 p-0 text-gray-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                title="Edit User"
                              >
                                <Edit className="h-4.5 w-4.5" />
                              </Button>

                              {user.banned ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => unbanUser(user.id)}
                                  disabled={
                                    actionLoading === `unban-${user.id}`
                                  }
                                  className="h-9 w-9 rounded-lg border border-gray-200 p-0 text-gray-600 transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-600"
                                  title="Unban User"
                                >
                                  <CheckCircle className="h-4.5 w-4.5" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => banUser(user.id)}
                                  disabled={actionLoading === `ban-${user.id}`}
                                  className="h-9 w-9 rounded-lg border border-gray-200 p-0 text-gray-600 transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                                  title="Ban User"
                                >
                                  <Ban className="h-4.5 w-4.5" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => impersonateUser(user.id)}
                                disabled={
                                  actionLoading === `impersonate-${user.id}`
                                }
                                className="h-9 w-9 rounded-lg border border-gray-200 p-0 text-gray-600 transition-all hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600"
                                title="Impersonate User"
                              >
                                <LogOut className="h-4.5 w-4.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteUser(user.id)}
                                disabled={actionLoading === `delete-${user.id}`}
                                className="h-9 w-9 rounded-lg border border-gray-200 p-0 text-gray-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                title="Delete User"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
        <span className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {(currentPage - 1) * pageSize + 1}
          </span>{" "}
          -{" "}
          <span className="font-semibold text-gray-900">
            {Math.min(currentPage * pageSize, filteredUsers.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">
            {filteredUsers.length}
          </span>
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="h-9 border-gray-200 px-4 text-gray-700 hover:bg-gray-50"
          >
            Previous
          </Button>
          <div className="flex items-center rounded-lg border border-gray-100 bg-gray-50 px-4 py-1.5">
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages || 1}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="h-9 border-gray-200 px-4 text-gray-700 hover:bg-gray-50"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
