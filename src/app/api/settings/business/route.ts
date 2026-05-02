import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessContext } from "@/lib/context";

export async function GET() {
  try {
    const { businessId } = await requireBusinessContext();
    
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    
    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: business });
  } catch (error) {
    console.error("GET /api/settings/business error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { businessId } = await requireBusinessContext();
    const body = await req.json();
    
    const { name, email, phone, address, logoUrl, currency } = body;
    
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        name,
        email,
        phone,
        address,
        logoUrl,
        currency,
      },
    });
    
    return NextResponse.json({ success: true, data: business });
  } catch (error) {
    console.error("PATCH /api/settings/business error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
