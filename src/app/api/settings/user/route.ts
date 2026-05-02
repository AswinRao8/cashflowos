import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessContext } from "@/lib/context";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const { userId, businessId } = await requireBusinessContext();
    
    const user = await prisma.user.findUnique({
      where: { id: userId, businessId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        businessId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("GET /api/settings/user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, businessId } = await requireBusinessContext();
    const body = await req.json();
    
    const { name, email, password } = body;
    
    const data: any = { name, email };
    
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    
    const user = await prisma.user.update({
      where: { id: userId, businessId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        businessId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("PATCH /api/settings/user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
