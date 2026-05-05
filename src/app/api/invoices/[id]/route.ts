export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessContext } from "@/lib/context";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessId } = await requireBusinessContext();
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: {
        id,
        businessId,
      },
      include: {
        lead: true,
        quote: true,
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Fetch line items separately
    const lineItems = await prisma.lineItem.findMany({
      where: {
        businessId,
        parentId: id,
        parentType: "INVOICE",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        lineItems,
      },
    });
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessId } = await requireBusinessContext();
    const { id } = await params;
    const body = await req.json();
    const { status, ...rest } = body;

    const invoice = await prisma.invoice.update({
      where: {
        id,
        businessId,
      },
      data: {
        status,
        ...rest,
      },
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error("PATCH /api/invoices/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
