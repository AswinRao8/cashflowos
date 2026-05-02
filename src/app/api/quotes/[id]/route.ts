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

    const quote = await prisma.quote.findUnique({
      where: {
        id,
        businessId,
      },
      include: {
        lead: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    // Fetch line items separately due to current schema design
    const lineItems = await prisma.lineItem.findMany({
      where: {
        businessId,
        parentId: id,
        parentType: "QUOTE",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...quote,
        lineItems,
      },
    });
  } catch (error) {
    console.error("GET /api/quotes/[id] error:", error);
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

    const quote = await prisma.quote.update({
      where: {
        id,
        businessId,
      },
      data: {
        status,
        ...rest,
      },
    });

    return NextResponse.json({ success: true, data: quote });
  } catch (error) {
    console.error("PATCH /api/quotes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
