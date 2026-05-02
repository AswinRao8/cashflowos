import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessContext } from "@/lib/context";
import { addDays } from "date-fns";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessId } = await requireBusinessContext();
    const { id: quoteId } = await params;

    // 1. Fetch quote and its line items
    const quote = await prisma.quote.findUnique({
      where: {
        id: quoteId,
        businessId,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    const lineItems = await prisma.lineItem.findMany({
      where: {
        businessId,
        parentId: quoteId,
        parentType: "QUOTE",
      },
    });

    // 2. Create invoice and copy line items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update quote status to ACCEPTED
      await tx.quote.update({
        where: { id: quoteId },
        data: { status: "ACCEPTED" },
      });

      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          businessId,
          quoteId: quote.id,
          leadId: quote.leadId,
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          invoiceNumber: `INV-${quote.quoteNumber}`, // Basic logic for invoice number
          status: "DRAFT",
          issueDate: new Date(),
          dueDate: addDays(new Date(), 30), // Default 30 days due date
          currency: quote.currency,
          totalAmount: quote.totalAmount,
          taxAmount: quote.taxAmount,
          notes: quote.notes,
        },
      });

      // Copy Line Items
      if (lineItems.length > 0) {
        await tx.lineItem.createMany({
          data: lineItems.map((item) => ({
            businessId,
            parentId: invoice.id,
            parentType: "INVOICE",
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            total: item.total,
          })),
        });
      }

      return invoice;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("POST /api/quotes/[id]/convert error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
