import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessName, name, email, password } = body;

    if (!businessName || !name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // 2. Create business and user in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const business = await tx.business.create({
        data: {
          name: businessName,
          email: email, // Use user email as initial business contact email
        },
      });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          role: "ADMIN",
          businessId: business.id,
        },
      });

      return { user, business };
    });

    return NextResponse.json({
      success: true,
      message: "Business and user created successfully",
      data: {
        userId: result.user.id,
        businessId: result.business.id,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error during signup" },
      { status: 500 }
    );
  }
}
