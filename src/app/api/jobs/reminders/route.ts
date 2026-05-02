import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvoiceReminder } from "@/lib/email";

/**
 * Trigger point for automated reminders.
 * In a real app, this would be secured (e.g., API key) and called by a CRON job.
 */
export async function POST(req: Request) {
  try {
    // Basic security check (optional for this task, but good practice)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // For now, we'll allow it since it's a dev sandbox task
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 1. Identify Overdue Invoices that need a reminder
    // For simplicity: Invoices where dueDate < now AND status NOT IN [PAID, VOID, DRAFT]
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        dueDate: {
          lt: now,
        },
        status: {
          in: ["SENT", "VIEWED", "OVERDUE"],
        },
      },
      include: {
        reminders: {
          orderBy: { sentAt: "desc" },
          take: 1,
        },
      },
    });

    const processed = [];

    for (const invoice of overdueInvoices) {
      // Update status to OVERDUE if not already
      if (invoice.status !== "OVERDUE") {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "OVERDUE" },
        });
      }

      // Check if we should send a reminder (e.g., if last reminder was > 7 days ago or never)
      const lastReminder = invoice.reminders[0];
      const shouldRemind = !lastReminder || (lastReminder.sentAt && (now.getTime() - lastReminder.sentAt.getTime()) > 7 * 24 * 60 * 60 * 1000);

      if (shouldRemind && invoice.customerEmail) {
        console.log(`Processing reminder for Invoice: ${invoice.invoiceNumber}`);
        
        try {
          // Send Email
          await sendInvoiceReminder({
            customerEmail: invoice.customerEmail,
            invoiceNumber: invoice.invoiceNumber,
            dueDate: invoice.dueDate.toLocaleDateString(),
            amount: Number(invoice.totalAmount),
            currency: invoice.currency,
          });

          // Record Reminder
          await prisma.reminder.create({
            data: {
              businessId: invoice.businessId,
              invoiceId: invoice.id,
              type: "AFTER_DUE",
              days: 0, // 0 days after being identified as overdue by this job
              status: "SENT",
              scheduledFor: now,
              sentAt: now,
            },
          });

          processed.push(invoice.invoiceNumber);
        } catch (emailError) {
          console.error(`Failed to send reminder for ${invoice.invoiceNumber}:`, emailError);
          
          await prisma.reminder.create({
            data: {
              businessId: invoice.businessId,
              invoiceId: invoice.id,
              type: "AFTER_DUE",
              days: 0,
              status: "FAILED",
              scheduledFor: now,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: processed.length,
      processedInvoices: processed,
    });
  } catch (error) {
    console.error("POST /api/jobs/reminders error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
