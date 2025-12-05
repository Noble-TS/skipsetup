"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  CreditCard,
  DollarSign,
  Truck,
  CheckCircle,
  Copy,
  FileText,
  Mail,
  MapPin,
  User as UserIcon,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "./../ui/table";
import Badge from "../ui/badge/Badge";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Link from "next/link";

interface Transaction {
  id: string;
  paymentIntentId: string;
  chargeId?: string;
  amount: number;
  amountCaptured: number;
  currency: string;
  status: string;
  created: string;
  customerId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  stripeCustomer: any;
  stripeShipping: any;
  orderId?: string;
  localOrder: {
    id: string;
    status: string;
    createdAt: string;
    shippingName: string;
    shippingAddress: any;
    rawShippingAddress: string;
  } | null;
  localUser: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    stripeCustomerId: string | null;
  } | null;
  productDescription: string;
  shippingAddress: string | null;
  description: string | null;
  paymentMethod: string;
  receiptUrl: string | null;
  fee: number;
  netAmount: number;
  metadata: Record<string, string>;
}

type StatusFilter =
  | "all"
  | "succeeded"
  | "processing"
  | "requires_payment_method"
  | "canceled";

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<StatusFilter>("all");
  const pageSize = 10;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/stripe/transactions?limit=100");

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        `Failed to fetch transactions: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (activeTab !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === activeTab,
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (transaction) =>
          transaction.id.toLowerCase().includes(searchLower) ||
          transaction.paymentIntentId.toLowerCase().includes(searchLower) ||
          transaction.chargeId?.toLowerCase().includes(searchLower) ||
          transaction.customerEmail?.toLowerCase().includes(searchLower) ||
          transaction.customerName?.toLowerCase().includes(searchLower) ||
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.orderId?.toLowerCase().includes(searchLower) ||
          transaction.localUser?.name?.toLowerCase().includes(searchLower) ||
          transaction.localUser?.firstName
            ?.toLowerCase()
            .includes(searchLower) ||
          transaction.localUser?.lastName
            ?.toLowerCase()
            .includes(searchLower) ||
          transaction.localUser?.email.toLowerCase().includes(searchLower) ||
          transaction.productDescription.toLowerCase().includes(searchLower) ||
          transaction.shippingAddress?.toLowerCase().includes(searchLower) ||
          transaction.localOrder?.shippingName
            ?.toLowerCase()
            .includes(searchLower),
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
    );
  }, [transactions, activeTab, searchTerm]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  const formatAmount = useCallback(
    (amount: number, currency: string): string => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amount / 100);
    },
    [],
  );

  const getStatusBadgeColor = useCallback((status: string) => {
    switch (status) {
      case "succeeded":
        return "success";
      case "processing":
        return "warning";
      case "requires_payment_method":
        return "error";
      case "requires_action":
        return "warning";
      case "canceled":
        return "error";
      default:
        return "default";
    }
  }, []);

  const getStatusDisplayText = useCallback((status: string) => {
    switch (status) {
      case "succeeded":
        return "Completed";
      case "processing":
        return "Processing";
      case "requires_payment_method":
        return "Payment Failed";
      case "requires_action":
        return "Action Required";
      case "canceled":
        return "Canceled";
      default:
        return status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }, []);

  const getCustomerDisplayName = useCallback(
    (transaction: Transaction): string => {
      if (transaction.localUser) {
        if (transaction.localUser.firstName && transaction.localUser.lastName) {
          return `${transaction.localUser.firstName} ${transaction.localUser.lastName}`;
        }
        if (transaction.localUser.name) {
          return transaction.localUser.name;
        }
        return transaction.localUser.email;
      }

      if (transaction.customerName) {
        return transaction.customerName;
      }

      if (transaction.customerEmail) {
        return transaction.customerEmail;
      }

      return "Unknown Customer";
    },
    [],
  );

  const getCustomerEmail = useCallback((transaction: Transaction): string => {
    return (
      transaction.localUser?.email || transaction.customerEmail || "No email"
    );
  }, []);

  const getOrderStatusBadgeColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "pending":
        return "warning";
      case "failed":
      case "canceled":
        return "error";
      default:
        return "default";
    }
  }, []);

  const tabStats = useMemo(() => {
    const tabTransactions = filteredTransactions;
    return {
      total: tabTransactions.length,
      totalAmount: tabTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      ),
      totalFees: tabTransactions.reduce(
        (sum, transaction) => sum + transaction.fee,
        0,
      ),
      totalNet: tabTransactions.reduce(
        (sum, transaction) => sum + transaction.netAmount,
        0,
      ),
      succeeded: tabTransactions.filter((t) => t.status === "succeeded").length,
      withLocalData: tabTransactions.filter((t) => t.localOrder).length,
      withShipping: tabTransactions.filter((t) => t.shippingAddress).length,
    };
  }, [filteredTransactions]);

  const tabs = useMemo(
    () => [
      {
        key: "all" as StatusFilter,
        label: "All Transactions",
        count: transactions.length,
      },
      {
        key: "succeeded" as StatusFilter,
        label: "Completed",
        count: transactions.filter((t) => t.status === "succeeded").length,
      },
      {
        key: "processing" as StatusFilter,
        label: "Processing",
        count: transactions.filter((t) => t.status === "processing").length,
      },
      {
        key: "requires_payment_method" as StatusFilter,
        label: "Failed",
        count: transactions.filter(
          (t) => t.status === "requires_payment_method",
        ).length,
      },
    ],
    [transactions],
  );

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-20 shadow-sm">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
        <p className="font-medium text-gray-600">Loading transactions...</p>
        <p className="mt-1 text-sm text-gray-400">
          Please wait while we fetch the transaction data
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-6 p-2 font-sans duration-500">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Transaction Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Monitor payments, orders, and customer transactions.
            </p>
          </div>
          <div className="mt-3 flex gap-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTransactions()}
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
              <CreditCard className="h-16 w-16 text-gray-500" />
            </div>
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                  <CreditCard className="h-4 w-4 text-gray-600" />
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
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                  Volume
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-800">
                {formatAmount(tabStats.totalAmount, "usd")}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-green-100/60 bg-green-50/20 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg border border-green-100 bg-green-100/40 p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-green-700 uppercase">
                  Successful
                </span>
              </div>
              <p className="text-2xl font-bold text-green-800">
                {tabStats.succeeded}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-blue-100/60 bg-blue-50/20 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg border border-blue-100 bg-blue-100/40 p-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-blue-700 uppercase">
                  With Shipping
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-800">
                {tabStats.withShipping}
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
            placeholder="Search transactions, customers, orders, shipping..."
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
        {loading && transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600"></div>
            <p className="text-gray-500">Loading transaction data...</p>
          </div>
        ) : (
          <div className="w-full min-w-[1400px]">
            <Table>
              <TableHeader className="border-b border-gray-200 bg-gray-100/70">
                <TableRow className="hover:bg-transparent">
                  <TableCell isHeader className="w-[20%] pl-6">
                    Transaction Details
                  </TableCell>
                  <TableCell isHeader className="w-[15%]">
                    Amount & Fees
                  </TableCell>
                  <TableCell isHeader className="w-[15%]">
                    Status
                  </TableCell>
                  <TableCell isHeader className="w-[20%]">
                    Customer
                  </TableCell>
                  <TableCell isHeader className="w-[15%]">
                    Order & Products
                  </TableCell>
                  <TableCell isHeader className="w-[15%]">
                    Date
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
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <div className="flex w-full flex-col items-center px-6 py-16 text-center">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        No transactions found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search or filter criteria.
                      </p>
                    </div>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="group border-b border-gray-100 transition-colors hover:bg-gray-50/60"
                    >
                      <TableCell className="w-[20%] pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B0000] to-red-700 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                            {transaction.id.slice(-2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-grow">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {transaction.id}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge
                                size="sm"
                                color="default"
                                className="text-xs font-medium"
                              >
                                {transaction.paymentMethod
                                  .replace(/_/g, " ")
                                  .toUpperCase()}
                              </Badge>
                              {transaction.chargeId && (
                                <span className="truncate text-xs text-gray-500">
                                  Charge: {transaction.chargeId.slice(-8)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <div className="space-y-1">
                          <span className="block text-sm font-semibold text-gray-900">
                            {formatAmount(
                              transaction.amount,
                              transaction.currency,
                            )}
                          </span>
                          {transaction.fee > 0 && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Fee:</span>{" "}
                              {formatAmount(
                                transaction.fee,
                                transaction.currency,
                              )}
                            </div>
                          )}
                          {transaction.netAmount > 0 && (
                            <div className="text-xs font-medium text-green-600">
                              <span className="text-gray-600">Net:</span>{" "}
                              {formatAmount(
                                transaction.netAmount,
                                transaction.currency,
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <div className="space-y-2">
                          <Badge
                            size="sm"
                            color={getStatusBadgeColor(transaction.status)}
                            className="gap-1.5 border pr-2.5 pl-1.5 font-medium shadow-sm"
                          >
                            {transaction.status === "succeeded" ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : transaction.status === "processing" ? (
                              <RefreshCw className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {getStatusDisplayText(transaction.status)}
                          </Badge>

                          {transaction.localOrder && (
                            <Badge
                              size="sm"
                              color={getOrderStatusBadgeColor(
                                transaction.localOrder.status,
                              )}
                              className="border font-medium shadow-sm"
                            >
                              Order: {transaction.localOrder.status}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="w-[20%]">
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {getCustomerDisplayName(transaction)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {getCustomerEmail(transaction)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {transaction.localUser ? (
                              <div className="flex items-center rounded-md border border-green-100 bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                <UserIcon className="mr-1 h-3 w-3" />
                                Registered User
                              </div>
                            ) : (
                              <div className="flex items-center rounded-md border border-red-100 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                <XCircle className="mr-1 h-3 w-3" />
                                Guest Checkout
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        {transaction.orderId ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/orders/${transaction.orderId}`}
                                className="flex items-center gap-1 text-sm font-medium text-[#8B0000] hover:underline"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                Order: {transaction.orderId.slice(-8)}
                              </Link>
                            </div>
                            {transaction.productDescription && (
                              <div className="line-clamp-2 text-xs text-gray-600">
                                {transaction.productDescription}
                              </div>
                            )}
                            {transaction.shippingAddress && (
                              <div className="flex items-center text-xs text-blue-600">
                                <Truck className="mr-1 h-3 w-3" />
                                Shipping
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center text-xs text-gray-500 italic">
                            <XCircle className="mr-1 h-3 w-3" />
                            No order linked
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-600">
                            {new Date(transaction.created).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(transaction.created).toLocaleTimeString(
                              undefined,
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%] border-l border-gray-100 bg-gray-50/50 pr-6 text-right transition-colors group-hover:bg-gray-100/70">
                        <div className="flex items-center justify-end gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                          <div className="flex items-center gap-1">
                            {transaction.receiptUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  window.open(transaction.receiptUrl!, "_blank")
                                }
                                className="h-9 w-9 rounded-lg border border-gray-200 p-0 text-gray-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                title="View Receipt"
                              >
                                <FileText className="h-4.5 w-4.5" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                navigator.clipboard.writeText(transaction.id)
                              }
                              className="h-9 w-9 rounded-lg border border-gray-200 p-0 text-gray-600 transition-all hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600"
                              title="Copy Transaction ID"
                            >
                              <Copy className="h-4.5 w-4.5" />
                            </Button>

                            {transaction.localUser && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  navigator.clipboard.writeText(
                                    transaction.localUser!.email,
                                  )
                                }
                                className="h-9 w-9 rounded-lg border border-gray-200 p-0 text-gray-600 transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-600"
                                title="Copy Customer Email"
                              >
                                <Mail className="h-4.5 w-4.5" />
                              </Button>
                            )}

                            {transaction.shippingAddress && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  navigator.clipboard.writeText(
                                    transaction.shippingAddress!,
                                  )
                                }
                                className="h-9 w-9 rounded-lg border border-gray-200 p-0 text-gray-600 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                                title="Copy Shipping Address"
                              >
                                <MapPin className="h-4.5 w-4.5" />
                              </Button>
                            )}
                          </div>
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
            {Math.min(currentPage * pageSize, filteredTransactions.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">
            {filteredTransactions.length}
          </span>{" "}
          transactions
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

      {error && (
        <div className="overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold text-red-800">Error</h3>
              <p className="mb-4 text-red-600">{error}</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setError(null);
                    fetchTransactions();
                  }}
                  className="rounded-xl bg-[#8B0000] px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-[#a50000]"
                >
                  Retry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setError(null)}
                  className="rounded-xl border-red-600 px-6 py-2.5 font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
