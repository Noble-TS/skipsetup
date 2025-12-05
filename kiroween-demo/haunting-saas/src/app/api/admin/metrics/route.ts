import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalUsers = await db.user.count();

    const currentMonthUsers = await db.user.count({
      where: {
        createdAt: {
          gte: currentMonthStart,
        },
      },
    });

    const previousMonthUsers = await db.user.count({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    });

    const userGrowth =
      previousMonthUsers > 0
        ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
        : currentMonthUsers > 0
          ? 100
          : 0;

    const totalOrders = await db.order.count({
      where: {
        status: "PAID",
      },
    });

    const currentMonthOrders = await db.order.count({
      where: {
        status: "PAID",
        createdAt: {
          gte: currentMonthStart,
        },
      },
    });

    const previousMonthOrders = await db.order.count({
      where: {
        status: "PAID",
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    });

    const orderGrowth =
      previousMonthOrders > 0
        ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) *
          100
        : currentMonthOrders > 0
          ? 100
          : 0;

    let totalRevenue = 0;
    let currentMonthRevenue = 0;
    let previousMonthRevenue = 0;

    try {
      const currentMonthPaymentIntents = await stripe.paymentIntents.list({
        created: {
          gte: Math.floor(currentMonthStart.getTime() / 1000),
        },
        status: "succeeded",
        limit: 100,
      });

      const previousMonthPaymentIntents = await stripe.paymentIntents.list({
        created: {
          gte: Math.floor(previousMonthStart.getTime() / 1000),
          lte: Math.floor(previousMonthEnd.getTime() / 1000),
        },
        status: "succeeded",
        limit: 100,
      });

      // Calculate revenue
      currentMonthRevenue = currentMonthPaymentIntents.data.reduce(
        (sum, pi) => sum + pi.amount,
        0,
      );

      previousMonthRevenue = previousMonthPaymentIntents.data.reduce(
        (sum, pi) => sum + pi.amount,
        0,
      );

      // Get total revenue (all successful payments)
      const allPaymentIntents = await stripe.paymentIntents.list({
        status: "succeeded",
        limit: 100,
      });

      totalRevenue = allPaymentIntents.data.reduce(
        (sum, pi) => sum + pi.amount,
        0,
      );
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      // Fallback to database if Stripe fails
      const revenueData = await db.order.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      });
      totalRevenue = revenueData._sum.amount || 0;
    }

    const revenueGrowth =
      previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) /
            previousMonthRevenue) *
          100
        : currentMonthRevenue > 0
          ? 100
          : 0;

    // Fetch transaction metrics
    let totalTransactions = 0;
    let currentMonthTransactions = 0;
    let previousMonthTransactions = 0;

    try {
      const allTransactions = await stripe.paymentIntents.list({
        status: "succeeded",
        limit: 100,
      });
      totalTransactions = allTransactions.data.length;

      const currentMonthTransactionsData = await stripe.paymentIntents.list({
        created: {
          gte: Math.floor(currentMonthStart.getTime() / 1000),
        },
        status: "succeeded",
        limit: 100,
      });
      currentMonthTransactions = currentMonthTransactionsData.data.length;

      const previousMonthTransactionsData = await stripe.paymentIntents.list({
        created: {
          gte: Math.floor(previousMonthStart.getTime() / 1000),
          lte: Math.floor(previousMonthEnd.getTime() / 1000),
        },
        status: "succeeded",
        limit: 100,
      });
      previousMonthTransactions = previousMonthTransactionsData.data.length;
    } catch (stripeError) {
      console.error("Stripe transactions error:", stripeError);
      // Fallback to database
      totalTransactions = await db.order.count({
        where: { status: "PAID" },
      });
      currentMonthTransactions = await db.order.count({
        where: {
          status: "PAID",
          createdAt: { gte: currentMonthStart },
        },
      });
      previousMonthTransactions = await db.order.count({
        where: {
          status: "PAID",
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
      });
    }

    const transactionGrowth =
      previousMonthTransactions > 0
        ? ((currentMonthTransactions - previousMonthTransactions) /
            previousMonthTransactions) *
          100
        : currentMonthTransactions > 0
          ? 100
          : 0;

    const metrics = {
      users: {
        total: totalUsers,
        growth: userGrowth,
        currentMonth: currentMonthUsers,
        previousMonth: previousMonthUsers,
      },
      orders: {
        total: totalOrders,
        growth: orderGrowth,
        currentMonth: currentMonthOrders,
        previousMonth: previousMonthOrders,
      },
      revenue: {
        total: totalRevenue,
        growth: revenueGrowth,
        currentMonth: currentMonthRevenue,
        previousMonth: previousMonthRevenue,
      },
      transactions: {
        total: totalTransactions,
        growth: transactionGrowth,
        currentMonth: currentMonthTransactions,
        previousMonth: previousMonthTransactions,
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error(" Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
