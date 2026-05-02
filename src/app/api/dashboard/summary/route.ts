import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessContext } from "@/lib/context";
import { startOfMonth } from "date-fns";

export async function GET() {
  try {
    const { businessId } = await requireBusinessContext();
    
    const now = new Date();
    const monthStart = startOfMonth(now);
    
    // 1. Monthly Revenue (Total of PAID invoices this month)
    const monthlyRevenueData = await prisma.invoice.aggregate({
      where: {
        businessId,
        status: "PAID",
        updatedAt: {
          gte: monthStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });
    
    // 2. Outstanding Payments (SENT, VIEWED)
    const outstandingPaymentsData = await prisma.invoice.aggregate({
      where: {
        businessId,
        status: {
          in: ["SENT", "VIEWED"],
        },
      },
      _sum: {
        totalAmount: true,
      },
    });
    
    // 3. Overdue Invoices
    const overdueInvoicesData = await prisma.invoice.aggregate({
      where: {
        businessId,
        status: "OVERDUE",
      },
      _sum: {
        totalAmount: true,
      },
    });
    
    // 4. Conversion Rate (Leads to Won status)
    const totalLeads = await prisma.lead.count({
      where: { businessId },
    });
    
    const wonLeads = await prisma.lead.count({
      where: {
        businessId,
        status: "WON",
      },
    });
    
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        monthlyRevenue: Number(monthlyRevenueData._sum.totalAmount || 0),
        outstandingPayments: Number(outstandingPaymentsData._sum.totalAmount || 0),
        overdueInvoices: Number(overdueInvoicesData._sum.totalAmount || 0),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/summary error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
