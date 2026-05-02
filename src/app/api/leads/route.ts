import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessContext } from "@/lib/context";

export async function GET() {
  try {
    const { businessId } = await requireBusinessContext();
    
    const leads = await prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error("GET /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { businessId } = await requireBusinessContext();
    const body = await req.json();
    
    const { firstName, lastName, email, phone, notes } = body;
    
    if (!firstName) {
      return NextResponse.json(
        { success: false, error: "First name is required" },
        { status: 400 }
      );
    }
    
    const lead = await prisma.lead.create({
      data: {
        businessId,
        firstName,
        lastName,
        email,
        phone,
        notes,
        status: "NEW",
      },
    });
    
    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error("POST /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
