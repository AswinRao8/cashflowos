import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessContext } from "@/lib/context";

export async function GET() {
  try {
    const { businessId } = await requireBusinessContext();
    
    const quotes = await prisma.quote.findMany({
      where: { businessId },
      include: {
        lead: true,
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ success: true, data: quotes });
  } catch (error) {
    console.error("GET /api/quotes error:", error);
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
      quoteNumber, 
      issueDate, 
      expiryDate, 
      currency, 
      totalAmount, 
      taxAmount, 
      notes,
      leadId,
      lineItems 
    } = body;
    
    if (!customerName || !quoteNumber || !issueDate || !totalAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const result = await prisma.$transaction(async (tx: any) => {
      const quote = await tx.quote.create({
        data: {
          businessId,
          customerName,
          customerEmail,
          quoteNumber,
          issueDate: new Date(issueDate),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
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
            parentId: quote.id,
            parentType: "QUOTE",
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            total: item.total,
          })),
        });
      }
      
      return quote;
    });
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("POST /api/quotes error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
