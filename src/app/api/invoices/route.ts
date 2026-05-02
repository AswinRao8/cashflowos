import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessContext } from "@/lib/context";

export async function GET() {
  try {
    const { businessId } = await requireBusinessContext();
    
    const invoices = await prisma.invoice.findMany({
      where: { businessId },
      include: {
        lead: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { businessId } = await requireBusinessContext();
    const body = await req.json();
    
    const { 
      customerName, 
      customerEmail, 
      invoiceNumber, 
      issueDate, 
      dueDate, 
      currency, 
      totalAmount, 
      taxAmount, 
      notes,
      leadId,
      lineItems 
    } = body;
    
    if (!customerName || !invoiceNumber || !issueDate || !dueDate || !totalAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create invoice and line items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          businessId,
          customerName,
          customerEmail,
          invoiceNumber,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          currency: currency || "USD",
          totalAmount,
          taxAmount: taxAmount || 0,
          notes,
          leadId,
          status: "DRAFT",
        },
      });

      if (lineItems && Array.isArray(lineItems)) {
        await tx.lineItem.createMany({
          data: lineItems.map((item: any) => ({
            businessId,
            parentId: invoice.id,
            parentType: "INVOICE",
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            total: item.total,
          })),
        });
      }
      
      return invoice;
    });
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
