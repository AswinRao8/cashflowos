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

    const lead = await prisma.lead.findUnique({
      where: {
        id,
        businessId,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error("GET /api/leads/[id] error:", error);
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

    const lead = await prisma.lead.update({
      where: {
        id,
        businessId,
      },
      data: body,
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error("PATCH /api/leads/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessId } = await requireBusinessContext();
    const { id } = await params;

    await prisma.lead.delete({
      where: {
        id,
        businessId,
      },
    });

    return NextResponse.json({ success: true, message: "Lead deleted" });
  } catch (error) {
    console.error("DELETE /api/leads/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
